package com.wellbeing.ai.repository;

import com.wellbeing.ai.entity.MessageAiMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MetadataRepository extends JpaRepository<MessageAiMetadata, Long> {}