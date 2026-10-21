package com.gameword.service;

import com.gameword.dto.AuthResponse;
import com.gameword.dto.LoginRequest;
import com.gameword.dto.RegisterRequest;
import com.gameword.model.User;
import com.gameword.repository.UserRepository;
import com.gameword.config.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        User user = User.builder()
            .username(request.getUsername())
            .password(passwordEncoder.encode(request.getPassword()))
            .email(request.getEmail())
            .totalScore(0)
            .gamesPlayed(0)
            .gamesWon(0)
            .build();
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        return AuthResponse.builder()
            .token(token)
            .userId(user.getId())
            .username(user.getUsername())
            .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user.getEmail());
        return AuthResponse.builder()
            .token(token)
            .userId(user.getId())
            .username(user.getUsername())
            .build();
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
