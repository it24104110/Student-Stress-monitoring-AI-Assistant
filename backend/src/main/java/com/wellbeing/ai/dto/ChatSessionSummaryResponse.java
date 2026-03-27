package com.wellbeing.ai.dto;

import java.time.Instant;

public record ChatSessionSummaryResponse(
        String sessionId,
        String title,
        Instant createdAt,
        Instant updatedAt
) {}