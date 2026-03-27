package com.wellbeing.ai.service;

import com.wellbeing.ai.dto.ChatMessageViewResponse;
import com.wellbeing.ai.dto.ChatSessionMessagesResponse;
import com.wellbeing.ai.dto.ChatSessionSummaryResponse;
import com.wellbeing.ai.entity.ChatSession;
import com.wellbeing.ai.repository.ChatMessageRepository;
import com.wellbeing.ai.repository.ChatSessionRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ChatSessionService {

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;

    public ChatSessionService(
            ChatSessionRepository sessionRepo,
            ChatMessageRepository messageRepo
    ) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
    }

    public ChatSessionSummaryResponse createSession() {
        Instant now = Instant.now();

        ChatSession session = ChatSession.builder()
                .id(UUID.randomUUID().toString())
                .title("New chat")
                .createdAt(now)
                .updatedAt(now)
                .build();

        sessionRepo.save(session);

        return new ChatSessionSummaryResponse(
                session.getId(),
                session.getTitle(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    public List<ChatSessionSummaryResponse> listSessions() {
        return sessionRepo.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(session -> new ChatSessionSummaryResponse(
                        session.getId(),
                        session.getTitle(),
                        session.getCreatedAt(),
                        session.getUpdatedAt()
                ))
                .toList();
    }

    public ChatSessionMessagesResponse getSessionMessages(String sessionId) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        List<ChatMessageViewResponse> messages = messageRepo.findBySession_IdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(message -> new ChatMessageViewResponse(
                        message.getId(),
                        message.getRole().name(),
                        message.getContent(),
                        message.getCreatedAt()
                ))
                .toList();

        return new ChatSessionMessagesResponse(session.getId(), messages);
    }
}