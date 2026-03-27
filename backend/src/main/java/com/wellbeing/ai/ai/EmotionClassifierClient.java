package com.wellbeing.ai.ai;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class EmotionClassifierClient {

    private final RestTemplate restTemplate = new RestTemplate();

    public ClassifierResult predict(String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Map<String, String>> request =
                new HttpEntity<>(Map.of("text", text), headers);

        ResponseEntity<ClassifierResult> response = restTemplate.exchange(
                "http://127.0.0.1:8001/predict",
                HttpMethod.POST,
                request,
                ClassifierResult.class
        );

        return response.getBody();
    }
}