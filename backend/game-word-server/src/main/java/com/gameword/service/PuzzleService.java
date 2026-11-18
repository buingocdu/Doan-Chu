package com.gameword.service;

import com.gameword.config.PuzzleConfig;
import com.gameword.dto.PuzzleGameDto;
import com.gameword.dto.PuzzleGameRequest;
import com.gameword.dto.PuzzleGameUpdateRequest;
import com.gameword.dto.PuzzleImageDto;
import com.gameword.dto.PuzzleImageEditRequest;
import com.gameword.dto.PuzzleImageUpdateRequest;
import com.gameword.dto.PuzzleRankEntry;
import com.gameword.dto.PuzzleScoreRequest;
import com.gameword.dto.PuzzleScoreResponse;
import com.gameword.model.PuzzleGame;
import com.gameword.model.PuzzleImage;
import com.gameword.model.PuzzleImageData;
import com.gameword.model.PuzzleScore;
import com.gameword.repository.PuzzleGameRepository;
import com.gameword.repository.PuzzleImageDataRepository;
import com.gameword.repository.PuzzleImageRepository;
import com.gameword.repository.PuzzleScoreRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

// Game ghep hinh: kho anh va game (admin quan ly), ket qua va bang xep hang theo game
@Service
public class PuzzleService {

    static final int MAX_TITLE_LENGTH = 100;
    static final int LEADERBOARD_SIZE = 10;
    // Anh luu luon la JPEG sau khi xu ly
    public static final String STORED_CONTENT_TYPE = "image/jpeg";

    private final PuzzleImageRepository imageRepository;
    private final PuzzleImageDataRepository dataRepository;
    private final PuzzleScoreRepository scoreRepository;
    private final PuzzleGameRepository gameRepository;
    private final PuzzleConfig config;

    public PuzzleService(PuzzleImageRepository imageRepository, PuzzleImageDataRepository dataRepository,
                         PuzzleScoreRepository scoreRepository, PuzzleGameRepository gameRepository,
                         PuzzleConfig config) {
        this.imageRepository = imageRepository;
        this.dataRepository = dataRepository;
        this.scoreRepository = scoreRepository;
        this.gameRepository = gameRepository;
        this.config = config;
    }

    // ===== Kho anh (admin) =====

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

    // Xoay anh trong kho (sua anh bi nam ngang). degrees: 90, 180, 270 (hoac -90) theo chieu kim dong ho
    @Transactional
    public PuzzleImageDto rotate(Long id, int degrees) {
        if (degrees % 90 != 0 || degrees % 360 == 0) {
            throw new RuntimeException("Invalid rotation");
        }
        PuzzleImage image = imageRepository.findById(id).orElseThrow(() -> new RuntimeException("Image not found"));
        PuzzleImageData stored = dataRepository.findById(id).orElseThrow(() -> new RuntimeException("Image not found"));
        PuzzleImages.Processed rotated = PuzzleImages.rotate(stored.getData(), degrees / 90);
        stored.setData(rotated.data());
        dataRepository.save(stored);
        image.setWidth(rotated.width());
        image.setHeight(rotated.height());
        image.setSizeBytes(rotated.data().length);
        image.setVersion(image.getVersion() + 1);
        return toDto(imageRepository.save(image));
    }

    // Sua anh: xoay + cat. Co asCopy thi tao anh moi, khong dong vao anh goc va cac game dang dung no
    @Transactional
    public PuzzleImageDto edit(Long id, PuzzleImageEditRequest request, Long adminId) {
        int degrees = request.getDegrees() == null ? 0 : request.getDegrees();
        if (degrees % 90 != 0) {
            throw new RuntimeException("Invalid rotation");
        }
        PuzzleImages.Crop crop = null;
        boolean anyCrop = request.getCropX() != null || request.getCropY() != null
            || request.getCropWidth() != null || request.getCropHeight() != null;
        if (anyCrop) {
            if (request.getCropX() == null || request.getCropY() == null
                    || request.getCropWidth() == null || request.getCropHeight() == null) {
                throw new RuntimeException("Invalid crop");
            }
            crop = new PuzzleImages.Crop(request.getCropX(), request.getCropY(), request.getCropWidth(),
                request.getCropHeight());
        }
        if (degrees % 360 == 0 && crop == null && !Boolean.TRUE.equals(request.getAsCopy())) {
            throw new RuntimeException("Nothing to edit");
        }
        PuzzleImage image = imageRepository.findById(id).orElseThrow(() -> new RuntimeException("Image not found"));
        PuzzleImageData stored = dataRepository.findById(id).orElseThrow(() -> new RuntimeException("Image not found"));
        PuzzleImages.Processed edited = PuzzleImages.edit(stored.getData(), degrees / 90, crop, config);
        if (Boolean.TRUE.equals(request.getAsCopy())) {
            String title = cleanTitle(request.getTitle() == null || request.getTitle().isBlank()
                ? image.getTitle() + " (da sua)" : request.getTitle());
            PuzzleImage copy = imageRepository.save(PuzzleImage.builder()
                .title(title).contentType(STORED_CONTENT_TYPE).width(edited.width()).height(edited.height())
                .sizeBytes(edited.data().length).active(true).createdBy(adminId).createdAt(LocalDateTime.now())
                .build());
            dataRepository.save(PuzzleImageData.builder().imageId(copy.getId()).data(edited.data()).build());
            return toDto(copy);
        }
        stored.setData(edited.data());
        dataRepository.save(stored);
        image.setWidth(edited.width());
        image.setHeight(edited.height());
        image.setSizeBytes(edited.data().length);
        image.setVersion(image.getVersion() + 1);
        return toDto(imageRepository.save(image));
    }

    @Transactional
    public void delete(Long id) {
        if (!imageRepository.existsById(id)) {
            throw new RuntimeException("Image not found");
        }
        // puzzle_image_data, puzzle_games va puzzle_scores xoa theo (ON DELETE CASCADE)
        imageRepository.deleteById(id);
    }

    // ===== Game =====

    // Game nguoi choi thay: game dang hien va anh cua no cung dang hien
    public List<PuzzleGameDto> listPlayableGames() {
        return toGameDtos(gameRepository.findPlayable());
    }

    public List<PuzzleGameDto> listAllGames() {
        return toGameDtos(gameRepository.findAllByOrderByCreatedAtDescIdDesc());
    }

    @Transactional
    public PuzzleGameDto createGame(PuzzleGameRequest request, Long adminId) {
        validateGrid(request.getRows(), request.getCols());
        if (request.getImageId() == null) {
            throw new RuntimeException("Image not found");
        }
        PuzzleImage image = imageRepository.findById(request.getImageId())
            .orElseThrow(() -> new RuntimeException("Image not found"));
        String title = cleanTitle(request.getTitle() == null || request.getTitle().isBlank()
            ? image.getTitle() : request.getTitle());
        PuzzleGame game = gameRepository.save(PuzzleGame.builder()
            .title(title).imageId(image.getId()).rows(request.getRows()).cols(request.getCols())
            .snapPercent(resolveSnap(request.getSnapPercent())).active(true).createdBy(adminId).createdAt(LocalDateTime.now()).build());
        return toGameDto(game, image);
    }

    @Transactional
    public PuzzleGameDto updateGame(Long id, PuzzleGameUpdateRequest request) {
        PuzzleGame game = gameRepository.findById(id).orElseThrow(() -> new RuntimeException("Puzzle not found"));
        if (request.getTitle() != null) {
            String title = cleanTitle(request.getTitle());
            if (title.isEmpty()) {
                throw new RuntimeException("Title is required");
            }
            game.setTitle(title);
        }
        if (request.getActive() != null) {
            game.setActive(request.getActive());
        }
        if (request.getSnapPercent() != null) {
            game.setSnapPercent(resolveSnap(request.getSnapPercent()));
        }
        game = gameRepository.save(game);
        return toGameDto(game, imageRepository.findById(game.getImageId()).orElse(null));
    }

    @Transactional
    public void deleteGame(Long id) {
        if (!gameRepository.existsById(id)) {
            throw new RuntimeException("Puzzle not found");
        }
        // puzzle_scores xoa theo (ON DELETE CASCADE)
        gameRepository.deleteById(id);
    }

    // ===== Ket qua, xep hang =====

    @Transactional
    public PuzzleScoreResponse submit(Long userId, PuzzleScoreRequest request) {
        if (request.getGameId() == null || request.getDurationMs() == null || request.getMoves() == null) {
            throw new RuntimeException("Invalid result");
        }
        PuzzleGame game = playableGame(request.getGameId());
        long pieces = (long) game.getRows() * game.getCols();
        // Chong gui ket qua gia: khong the ghep xong nhanh hon moc nay, va moi manh can it nhat 1 thao tac
        if (request.getDurationMs() < pieces * config.getMinMsPerPiece() || request.getMoves() < pieces / 2) {
            throw new RuntimeException("Invalid result");
        }
        Long previousBest = scoreRepository.bestOf(userId, game.getId());
        scoreRepository.save(PuzzleScore.builder()
            .userId(userId).gameId(game.getId())
            .durationMs(request.getDurationMs()).moves(request.getMoves())
            .createdAt(LocalDateTime.now()).build());
        long best = previousBest == null ? request.getDurationMs() : Math.min(previousBest, request.getDurationMs());
        int rank = (int) scoreRepository.countFasterUsers(game.getId(), best) + 1;
        return PuzzleScoreResponse.builder()
            .rank(rank).bestMs(best)
            .personalBest(previousBest == null || request.getDurationMs() < previousBest)
            .build();
    }

    public List<PuzzleRankEntry> leaderboard(Long gameId) {
        playableGame(gameId);
        List<PuzzleRankEntry> result = new ArrayList<>();
        int rank = 1;
        for (Object[] row : scoreRepository.bestPerUser(gameId, PageRequest.of(0, LEADERBOARD_SIZE))) {
            result.add(new PuzzleRankEntry(rank++, (Long) row[0], (String) row[1], (Long) row[2]));
        }
        return result;
    }

    private PuzzleGame playableGame(Long gameId) {
        PuzzleGame game = gameRepository.findById(gameId).filter(g -> Boolean.TRUE.equals(g.getActive()))
            .orElseThrow(() -> new RuntimeException("Puzzle not found"));
        boolean imageActive = imageRepository.findById(game.getImageId())
            .map(i -> Boolean.TRUE.equals(i.getActive())).orElse(false);
        if (!imageActive) {
            throw new RuntimeException("Puzzle not found");
        }
        return game;
    }

    // null = mac dinh; ngoai khoang cho phep thi 400
    int resolveSnap(Integer percent) {
        if (percent == null) {
            return config.getDefaultSnapPercent();
        }
        if (percent < config.getMinSnapPercent() || percent > config.getMaxSnapPercent()) {
            throw new RuntimeException("Invalid snap");
        }
        return percent;
    }

    void validateGrid(Integer rows, Integer cols) {
        if (rows == null || cols == null
                || rows < config.getMinGrid() || rows > config.getMaxGrid()
                || cols < config.getMinGrid() || cols > config.getMaxGrid()) {
            throw new RuntimeException("Invalid grid size");
        }
    }

    private List<PuzzleGameDto> toGameDtos(List<PuzzleGame> games) {
        Map<Long, PuzzleImage> images = imageRepository
            .findAllById(games.stream().map(PuzzleGame::getImageId).distinct().toList()).stream()
            .collect(Collectors.toMap(PuzzleImage::getId, Function.identity()));
        return games.stream().map(g -> toGameDto(g, images.get(g.getImageId()))).toList();
    }

    private static PuzzleGameDto toGameDto(PuzzleGame g, PuzzleImage image) {
        return PuzzleGameDto.builder().id(g.getId()).title(g.getTitle()).imageId(g.getImageId())
            .width(image == null ? null : image.getWidth()).height(image == null ? null : image.getHeight())
            .imageVersion(image == null ? null : image.getVersion())
            .rows(g.getRows()).cols(g.getCols()).snapPercent(g.getSnapPercent()).active(g.getActive()).createdAt(g.getCreatedAt()).build();
    }

    private static String cleanTitle(String title) {
        String value = title == null ? "" : title.trim().replaceAll("\\s+", " ");
        return value.length() > MAX_TITLE_LENGTH ? value.substring(0, MAX_TITLE_LENGTH) : value;
    }

    static PuzzleImageDto toDto(PuzzleImage i) {
        return PuzzleImageDto.builder().id(i.getId()).title(i.getTitle()).width(i.getWidth()).height(i.getHeight())
            .sizeBytes(i.getSizeBytes()).active(i.getActive()).version(i.getVersion())
            .createdAt(i.getCreatedAt()).build();
    }

    public record PuzzleFile(byte[] data, String contentType) {
    }
}
