package com.gameword.service;

import com.gameword.dto.AuthResponse;
import com.gameword.dto.ChangePasswordRequest;
import com.gameword.dto.LoginRequest;
import com.gameword.dto.RegisterRequest;
import com.gameword.dto.ResetPasswordRequest;
import com.gameword.model.PasswordResetToken;
import com.gameword.model.User;
import com.gameword.repository.PasswordResetTokenRepository;
import com.gameword.repository.UserRepository;
import com.gameword.config.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final int MIN_PASSWORD_LENGTH = 6;
    private static final int MAX_PASSWORD_BYTES = 72;
    private static final int MAX_EMAIL_LENGTH = 254;
    // Khong cho '@' trong ten tai khoan: dang nhap dung '@' de phan biet email
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_.]{3,30}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final long RESET_TOKEN_VALID_MINUTES = 30;
    // Chong spam: moi tai khoan chi duoc gui 1 link trong khoang nay
    private static final long RESET_COOLDOWN_MINUTES = 2;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MailService mailService;
    private final String frontendUrl;
    private final SecureRandom random = new SecureRandom();

    public UserService(UserRepository userRepository, PasswordResetTokenRepository resetTokenRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil, MailService mailService,
                       @Value("${app.frontend-url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mailService = mailService;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    // Kiem tra o backend (khong tin frontend): giong quy tac trong frontend features/auth/utils/validation.ts
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername() == null ? "" : request.getUsername().trim();
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new RuntimeException("Invalid username");
        }
        if (email.length() > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new RuntimeException("Invalid email");
        }
        checkPasswordLength(request.getPassword(), "Invalid password");
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        User user = User.builder()
            .username(username)
            .password(passwordEncoder.encode(request.getPassword()))
            .email(email)
            .totalScore(0)
            .gamesPlayed(0)
            .gamesWon(0)
            .tokenVersion(0)
            .build();
        user = userRepository.save(user);
        return toAuthResponse(user);
    }

    // Truong "username" nhan ca ten tai khoan lan email (ten tai khoan hop le khong chua '@')
    public AuthResponse login(LoginRequest request) {
        User user = findByUsernameOrEmail(request.getUsername())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (request.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        return toAuthResponse(user);
    }

    // Tra ve token moi: cac JWT cu (thiet bi khac) het hieu luc, phien hien tai tiep tuc voi token nay
    @Transactional
    public AuthResponse changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getCurrentPassword() == null
                || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        updatePassword(user, request.getNewPassword());
        return toAuthResponse(user);
    }

    // Gui link dat lai mat khau. Email khong ton tai cung khong bao loi de tranh do tim tai khoan.
    // Mat khau hien tai giu nguyen cho den khi link duoc su dung.
    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        Optional<User> found = userRepository.findByEmail(email.trim());
        if (found.isEmpty()) {
            return;
        }
        User user = found.get();
        LocalDateTime now = LocalDateTime.now();
        if (resetTokenRepository.existsByUserIdAndCreatedAtAfter(user.getId(), now.minusMinutes(RESET_COOLDOWN_MINUTES))) {
            return;
        }
        // Moi luc chi 1 link con hieu luc
        resetTokenRepository.deleteByUserId(user.getId());
        String token = generateToken();
        resetTokenRepository.save(PasswordResetToken.builder()
            .userId(user.getId())
            .tokenHash(sha256(token))
            .expiresAt(now.plusMinutes(RESET_TOKEN_VALID_MINUTES))
            .createdAt(now)
            .build());
        // Gui loi -> nem exception -> rollback, token khong duoc luu
        String link = frontendUrl + "/reset-password?token=" + token;
        mailService.sendPasswordResetLink(user.getEmail(), user.getUsername(), link, RESET_TOKEN_VALID_MINUTES);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new RuntimeException("Invalid or expired reset token");
        }
        PasswordResetToken resetToken = resetTokenRepository.findByTokenHash(sha256(request.getToken().trim()))
            .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
            .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));
        User user = getUser(resetToken.getUserId());
        updatePassword(user, request.getNewPassword());
        // Link chi dung 1 lan
        resetTokenRepository.deleteByUserId(user.getId());
    }

    // Doi hash va tang token_version de dang xuat moi phien cu
    private void updatePassword(User user, String newPassword) {
        checkPasswordLength(newPassword, "New password too short");
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    // Toi thieu 6 ky tu; toi da 72 byte vi BCrypt bo qua phan sau 72 byte (mat khau dai hon se bi cat ngam)
    private static void checkPasswordLength(String password, String tooShortMessage) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new RuntimeException(tooShortMessage);
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new RuntimeException("Password too long");
        }
    }

    private AuthResponse toAuthResponse(User user) {
        return AuthResponse.builder()
            .token(jwtUtil.generateToken(user.getUsername(), user.getTokenVersion()))
            .userId(user.getId())
            .username(user.getUsername())
            .build();
    }

    private Optional<User> findByUsernameOrEmail(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        String value = identifier.trim();
        return value.contains("@") ? userRepository.findByEmail(value) : userRepository.findByUsername(value);
    }

    // 256 bit ngau nhien, base64url de dat thang vao URL
    private String generateToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    public Long getUserIdByUsername(String username) {
        return userRepository.findByUsername(username)
            .map(User::getId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void addScore(Long userId, Integer score) {
        User user = getUser(userId);
        user.setTotalScore(user.getTotalScore() + score);
        user.setGamesPlayed(user.getGamesPlayed() + 1);
        user.setGamesWon(user.getGamesWon() + 1);
        userRepository.save(user);
    }

    public void incrementPlayed(Long userId) {
        User user = getUser(userId);
        user.setGamesPlayed(user.getGamesPlayed() + 1);
        userRepository.save(user);
    }
}
