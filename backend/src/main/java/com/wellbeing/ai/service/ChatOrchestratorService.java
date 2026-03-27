package com.wellbeing.ai.service;

import com.wellbeing.ai.ai.ClassifierResult;
import com.wellbeing.ai.ai.EmotionClassifierClient;
import com.wellbeing.ai.ai.IndicatorClassifierClient;
import com.wellbeing.ai.dto.ChatResponse;
import com.wellbeing.ai.dto.RecommendationDTO;
import com.wellbeing.ai.entity.ChatMessage;
import com.wellbeing.ai.entity.ChatSession;
import com.wellbeing.ai.entity.MessageAiMetadata;
import com.wellbeing.ai.repository.ChatMessageRepository;
import com.wellbeing.ai.repository.ChatSessionRepository;
import com.wellbeing.ai.repository.MetadataRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class ChatOrchestratorService {

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final MetadataRepository metadataRepo;

    private final EmotionClassifierClient emotionClient;
    private final IndicatorClassifierClient indicatorClient;

    private final DecisionRuleService decisionRules;
    private final RecommendationService recommendationService;
    private final OpenAiService openAiService;

    public ChatOrchestratorService(
            ChatSessionRepository sessionRepo,
            ChatMessageRepository messageRepo,
            MetadataRepository metadataRepo,
            EmotionClassifierClient emotionClient,
            IndicatorClassifierClient indicatorClient,
            DecisionRuleService decisionRules,
            RecommendationService recommendationService,
            OpenAiService openAiService
    ) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
        this.metadataRepo = metadataRepo;
        this.emotionClient = emotionClient;
        this.indicatorClient = indicatorClient;
        this.decisionRules = decisionRules;
        this.recommendationService = recommendationService;
        this.openAiService = openAiService;
    }

    @Transactional
    public ChatResponse handleUserMessage(String sessionId, String userText) {

        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        ChatMessage userMsg = ChatMessage.builder()
                .id(UUID.randomUUID().toString())
                .session(session)
                .role(ChatMessage.Role.user)
                .content(userText)
                .createdAt(Instant.now())
                .build();
        messageRepo.save(userMsg);


        if (session.getTitle() == null || session.getTitle().isBlank() || "New chat".equals(session.getTitle())) {
            String title = userText.length() > 60 ? userText.substring(0, 60) : userText;
            session.setTitle(title);
        }
        session.setUpdatedAt(Instant.now());
        sessionRepo.save(session);
        ClassifierResult emotion = emotionClient.predict(userText);
        ClassifierResult indicator = indicatorClient.predict(userText);

        String indicatorRawLabel = decisionRules.normalizeRawLabel(indicator.label());
        MessageAiMetadata.IndicatorGroup indicatorGroup = decisionRules.toIndicatorGroup(indicatorRawLabel);
        MessageAiMetadata.IndicatorLevel indicatorLevel =
                decisionRules.indicatorLevel(indicatorGroup, indicator.confidence());
        MessageAiMetadata.ImpactLevel impactLevel =
                decisionRules.impactLevel(emotion.label(), emotion.confidence());
        impactLevel = decisionRules.overrideImpactForCrisis(impactLevel, indicatorGroup);

        boolean crisisKeywordHit = decisionRules.looksLikeCrisisText(userText);
        if (crisisKeywordHit) {
            indicatorRawLabel = "Crisis";
            indicatorGroup = MessageAiMetadata.IndicatorGroup.CRISIS;
            indicatorLevel = MessageAiMetadata.IndicatorLevel.ELEVATED_STRONG;
            impactLevel = MessageAiMetadata.ImpactLevel.HIGH;
        }

        List<RecommendationDTO> recs = recommendationService.recommend(
                indicatorGroup, indicatorLevel, impactLevel, emotion.label()
        );

        MessageAiMetadata meta = MessageAiMetadata.builder()
                .message(userMsg)
                .emotionLabel(emotion.label())
                .emotionConfidence(BigDecimal.valueOf(emotion.confidence()))
                .impactLevel(impactLevel)
                .indicatorLabel(indicatorRawLabel)
                .indicatorGroup(indicatorGroup)
                .indicatorLevel(indicatorLevel)
                .indicatorConfidence(BigDecimal.valueOf(indicator.confidence()))
                .createdAt(Instant.now())
                .build();
        metadataRepo.save(meta);

        boolean previousAssistantAskedQuestion = previousAssistantAskedQuestion(sessionId);
        String responseStyle = decisionRules.responseStyle(indicatorGroup, indicatorLevel, impactLevel);

        String systemPrompt = indicatorGroup == MessageAiMetadata.IndicatorGroup.CRISIS
                ? crisisSystemPrompt()
                : normalSystemPrompt();

        String contextBlock = """
                Internal context:
                - detected_emotion=%s
                - impact_level=%s
                - indicator_group=%s
                - indicator_level=%s
                - response_style=%s
                - previous_assistant_asked_question=%s
                - suggested_recommendations=%s

                Use this only to shape tone and helpfulness.
                If previous_assistant_asked_question is true, prefer not asking another question unless necessary.
                Keep the response conversational and brief.
                """.formatted(
                emotion.label(),
                impactLevel.name(),
                indicatorGroup.name(),
                indicatorLevel.name(),
                responseStyle,
                previousAssistantAskedQuestion,
                recs.stream().map(RecommendationDTO::title).toList()
        );

        String memoryBlock = buildConversationMemory(sessionId);

        String assistantText = openAiService.generateReply(
                systemPrompt,
                contextBlock,
                memoryBlock,
                userText
        );

        ChatMessage assistantMsg = ChatMessage.builder()
                .id(UUID.randomUUID().toString())
                .session(session)
                .role(ChatMessage.Role.assistant)
                .content(assistantText)
                .createdAt(Instant.now())
                .build();
        messageRepo.save(assistantMsg);

        return new ChatResponse(
                sessionId,
                assistantText,
                emotion.label(),
                impactLevel.name(),
                indicatorRawLabel,
                indicatorGroup.name(),
                indicatorLevel.name(),
                recs
        );
    }

    private String normalSystemPrompt() {
        return """
                You are a warm, emotionally supportive wellbeing assistant.

                Rules:
                - Reply like a natural human conversation.
                - Keep the reply short, usually 2 to 4 sentences.
                - Start by acknowledging the user's feeling.
                - Do not ask a follow-up question in every reply.
                - Ask a question only when it feels natural and useful.
                - Many replies should simply validate, reflect, or gently support without asking anything.
                - If the previous assistant message already asked a question, avoid asking another one immediately unless necessary.
                - Do not give too many suggestions at once.
                - Do not use bullet points unless there is immediate safety concern.
                - Do not sound like a therapist, doctor, or lecturer.
                - Do not mention internal labels, classifications, or model results.
                - If the user seems stressed, overwhelmed, sad, or afraid, respond with empathy first.
                - If suitable, you may ask one simple follow-up question, but only sometimes.
                - Never use pet names like sweetie, dear, honey, darling, or similar.
                - Keep the tone caring, respectful, and calm.
                """;
    }

    private String crisisSystemPrompt() {
        return """
                You are a supportive wellbeing assistant responding to a possible crisis message.

                Rules:
                - Be calm, direct, caring, and respectful.
                - Acknowledge the pain clearly.
                - Encourage immediate real-world support right now.
                - Encourage contacting a trusted person, local emergency services, or a crisis helpline now.
                - Do not be overly wordy.
                - Do not act casual.
                - Do not ask multiple reflective questions.
                - You may ask one immediate safety question such as whether they are alone or in immediate danger.
                - Never use pet names like sweetie, dear, honey, darling, or similar.
                - Do not mention internal labels, classifications, or model results.
                """;
    }

    private String buildConversationMemory(String sessionId) {
        List<ChatMessage> recentMessages = messageRepo.findTop10BySession_IdOrderByCreatedAtDesc(sessionId);

        if (recentMessages == null || recentMessages.isEmpty()) {
            return "Recent conversation: none";
        }

        List<ChatMessage> orderedMessages = recentMessages.stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
                .toList();

        StringBuilder sb = new StringBuilder("Recent conversation:\n");

        for (ChatMessage message : orderedMessages) {
            String role = message.getRole() == ChatMessage.Role.user ? "USER" : "ASSISTANT";
            String content = message.getContent() == null ? "" : message.getContent().trim();

            if (content.length() > 300) {
                content = content.substring(0, 300);
            }

            sb.append(role)
                    .append(": ")
                    .append(content)
                    .append("\n");
        }

        return sb.toString();
    }

    private boolean previousAssistantAskedQuestion(String sessionId) {
        List<ChatMessage> recentMessages = messageRepo.findTop2BySession_IdOrderByCreatedAtDesc(sessionId);

        if (recentMessages == null || recentMessages.isEmpty()) {
            return false;
        }

        return recentMessages.stream()
                .filter(message -> message.getRole() == ChatMessage.Role.assistant)
                .findFirst()
                .map(message -> {
                    String content = message.getContent();
                    return content != null && content.contains("?");
                })
                .orElse(false);
    }
}