package com.gameword.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SecurityHardeningTest {

    @Test
    void corsAllowsOnlyConfiguredSiteAndMobileApp() {
        List<String> origins = SecurityConfig.parseOrigins(" https://doanchu.example/ , *, https://*.evil.example ,");
        assertTrue(origins.contains("https://doanchu.example"));
        assertTrue(origins.containsAll(SecurityConfig.MOBILE_ORIGINS));
        assertTrue(origins.stream().noneMatch(o -> o.contains("*")));
        assertEquals(SecurityConfig.MOBILE_ORIGINS, SecurityConfig.parseOrigins(null));
    }

    @Test
    void jwtSecretMustBeLongEnough() {
        JwtUtil weak = new JwtUtil();
        ReflectionTestUtils.setField(weak, "secret", "short-secret");
        assertThrows(IllegalStateException.class, weak::checkSecret);

        ReflectionTestUtils.setField(weak, "secret", null);
        assertThrows(IllegalStateException.class, weak::checkSecret);

        JwtUtil strong = new JwtUtil();
        ReflectionTestUtils.setField(strong, "secret", "x".repeat(JwtUtil.MIN_SECRET_BYTES));
        assertDoesNotThrow(strong::checkSecret);
    }
}
