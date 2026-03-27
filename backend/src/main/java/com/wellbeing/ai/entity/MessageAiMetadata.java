package com.wellbeing.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "message_ai_metadata", uniqueConstraints = {
        @UniqueConstraint(name = "uq_ai_message", columnNames = "message_id")
})
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class MessageAiMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 1:1 with chat_messages
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private ChatMessage message;

    @Column(name = "emotion_label", length = 50)
    private String emotionLabel;

    @Column(name = "emotion_confidence", precision = 5, scale = 4)
    private BigDecimal emotionConfidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "impact_level")
    private ImpactLevel impactLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "indicator_level")
    private IndicatorLevel indicatorLevel;


    @Column(name = "indicator_label")
    private String indicatorLabel;   // raw model label (e.g., "Stress", "Suicidal")

    @Enumerated(EnumType.STRING)
    @Column(name = "indicator_group")
    private IndicatorGroup indicatorGroup;


    @Column(name = "indicator_confidence", precision = 5, scale = 4)
    private BigDecimal indicatorConfidence;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum ImpactLevel { LOW, MODERATE, HIGH }
    public enum IndicatorLevel { NONE, ELEVATED, ELEVATED_STRONG }
    public enum IndicatorGroup {
        NORMAL,
        ANXIETY_STRESS,
        LOW_MOOD,
        CRISIS,
        OTHER
    }
}