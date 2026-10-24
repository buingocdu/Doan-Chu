package com.gameword.controller;

import com.gameword.dto.WordResponse;
import com.gameword.service.WordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/words")
@CrossOrigin(origins = "*")
public class WordController {

    private final WordService wordService;

    public WordController(WordService wordService) {
        this.wordService = wordService;
    }

    @GetMapping("/random")
    public ResponseEntity<WordResponse> random(@RequestParam(required = false) List<Long> excludedIds) {
        return ResponseEntity.ok(wordService.getRandomWord(excludedIds != null ? excludedIds : List.of()));
    }

    @GetMapping("/random/{level}")
    public ResponseEntity<WordResponse> randomByLevel(@PathVariable Integer level,
                                                      @RequestParam(required = false) List<Long> excludedIds) {
        return ResponseEntity.ok(wordService.getRandomWordByLevel(level, excludedIds != null ? excludedIds : List.of()));
    }
}
