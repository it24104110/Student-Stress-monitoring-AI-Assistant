package com.sliit.tg.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sliit.tg.model.MoodEntry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateInsights(List<MoodEntry> recentEntries) throws Exception {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            throw new Exception("Gemini API Key not configured.");
        }

        // 1. Build the prompt summarizing user history
        StringBuilder context = new StringBuilder("Here is the user's mood tracking data for the past week:\n");
        for (MoodEntry e : recentEntries) {
            context.append(
                    String.format("Date: %s | Mood: %s | Stress: %d/5 | Energy: %d/5 | Sleep: %d/5 | Notes: %s\n",
                            e.getDate().toLocalDate().toString(), e.getMood(), e.getStressLevel(), e.getEnergyLevel(),
                            e.getSleepQuality(), e.getNotes() != null ? e.getNotes() : "None"));
        }

        String prompt = "You are an empathetic, clinical mental wellness AI assistant. Analyze the user's mood data above. "
                +
                "You must return EXCLUSIVELY a raw JSON object (without any markdown formatting like ```json) that strictly maps to the following exact schema:\n"
                +
                "{\n" +
                "  \"insights\": [ { \"icon\": \"Brain|Sun|Heart\", \"title\": \"string\", \"message\": \"string\", \"color\": \"rgba(132, 94, 247, 1) or rgba(66, 193, 255, 1)\" } ],\n"
                +
                "  \"affirmations\": [ \"string\", \"string\" ],\n" +
                "  \"suggestions\": [ { \"title\": \"string\", \"description\": \"string\", \"duration\": \"string\" } ],\n"
                +
                "  \"summary\": {\n" +
                "    \"text\": \"string summarizing their week\",\n" +
                "    \"highlights\": [ { \"text\": \"string\", \"color\": \"rgba(132, 94, 247, 1) or rgba(66, 193, 255, 1)\" } ]\n"
                +
                "  }\n" +
                "}";

        // 2. Build the Gemini JSON Payload structure
        Map<String, Object> parts = Map.of("text", context.toString() + "\n\n" + prompt);
        Map<String, Object> contents = Map.of("parts", List.of(parts));

        // Use JSON response schema to guarantee valid JSON
        Map<String, Object> generationConfig = Map.of(
                "temperature", 0.7,
                "response_mime_type", "application/json");

        Map<String, Object> requestBodyMap = Map.of(
                "contents", List.of(contents),
                "generationConfig", generationConfig);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        // 3. Make HTTP POST using query parameter for API key
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new Exception("Gemini API Error: " + response.body());
        }

        // 4. Parse Gemini's specific response wrapper
        Map<String, Object> responseMap = (Map<String, Object>) objectMapper.readValue(response.body(), Map.class);
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> contentParts = (List<Map<String, Object>>) content.get("parts");
        String jsonContent = (String) contentParts.get(0).get("text");

        // Clean up formatting in case Gemini returns markdown block
        jsonContent = jsonContent.replaceAll("^```json\\s*", "").replaceAll("```$", "").trim();

        // Assume JSON returned maps to our specific frontend schema
        return (Map<String, Object>) objectMapper.readValue(jsonContent, Map.class);
    }
}
