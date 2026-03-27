package com.wellbeing.ai.dto;

import java.util.List;

public record ChatSessionMessagesResponse(
        String sessionId,
        List<ChatMessageViewResponse> messages
) {}