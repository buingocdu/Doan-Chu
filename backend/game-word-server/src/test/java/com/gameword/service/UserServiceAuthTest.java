package com.gameword.service;

import com.gameword.config.JwtUtil;
import com.gameword.dto.ChangePasswordRequest;
import com.gameword.dto.LoginRequest;
import com.gameword.dto.ResetPasswordRequest;
import com.gameword.model.PasswordResetToken;
import com.gameword.model.User;
import com.gameword.repository.PasswordResetTokenRepository;
import com.gameword.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class UserServiceAuthTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private UserRepository repo;
    private PasswordResetTokenRepository tokenRepo;
    private MailService mail;
    private JwtUtil jwt;
    private UserService service;
    private User user;

    @BeforeEach
    void setUp() {
        repo = mock(UserRepository.class);
        tokenRepo = mock(PasswordResetTokenRepository.class);
        mail = mock(MailService.class);
        jwt = mock(JwtUtil.class);
        when(jwt.generateToken(anyString(), anyInt())).thenAnswer(inv -> "token-v" + inv.getArgument(1));
        service = new UserService(repo, tokenRepo, encoder, jwt, mail, "https://game.example/");
        user = User.builder().id(1L).username("player1").email("p1@example.com")
            .password(encoder.encode("secret1")).tokenVersion(0).build();
        when(repo.findByUsername("player1")).thenReturn(Optional.of(user));
        when(repo.findByEmail("p1@example.com")).thenReturn(Optional.of(user));
        when(repo.findById(1L)).thenReturn(Optional.of(user));
    }

    @Test
    void loginAcceptsUsernameOrEmail() {
        assertEquals("player1", service.login(new LoginRequest("player1", "secret1")).getUsername());
        assertEquals("player1", service.login(new LoginRequest(" p1@example.com ", "secret1")).getUsername());
        assertThrows(RuntimeException.class, () -> service.login(new LoginRequest("p1@example.com", "wrong")));
        assertThrows(RuntimeException.class, () -> service.login(new LoginRequest("nobody", "secret1")));
    }

    @Test
    void changePasswordRequiresCurrentPasswordAndRevokesOldTokens() {
        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> service.changePassword("player1", new ChangePasswordRequest("wrong", "newpass")));
        assertEquals("Current password is incorrect", ex.getMessage());
        assertThrows(RuntimeException.class,
            () -> service.changePassword("player1", new ChangePasswordRequest("secret1", "123")));

        assertEquals("token-v1", service.changePassword("player1", new ChangePasswordRequest("secret1", "newpass")).getToken());
        assertTrue(encoder.matches("newpass", user.getPassword()));
        assertEquals(1, user.getTokenVersion());
    }

    @Test
    void requestPasswordResetEmailsLinkAndStoresOnlyHash() {
        service.requestPasswordReset("p1@example.com");

        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(mail).sendPasswordResetLink(eq("p1@example.com"), eq("player1"), link.capture(), eq(30L));
        assertTrue(link.getValue().startsWith("https://game.example/reset-password?token="));
        String token = link.getValue().substring(link.getValue().indexOf('=') + 1);

        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepo).save(saved.capture());
        assertEquals(UserService.sha256(token), saved.getValue().getTokenHash());
        assertNotEquals(token, saved.getValue().getTokenHash());
        // Mat khau chua doi cho den khi dung link
        assertTrue(encoder.matches("secret1", user.getPassword()));
    }

    @Test
    void requestPasswordResetRespectsCooldownAndIgnoresUnknownEmail() {
        when(tokenRepo.existsByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(true);
        service.requestPasswordReset("p1@example.com");
        when(repo.findByEmail("x@example.com")).thenReturn(Optional.empty());
        service.requestPasswordReset("x@example.com");
        verifyNoInteractions(mail);
        verify(tokenRepo, never()).save(any());
    }

    @Test
    void resetPasswordWithValidTokenChangesPasswordOnce() {
        PasswordResetToken stored = PasswordResetToken.builder().userId(1L).tokenHash(UserService.sha256("abc"))
            .expiresAt(LocalDateTime.now().plusMinutes(5)).build();
        when(tokenRepo.findByTokenHash(UserService.sha256("abc"))).thenReturn(Optional.of(stored));

        service.resetPassword(new ResetPasswordRequest("abc", "newpass"));
        assertTrue(encoder.matches("newpass", user.getPassword()));
        assertEquals(1, user.getTokenVersion());
        verify(tokenRepo).deleteByUserId(1L);
    }

    @Test
    void resetPasswordRejectsUnknownOrExpiredToken() {
        PasswordResetToken expired = PasswordResetToken.builder().userId(1L).tokenHash(UserService.sha256("old"))
            .expiresAt(LocalDateTime.now().minusMinutes(1)).build();
        when(tokenRepo.findByTokenHash(UserService.sha256("old"))).thenReturn(Optional.of(expired));
        when(tokenRepo.findByTokenHash(UserService.sha256("bad"))).thenReturn(Optional.empty());

        for (String token : new String[] {"old", "bad", ""}) {
            RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.resetPassword(new ResetPasswordRequest(token, "newpass")));
            assertEquals("Invalid or expired reset token", ex.getMessage());
        }
        assertTrue(encoder.matches("secret1", user.getPassword()));
    }
}
