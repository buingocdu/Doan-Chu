package com.gameword.controller;

import com.gameword.dto.PuzzleGameDto;
import com.gameword.dto.PuzzleGameRequest;
import com.gameword.dto.PuzzleGameUpdateRequest;
import com.gameword.dto.PuzzleImageDto;
import com.gameword.dto.PuzzleImageUpdateRequest;
import com.gameword.service.PuzzleService;
import com.gameword.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

// Quan tri kho anh ghep hinh. Quyen ADMIN duoc ep trong SecurityConfig (/api/admin/**)
@RestController
@RequestMapping("/api/admin/puzzle")
public class AdminPuzzleController {

    private final PuzzleService puzzleService;
    private final UserService userService;

    public AdminPuzzleController(PuzzleService puzzleService, UserService userService) {
        this.puzzleService = puzzleService;
        this.userService = userService;
    }

    @GetMapping("/images")
    public ResponseEntity<List<PuzzleImageDto>> images() {
        return ResponseEntity.ok(puzzleService.listAll());
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PuzzleImageDto> upload(@RequestParam("file") MultipartFile file,
                                                 @RequestParam(value = "title", required = false) String title,
                                                 Principal principal) throws IOException {
        Long adminId = userService.getUserIdByUsername(principal.getName());
        String name = title != null && !title.isBlank() ? title : stripExtension(file.getOriginalFilename());
        return ResponseEntity.ok(puzzleService.upload(name, file.getBytes(), adminId));
    }

    // ===== Game =====

    @GetMapping("/games")
    public ResponseEntity<List<PuzzleGameDto>> games() {
        return ResponseEntity.ok(puzzleService.listAllGames());
    }

    @PostMapping("/games")
    public ResponseEntity<PuzzleGameDto> createGame(@RequestBody PuzzleGameRequest request, Principal principal) {
        Long adminId = userService.getUserIdByUsername(principal.getName());
        return ResponseEntity.ok(puzzleService.createGame(request, adminId));
    }

    @PutMapping("/games/{id}")
    public ResponseEntity<PuzzleGameDto> updateGame(@PathVariable Long id,
                                                    @RequestBody PuzzleGameUpdateRequest request) {
        return ResponseEntity.ok(puzzleService.updateGame(id, request));
    }

    @DeleteMapping("/games/{id}")
    public ResponseEntity<Void> deleteGame(@PathVariable Long id) {
        puzzleService.deleteGame(id);
        return ResponseEntity.noContent().build();
    }

    // Xem ca anh dang an
    @GetMapping("/images/{id}/file")
    public ResponseEntity<byte[]> file(@PathVariable Long id) {
        PuzzleService.PuzzleFile file = puzzleService.file(id, true);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType()))
            .header("X-Content-Type-Options", "nosniff").body(file.data());
    }

    @PutMapping("/images/{id}")
    public ResponseEntity<PuzzleImageDto> update(@PathVariable Long id, @RequestBody PuzzleImageUpdateRequest request) {
        return ResponseEntity.ok(puzzleService.update(id, request));
    }

    @DeleteMapping("/images/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        puzzleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private static String stripExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return "";
        }
        String base = filename.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1);
        int dot = base.lastIndexOf('.');
        return dot > 0 ? base.substring(0, dot) : base;
    }
}
