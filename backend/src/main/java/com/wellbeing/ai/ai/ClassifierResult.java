package com.wellbeing.ai.ai;

public record ClassifierResult(
        String label,
        double confidence
) {}