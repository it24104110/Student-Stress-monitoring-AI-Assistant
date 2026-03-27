package com.wellbeing.ai.dto;

public record RecommendationDTO(
        String id,
        String title,
        String type,
        int minutes
) {}