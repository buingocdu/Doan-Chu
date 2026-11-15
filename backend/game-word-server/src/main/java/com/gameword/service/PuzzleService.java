package com.gameword.service;

import com.gameword.config.PuzzleConfig;
import com.gameword.dto.PuzzleImageDto;
import com.gameword.dto.PuzzleImageUpdateRequest;
import com.gameword.dto.PuzzleRankEntry;
import com.gameword.dto.PuzzleScoreRequest;
import com.gameword.dto.PuzzleScoreResponse;
import com.gameword.model.PuzzleImage;
import com.gameword.model.PuzzleImageData;
import com.gameword.model.PuzzleScore;
import com.gameword.repository.PuzzleImageDataRepository;
import com.gameword.repository.PuzzleImageRepository;
import com.gameword.repository.PuzzleScoreRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Game ghep hinh: kho anh (admin quan ly), ket qua va bang xep hang theo (anh, so hang x so cot)
@Service
public class PuzzleService {

    static final int MAX_TITLE_LENGTH = 100;
    static final int LEADERBOARD_SIZE = 10;
    // Anh luu luon la JPEG sau khi xu ly
    public static final String STORED_CONTENT_TYPE = "image/jpeg";

    private final PuzzleImageRepository imageRepository;
    private final PuzzleImageDataRepository dataRepository;
    private final PuzzleScoreRepository scoreRepository;
    private final PuzzleConfig config;

    public PuzzleService(PuzzleImageRepository imageRepository, PuzzleImageDataRepository dataRepository,
                         PuzzleScoreRepository scoreRepository, PuzzleConfig config) {
        this.imageRepository = imageRepository;
        this.dataRepository = dataRepository;
        this.scoreRepository = scoreRepository;
        this.config = config;
    }

    public List<PuzzleImageDto> listActive() {
        return imageRepository.findByActiveTrueOrderByCreatedAtDescIdDesc().stream().map(PuzzleService::toDto).toList();
    }

    public List<PuzzleImageDto> listAll() {
        return imageRepository.findAllByOrderByCreatedAtDescIdDesc().stream().map(PuzzleService::toDto).toList();
    }

    // Anh dang an chi admin xem duoc (admin goi voi includeInactive = true)
    public PuzzleFile file(Long id, boolean includeInactive) {
        PuzzleImage image = imageRepository.findById(id).orElseThrow(() -> new RuntimeException("Image not found"));
        if (!includeInactive && !Boolean.TRUE.equals(image.getActive())) {
            throw new RuntimeException("Image not found");
        }
        byte[] data = dataRepository.findById(id).map(PuzzleImageData::getData)
            .orElseThrow(() -> new RuntimeException("Image not found"));
        return new PuzzleFile(data, image.getContentType());
    }

    @Transactional
    public PuzzleImageDto upload(String title, byte[] raw, Long adminId) {
        String cleanTitle = cleanTitle(title);
        if (cleanTitle.isEmpty()) {
            throw new RuntimeException("Title is required");
        }
        PuzzleImages.Processed processed = PuzzleImages.process(raw, config);
        PuzzleImage image = imageRepository.save(PuzzleImage.builder()
            .title(cleanTitle)
            .contentType(STORED_CONTENT_TYPE)
            .width(processed.width())
            .height(processed.height())
            .sizeBytes(processed.data().length)
            .active(true)
            .createdBy(adminId)
            .createdAt(LocalDateTime.now())
            .build());
        dataRepository.save(PuzzleImageData.builder().imageId(image.getId()).data(processed.data()).build());
        return toDto(image);
    }

    @Transactional
    public PuzzleImageDto update(Long id, PuzzleImageUpdateRequest request) {
        PuzzleImage image = imageRepository.findById(id).orElseThrow(() -> new RuntimeException("Image not found"));
        if (request.getTitle() != null) {
            String title = cleanTitle(request.getTitle());
            if (title.isEmpty()) {
                throw new RuntimeException("Title is required");
            }
            image.setTitle(title);
        }
        if (request.getActive() != null) {
            image.setActive(request.getActive());
        }
        return toDto(imageRepository.save(image));
    }

    @Transactional
    public void delete(Long id) {
        if (!imageRepository.existsById(id)) {
            throw new RuntimeException("Image not found");
        }
        // puzzle_image_data va puzzle_scores xoa theo (ON DELETE CASCADE)
        imageRepository.deleteById(id);
    }

    @Transactional
    public PuzzleScoreResponse submit(Long userId, PuzzleScoreRequest request) {
        validateGrid(request.getRows(), request.getCols());
        if (request.getImageId() == null || request.getDurationMs() == null || request.getMoves() == null) {
            throw new RuntimeException("Invalid result");
        }
        PuzzleImage image = imageRepository.findById(request.getImageId())
            .filter(i -> Boolean.TRUE.equals(i.getActive()))
            .orElseThrow(() -> new RuntimeException("Image not found"));
        int rows = request.getRows();
        int cols = request.getCols();
        long pieces = (long) rows * cols;
        // Chong gui ket qua gia: khong the ghep xong nhanh hon moc nay, va moi manh can it nhat 1 thao tac
        if (request.getDurationMs() < pieces * config.getMinMsPerPiece() || request.getMoves() < pieces / 2) {
            throw new RuntimeException("Invalid result");
        }
        Long previousBest = scoreRepository.bestOf(userId, image.getId(), rows, cols);
        scoreRepository.save(PuzzleScore.builder()
            .userId(userId).imageId(image.getId()).rows(rows).cols(cols)
            .durationMs(request.getDurationMs()).moves(request.getMoves())
            .createdAt(LocalDateTime.now()).build());
        long best = previousBest == null ? request.getDurationMs() : Math.min(previousBest, request.getDurationMs());
        int rank = (int) scoreRepository.countFasterUsers(image.getId(), rows, cols, best) + 1;
        return PuzzleScoreResponse.builder()
            .rank(rank).bestMs(best)
            .personalBest(previousBest == null || request.getDurationMs() < previousBest)
            .build();
    }

    public List<PuzzleRankEntry> leaderboard(Long imageId, int rows, int cols) {
        validateGrid(rows, cols);
        List<PuzzleRankEntry> result = new ArrayList<>();
        int rank = 1;
        for (Object[] row : scoreRepository.bestPerUser(imageId, rows, cols, PageRequest.of(0, LEADERBOARD_SIZE))) {
            result.add(new PuzzleRankEntry(rank++, (Long) row[0], (String) row[1], (Long) row[2]));
        }
        return result;
    }

    void validateGrid(Integer rows, Integer cols) {
        if (rows == null || cols == null
                || rows < config.getMinGrid() || rows > config.getMaxGrid()
                || cols < config.getMinGrid() || cols > config.getMaxGrid()) {
            throw new RuntimeException("Invalid grid size");
        }
    }

    private static String cleanTitle(String title) {
        String value = title == null ? "" : title.trim().replaceAll("\\s+", " ");
        return value.length() > MAX_TITLE_LENGTH ? value.substring(0, MAX_TITLE_LENGTH) : value;
    }

    static PuzzleImageDto toDto(PuzzleImage i) {
        return PuzzleImageDto.builder().id(i.getId()).title(i.getTitle()).width(i.getWidth()).height(i.getHeight())
            .sizeBytes(i.getSizeBytes()).active(i.getActive()).createdAt(i.getCreatedAt()).build();
    }

    public record PuzzleFile(byte[] data, String contentType) {
    }
}
