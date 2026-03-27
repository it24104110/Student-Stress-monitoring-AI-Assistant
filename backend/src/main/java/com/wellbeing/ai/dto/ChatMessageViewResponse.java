package com.wellbeing.ai.dto;

import java.time.Instant;

public record ChatMessageViewResponse(
        String id,
        String role,
        String content,
        Instant createdAt
) {}