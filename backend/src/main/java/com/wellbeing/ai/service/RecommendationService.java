package com.wellbeing.ai.service;

import com.wellbeing.ai.dto.RecommendationDTO;
import com.wellbeing.ai.entity.MessageAiMetadata;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationService {

    public List<RecommendationDTO> recommend(
            MessageAiMetadata.IndicatorGroup indicatorGroup,
            MessageAiMetadata.IndicatorLevel indicatorLevel,
            MessageAiMetadata.ImpactLevel impactLevel,
            String emotionLabel
    ) {
        List<RecommendationDTO> recs = new ArrayList<>();

        // 1) Strong indicators (CRISIS or very high confidence)
        if (indicatorLevel == MessageAiMetadata.IndicatorLevel.ELEVATED_STRONG) {
            recs.add(new RecommendationDTO("grounding_5_4_3_2_1", "5-4-3-2-1 grounding exercise", "GROUNDING", 3));
            recs.add(new RecommendationDTO("breathing_box", "Box breathing (4-4-4-4)", "BREATHING", 2));
            recs.add(new RecommendationDTO("reach_out", "Reach out to a trusted person (friend/family)", "SUPPORT", 1));
            return recs;
        }

        // 2) Group-based recommendations
        if (indicatorGroup == null) indicatorGroup = MessageAiMetadata.IndicatorGroup.OTHER;

        switch (indicatorGroup) {
            case ANXIETY_STRESS -> {
                recs.add(new RecommendationDTO("breathing_4_7_8", "4-7-8 breathing", "BREATHING", 3));
                recs.add(new RecommendationDTO("body_scan", "2-minute body scan", "GROUNDING", 2));
            }
            case LOW_MOOD -> {
                recs.add(new RecommendationDTO("small_step", "One tiny step plan", "REFLECTION", 3));
                recs.add(new RecommendationDTO("sunlight_walk", "10-minute light walk (if possible)", "ACTIVITY", 2));
            }
            case NORMAL -> {
                recs.add(new RecommendationDTO("checkin", "Quick mood check-in", "REFLECTION", 2));
                recs.add(new RecommendationDTO("gratitude", "Write 1 good thing from today", "JOURNAL", 1));
            }
            case CRISIS -> {
                // Even if it didn't reach ELEVATED_STRONG for some reason, treat carefully
                recs.add(new RecommendationDTO("grounding_5_4_3_2_1", "5-4-3-2-1 grounding exercise", "GROUNDING", 3));
                recs.add(new RecommendationDTO("reach_out", "Reach out to a trusted person now", "SUPPORT", 1));
            }
            case OTHER -> {
                recs.add(new RecommendationDTO("checkin", "Quick mood check-in", "REFLECTION", 2));
                recs.add(new RecommendationDTO("breathing_box", "Box breathing (4-4-4-4)", "BREATHING", 2));
            }
        }

        // 3) Impact-based add-ons (from emotion classifier)
        if (impactLevel == MessageAiMetadata.ImpactLevel.HIGH) {
            recs.add(new RecommendationDTO("journal_prompt", "Short journaling prompt", "JOURNAL", 5));
        } else if (impactLevel == MessageAiMetadata.ImpactLevel.MODERATE) {
            recs.add(new RecommendationDTO("music_calm", "Listen to a calm playlist for 5 minutes", "MUSIC", 3));
        }

        // 4) Optional: emotion-based extra suggestion (light rules)
        if (emotionLabel != null) {
            String e = emotionLabel.toLowerCase();
            if (e.contains("sad")) {
                recs.add(new RecommendationDTO("self_compassion", "Self-compassion note (1 minute)", "REFLECTION", 2));
            } else if (e.contains("anger")) {
                recs.add(new RecommendationDTO("pause_reset", "60-second pause + slow exhale reset", "GROUNDING", 2));
            } else if (e.contains("fear")) {
                recs.add(new RecommendationDTO("name_the_fear", "Name the worry + write one next step", "REFLECTION", 2));
            }
        }

        return recs;
    }
}