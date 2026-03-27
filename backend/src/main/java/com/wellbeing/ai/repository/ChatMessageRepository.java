package com.wellbeing.ai.repository;

import com.wellbeing.ai.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    List<ChatMessage> findTop10BySession_IdOrderByCreatedAtDesc(String sessionId);

    List<ChatMessage> findTop2BySession_IdOrderByCreatedAtDesc(String sessionId);

    List<ChatMessage> findBySession_IdOrderByCreatedAtAsc(String sessionId);
}