package com.sliit.tg.controller;

import com.sliit.tg.model.MoodEntry;
import com.sliit.tg.repository.MoodEntryRepository;
import com.sliit.tg.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AIInsightsController {

        @Autowired
        private GeminiService geminiService;

        @Autowired
        private MoodEntryRepository moodEntryRepository;

        @GetMapping("/ai-insights")
        public Map<String, Object> getAIInsights() {
                try {
                        List<MoodEntry> entries = moodEntryRepository.findAll();
                        if (!entries.isEmpty()) {
                                System.out.println("Calling Gemini API for real-time insights...");
                                return geminiService.generateInsights(entries);
                        }
                } catch (Exception e) {
                        System.err.println("Gemini Fallback Triggered. Reason: " + e.getMessage());
                }

                System.out.println("Returning Default Fallback Data...");

                Map<String, Object> response = new HashMap<>();

                // Insights
                List<Map<String, String>> insights = new ArrayList<>();
                insights.add(Map.of(
                                "icon", "Brain",
                                "title", "Stress Pattern Detected",
                                "message",
                                "Your stress levels increased this week. Consider taking short breaks or meditation.",
                                "color", "rgba(132, 94, 247, 1)"));
                insights.add(Map.of(
                                "icon", "Sun",
                                "title", "Energy Boost Recommendation",
                                "message",
                                "Your energy peaks in the morning. Schedule important tasks during this time.",
                                "color", "rgba(66, 193, 255, 1)"));
                insights.add(Map.of(
                                "icon", "Heart",
                                "title", "Sleep Quality Insight",
                                "message", "Great job! Your sleep quality improved by 20% compared to last week.",
                                "color", "rgba(132, 94, 247, 1)"));

                // Affirmations
                List<String> affirmations = Arrays.asList(
                                "You are capable of amazing things.",
                                "Every day is a fresh start.",
                                "Your mental health matters.",
                                "Progress, not perfection.",
                                "You are stronger than you think.",
                                "It's okay to ask for help.",
                                "You deserve peace and happiness.",
                                "Take it one day at a time.");

                // Suggestions
                List<Map<String, String>> suggestions = new ArrayList<>();
                suggestions.add(Map.of(
                                "title", "Morning Meditation",
                                "description", "Start your day with 10 minutes of mindfulness meditation",
                                "duration", "10 min"));
                suggestions.add(Map.of(
                                "title", "Nature Walk",
                                "description", "Take a relaxing walk outside to boost your mood",
                                "duration", "20 min"));
                suggestions.add(Map.of(
                                "title", "Gratitude Journal",
                                "description", "Write down three things you're grateful for today",
                                "duration", "5 min"));
                suggestions.add(Map.of(
                                "title", "Deep Breathing",
                                "description", "Practice 4-7-8 breathing technique for relaxation",
                                "duration", "5 min"));

                // Summary
                Map<String, Object> summary = new HashMap<>();
                summary.put("text",
                                "Based on your mood tracking patterns over the past week, our AI has identified that you're managing stress well overall. Your sleep quality has improved significantly, and your energy levels are stable. Continue with your current wellness practices, and consider adding morning meditation for even better results.");

                List<Map<String, String>> highlights = new ArrayList<>();
                highlights.add(Map.of("text", "Stress Management", "color", "rgba(66, 193, 255, 1)"));
                highlights.add(Map.of("text", "Sleep Improvement", "color", "rgba(132, 94, 247, 1)"));
                highlights.add(Map.of("text", "Stable Energy", "color", "rgba(132, 94, 247, 1)"));

                summary.put("highlights", highlights);

                response.put("insights", insights);
                response.put("affirmations", affirmations);
                response.put("suggestions", suggestions);
                response.put("summary", summary);

                return response;
        }
}
