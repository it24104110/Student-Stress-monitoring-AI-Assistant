package com.sliit.tg.controller;

import com.sliit.tg.model.MoodEntry;
import com.sliit.tg.repository.MoodEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/mood-entries")
@CrossOrigin(origins = "*") // allow frontend
public class MoodCheckInController {

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    @PostMapping
    public ResponseEntity<MoodEntry> saveMoodEntry(@RequestBody MoodEntry entry) {
        if (entry.getDate() == null) {
            entry.setDate(LocalDateTime.now());
        }
        MoodEntry savedEntity = moodEntryRepository.save(entry);
        return ResponseEntity.ok(savedEntity);
    }

    @GetMapping
    public ResponseEntity<List<MoodEntry>> getAllMoodEntries() {
        return ResponseEntity.ok(moodEntryRepository.findAll());
    }
}
