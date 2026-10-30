package com.gameword.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Origin cua app mobile Capacitor (Android: http/https://localhost, iOS: capacitor://localhost)
    static final List<String> MOBILE_ORIGINS = List.of("http://localhost", "https://localhost", "capacitor://localhost");

    private final JwtAuthFilter jwtAuthFilter;
    private final List<String> allowedOrigins;

    // app.cors.allowed-origins: dia chi web, phan cach bang dau phay (production: SITE_URL)
    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          @Value("${app.cors.allowed-origins:}") String allowedOrigins) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.allowedOrigins = parseOrigins(allowedOrigins);
    }

    static List<String> parseOrigins(String value) {
        List<String> origins = new ArrayList<>(MOBILE_ORIGINS);
        Arrays.stream(value == null ? new String[0] : value.split(","))
            .map(String::trim)
            .map(o -> o.replaceAll("/+$", ""))
            // Khong chap nhan "*": moi trang web khac se goi duoc API thay nguoi dung
            .filter(o -> !o.isEmpty() && !o.contains("*"))
            .forEach(origins::add);
        return List.copyOf(origins);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration cfg = new CorsConfiguration();
                cfg.setAllowedOrigins(allowedOrigins);
                cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
                // Token gui qua header Authorization, khong dung cookie
                cfg.setAllowCredentials(false);
                cfg.setMaxAge(3600L);
                return cfg;
            }))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/change-password").authenticated()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/words/random").permitAll()
                .requestMatchers("/api/words/**").permitAll()
                .requestMatchers("/api/game/**").permitAll()
                .requestMatchers("/api/history/**").authenticated()
                .requestMatchers("/api/leaderboard/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
