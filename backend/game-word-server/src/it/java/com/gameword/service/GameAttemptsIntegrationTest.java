package com.gameword.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Ung dung that (cau hinh tu application.properties): van choi don co dung 6 luot doan
@SpringBootTest
@AutoConfigureMockMvc
class GameAttemptsIntegrationTest {

    private static final EmbeddedPostgres POSTGRES = startPostgres();
    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired
    private MockMvc mvc;

    private static EmbeddedPostgres startPostgres() {
        try {
            return EmbeddedPostgres.builder().start();
        } catch (IOException ex) {
            throw new IllegalStateException(ex);
        }
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "postgres");
        registry.add("spring.jpa.show-sql", () -> "false");
    }

    @AfterAll
    static void stop() throws IOException {
        POSTGRES.close();
    }

    @Test
    void singlePlayerGameAllowsExactlySixAttempts() throws Exception {
        JsonNode started = JSON.readTree(mvc.perform(post("/api/game/start")).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString());
        assertEquals(6, started.get("maxAttempts").asInt());
        long gameId = started.get("gameId").asLong();
        StringBuilder wrong = new StringBuilder();
        for (JsonNode part : started.get("partLengths")) {
            if (wrong.length() > 0) {
                wrong.append(' ');
            }
            wrong.append("Q".repeat(part.asInt()));
        }
        String body = "{\"gameId\":" + gameId + ",\"guess\":\"" + wrong + "\"}";

        for (int attempt = 1; attempt <= 6; attempt++) {
            JsonNode res = JSON.readTree(mvc.perform(post("/api/game/guess").contentType("application/json").content(body))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
            assertEquals(attempt, res.get("attempt").asInt());
            assertEquals(6, res.get("maxAttempts").asInt());
            if (attempt < 6) {
                assertFalse(res.get("gameOver").asBoolean(), "chua het luot o lan " + attempt);
            } else {
                assertTrue(res.get("gameOver").asBoolean(), "het luot o lan 6");
            }
        }
        // Het 6 luot: doan them khong tao luot thu 7, server tra lai trang thai van da ket thuc
        JsonNode after = JSON.readTree(mvc.perform(post("/api/game/guess").contentType("application/json").content(body))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertEquals(6, after.get("attempt").asInt());
        assertTrue(after.get("gameOver").asBoolean());
    }
}
