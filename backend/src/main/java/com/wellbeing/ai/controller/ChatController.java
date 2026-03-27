package com.wellbeing.ai.controller;

import com.wellbeing.ai.dto.ChatResponse;
import com.wellbeing.ai.dto.ChatSessionMessagesResponse;
import com.wellbeing.ai.dto.ChatSessionSummaryResponse;
import com.wellbeing.ai.service.ChatOrchestratorService;
import com.wellbeing.ai.service.ChatSessionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    private final ChatOrchestratorService orchestrator;
    private final ChatSessionService chatSessionService;

    public ChatController(
            ChatOrchestratorService orchestrator,
            ChatSessionService chatSessionService
    ) {
        this.orchestrator = orchestrator;
        this.chatSessionService = chatSessionService;
    }

    @PostMapping("/send")
    public ChatResponse sendMessage(
            @RequestParam String sessionId,
            @RequestBody String message
    ) {
        return orchestrator.handleUserMessage(sessionId, message);
    }

    @PostMapping("/session")
    public ChatSessionSummaryResponse createSession() {
        return chatSessionService.createSession();
    }

    @GetMapping("/sessions")
    public List<ChatSessionSummaryResponse> listSessions() {
        return chatSessionService.listSessions();
    }

    @GetMapping("/session/{sessionId}/messages")
    public ChatSessionMessagesResponse getSessionMessages(@PathVariable String sessionId) {
        return chatSessionService.getSessionMessages(sessionId);
    }
}