package com.wellbeing.ai.service;

import com.wellbeing.ai.entity.MessageAiMetadata;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class DecisionRuleService {

    /**
     * Raw label from the indicator model (7-class or 3-class).
     * We keep this as-is (stored as VARCHAR in DB).
     */
    public String normalizeRawLabel(String raw) {
        if (raw == null) return null;
        String r = raw.trim();
        return r.isEmpty() ? null : r;
    }

    /**
     * Map model raw label -> user-facing group (stable API for UI + rules).
     */
    public MessageAiMetadata.IndicatorGroup toIndicatorGroup(String rawLabel) {
        String r = norm(rawLabel);

        if (r.isEmpty()) return MessageAiMetadata.IndicatorGroup.OTHER;

        if (r.contains("SUICID")) return MessageAiMetadata.IndicatorGroup.CRISIS;

        if (r.contains("DEPRESS")) return MessageAiMetadata.IndicatorGroup.LOW_MOOD;

        if (r.contains("ANXIETY") || r.contains("STRESS")) {
            return MessageAiMetadata.IndicatorGroup.ANXIETY_STRESS;
        }

        if (r.contains("NORMAL")) return MessageAiMetadata.IndicatorGroup.NORMAL;

        if (r.contains("BIPOLAR") || r.contains("PERSONALITY")) {
            return MessageAiMetadata.IndicatorGroup.OTHER;
        }

        return MessageAiMetadata.IndicatorGroup.OTHER;
    }

    /**
     * Map group + confidence -> indicator level (NONE/ELEVATED/ELEVATED_STRONG)
     */
    public MessageAiMetadata.IndicatorLevel indicatorLevel(
            MessageAiMetadata.IndicatorGroup group,
            double conf
    ) {
        if (group == MessageAiMetadata.IndicatorGroup.CRISIS) {
            return MessageAiMetadata.IndicatorLevel.ELEVATED_STRONG;
        }

        if (group == MessageAiMetadata.IndicatorGroup.NORMAL) {
            return MessageAiMetadata.IndicatorLevel.NONE;
        }

        if (conf < 0.55) {
            return MessageAiMetadata.IndicatorLevel.NONE;
        }

        if (conf >= 0.80) {
            return MessageAiMetadata.IndicatorLevel.ELEVATED_STRONG;
        }

        return MessageAiMetadata.IndicatorLevel.ELEVATED;
    }

    /**
     * Impact mapping based on emotion label + emotion confidence.
     */
    public MessageAiMetadata.ImpactLevel impactLevel(String emotionLabel, double emotionConfidence) {
        if (emotionLabel == null) return MessageAiMetadata.ImpactLevel.LOW;

        String e = emotionLabel.trim().toLowerCase(Locale.ROOT);
        boolean negative = e.contains("sad")
                || e.contains("anger")
                || e.contains("fear")
                || e.contains("disgust");

        if (!negative) return MessageAiMetadata.ImpactLevel.LOW;

        if (emotionConfidence >= 0.80) return MessageAiMetadata.ImpactLevel.HIGH;
        if (emotionConfidence >= 0.60) return MessageAiMetadata.ImpactLevel.MODERATE;
        return MessageAiMetadata.ImpactLevel.LOW;
    }

    /**
     * If indicator is CRISIS, override impact to HIGH.
     */
    public MessageAiMetadata.ImpactLevel overrideImpactForCrisis(
            MessageAiMetadata.ImpactLevel current,
            MessageAiMetadata.IndicatorGroup group
    ) {
        if (group == MessageAiMetadata.IndicatorGroup.CRISIS) {
            return MessageAiMetadata.ImpactLevel.HIGH;
        }
        return current;
    }

    /**
     * Rule-based crisis keyword override for obvious high-risk text
     * in case classifier misses it.
     */
    public boolean looksLikeCrisisText(String text) {
        if (text == null) return false;

        String t = text.trim().toLowerCase(Locale.ROOT);

        return t.contains("suicide")
                || t.contains("kill myself")
                || t.contains("end my life")
                || t.contains("don't want to live")
                || t.contains("dont want to live")
                || t.contains("do not want to live")
                || t.contains("want to die")
                || t.contains("wanna die")
                || t.contains("not worth living")
                || t.contains("hurt myself")
                || t.contains("harm myself")
                || t.contains("self harm")
                || t.contains("self-harm")
                || t.contains("this world dont let me")
                || t.contains("this world doesn't let me")
                || t.contains("i cannot go on")
                || t.contains("i can't go on")
                || t.contains("no reason to live")
                || t.contains("better off dead");
    }

    /**
     * Prompt style hint for the LLM.
     */
    public String responseStyle(
            MessageAiMetadata.IndicatorGroup group,
            MessageAiMetadata.IndicatorLevel indicatorLevel,
            MessageAiMetadata.ImpactLevel impactLevel
    ) {
        if (group == MessageAiMetadata.IndicatorGroup.CRISIS) {
            return "safety_first";
        }

        if (indicatorLevel == MessageAiMetadata.IndicatorLevel.ELEVATED_STRONG
                || impactLevel == MessageAiMetadata.ImpactLevel.HIGH) {
            return "supportive_brief_optional_question";
        }

        if (indicatorLevel == MessageAiMetadata.IndicatorLevel.ELEVATED
                || impactLevel == MessageAiMetadata.ImpactLevel.MODERATE) {
            return "warm_brief_no_need_for_question";
        }

        return "light_natural_no_forced_question";
    }

    private String norm(String s) {
        return s == null ? "" : s.trim().toUpperCase(Locale.ROOT);
    }
}