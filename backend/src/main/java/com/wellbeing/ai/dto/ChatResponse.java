package com.wellbeing.ai.dto;

import java.util.List;

public record ChatResponse(
        String sessionId,
        String assistantMessage,
        String emotionLabel,
        String impactLevel,
        String indicatorLabel,
        String indicatorGroup,
        String indicatorLevel,
        List<RecommendationDTO> recommendations
) {}