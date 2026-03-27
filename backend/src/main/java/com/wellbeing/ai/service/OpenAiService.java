package com.wellbeing.ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    private final RestClient client;
    private final String apiKey;

    public OpenAiService(@Value("${gemini.api.key}") String apiKey) {
        this.apiKey = apiKey;
        this.client = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    public String generateReply(String systemPrompt, String contextBlock, String memoryBlock, String userMessage) {

        String prompt = """
                %s

                %s

                %s

                Current user message:
                USER: %s
                """.formatted(systemPrompt, contextBlock, memoryBlock, userMessage);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                )
        );

        GeminiResponse response = client.post()
                .uri("/v1/models/gemini-2.5-flash:generateContent?key={key}", apiKey)
                .body(requestBody)
                .retrieve()
                .body(GeminiResponse.class);

        if (response == null
                || response.candidates == null
                || response.candidates.isEmpty()
                || response.candidates.get(0).content == null
                || response.candidates.get(0).content.parts == null
                || response.candidates.get(0).content.parts.isEmpty()
                || response.candidates.get(0).content.parts.get(0).text == null) {
            throw new RuntimeException("Gemini returned an empty response");
        }

        return response.candidates.get(0).content.parts.get(0).text.trim();
    }

    public static class GeminiResponse {
        public List<Candidate> candidates;
    }

    public static class Candidate {
        public Content content;
    }

    public static class Content {
        public List<Part> parts;
    }

    public static class Part {
        public String text;
    }
}