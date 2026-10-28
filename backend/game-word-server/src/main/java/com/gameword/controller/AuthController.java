package com.gameword.controller;

import com.gameword.dto.AuthResponse;
import com.gameword.dto.ChangePasswordRequest;
import com.gameword.dto.ForgotPasswordRequest;
import com.gameword.dto.LoginRequest;
import com.gameword.dto.MessageResponse;
import com.gameword.dto.RegisterRequest;
import com.gameword.dto.ResetPasswordRequest;
import com.gameword.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    // Luon tra ve cung mot thong bao du email co ton tai hay khong
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        userService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(new MessageResponse("If the email exists, a reset link has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Password reset"));
    }

    // Yeu cau JWT (cau hinh trong SecurityConfig). Tra token moi vi token cu bi vo hieu hoa.
    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changePassword(@RequestBody ChangePasswordRequest request,
                                                       Principal principal) {
        return ResponseEntity.ok(userService.changePassword(principal.getName(), request));
    }
}
