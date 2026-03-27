package com.wellbeing.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_messages_session", columnList = "session_id"),
        @Index(name = "idx_chat_messages_created", columnList = "created_at")
})
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ChatMessage {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, columnDefinition = "CHAR(36)")
    private ChatSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Role { user, assistant }
}