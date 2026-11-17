package com.gameword.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gameword.dto.AuthResponse;
import com.gameword.dto.RegisterRequest;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Migration v1.12.0 + Hibernate validate (bytea) + phan quyen ADMIN + luong upload / choi / xep hang tren PostgreSQL nhung
@SpringBootTest
@AutoConfigureMockMvc
class PuzzleFlowIntegrationTest {

    private static final EmbeddedPostgres POSTGRES = startPostgres();
    private static final AtomicInteger SEQ = new AtomicInteger();
    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired
    private MockMvc mvc;
    @Autowired
    private UserService userService;
    @Autowired
    private JdbcTemplate jdbc;

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

    private String register(boolean admin) {
        int n = SEQ.incrementAndGet();
        RegisterRequest req = new RegisterRequest();
        req.setUsername("pz" + n);
        req.setPassword("secret123");
        req.setEmail("pz" + n + "@example.com");
        AuthResponse res = userService.register(req);
        if (admin) {
            jdbc.update("update users set role = 'ADMIN' where id = ?", res.getUserId());
        }
        return "Bearer " + res.getToken();
    }

    private static byte[] png(int w, int h) throws Exception {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    private long uploadImage(String adminToken, String title) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", png(800, 600));
        MvcResult result = mvc.perform(multipart("/api/admin/puzzle/images").file(file).param("title", title)
                .header("Authorization", adminToken))
            .andExpect(status().isOk()).andReturn();
        JsonNode body = JSON.readTree(result.getResponse().getContentAsString());
        assertEquals(title, body.get("title").asText());
        assertEquals(800, body.get("width").asInt());
        return body.get("id").asLong();
    }

    @Test
    void adminEndpointsAreForbiddenForNormalUsersAndGuests() throws Exception {
        String user = register(false);
        MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", png(800, 600));
        mvc.perform(multipart("/api/admin/puzzle/images").file(file).header("Authorization", user))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/puzzle/images").header("Authorization", user)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/puzzle/images")).andExpect(status().isForbidden());
    }

    private long createGame(String adminToken, long imageId, int rows, int cols) throws Exception {
        MvcResult result = mvc.perform(post("/api/admin/puzzle/games").header("Authorization", adminToken)
                .contentType("application/json")
                .content("{\"imageId\":" + imageId + ",\"rows\":" + rows + ",\"cols\":" + cols + ",\"title\":\"Game thu\"}"))
            .andExpect(status().isOk()).andReturn();
        JsonNode body = JSON.readTree(result.getResponse().getContentAsString());
        assertEquals(rows, body.get("rows").asInt());
        assertEquals(800, body.get("width").asInt());
        return body.get("id").asLong();
    }

    @Test
    void playersSeeOnlyActiveGamesAndImagesStayPublicOnlyWhileActive() throws Exception {
        String admin = register(true);
        String player = register(false);
        long imageId = uploadImage(admin, "Hoa sen");
        long gameId = createGame(admin, imageId, 3, 4);

        String list = mvc.perform(get("/api/puzzle/games").header("Authorization", player))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(list.contains("\"id\":" + gameId));

        // Anh tai khong can token (the img) va luon la JPEG
        MvcResult file = mvc.perform(get("/api/puzzle/images/" + imageId + "/file")).andExpect(status().isOk()).andReturn();
        assertEquals("image/jpeg", file.getResponse().getContentType());

        // Admin an game -> nguoi choi khong thay
        mvc.perform(put("/api/admin/puzzle/games/" + gameId).header("Authorization", admin)
            .contentType("application/json").content("{\"active\":false}")).andExpect(status().isOk());
        assertTrue(!mvc.perform(get("/api/puzzle/games").header("Authorization", player))
            .andReturn().getResponse().getContentAsString().contains("\"id\":" + gameId));
        mvc.perform(put("/api/admin/puzzle/games/" + gameId).header("Authorization", admin)
            .contentType("application/json").content("{\"active\":true}")).andExpect(status().isOk());

        // Admin an anh -> game cung bien mat, anh khong tai duoc
        mvc.perform(put("/api/admin/puzzle/images/" + imageId).header("Authorization", admin)
            .contentType("application/json").content("{\"active\":false}")).andExpect(status().isOk());
        assertTrue(!mvc.perform(get("/api/puzzle/games").header("Authorization", player))
            .andReturn().getResponse().getContentAsString().contains("\"id\":" + gameId));
        mvc.perform(get("/api/puzzle/images/" + imageId + "/file")).andExpect(status().isBadRequest());

        // Xoa anh keo theo xoa game
        mvc.perform(delete("/api/admin/puzzle/images/" + imageId).header("Authorization", admin))
            .andExpect(status().isNoContent());
        assertTrue(!mvc.perform(get("/api/admin/puzzle/games").header("Authorization", admin))
            .andReturn().getResponse().getContentAsString().contains("\"id\":" + gameId));
    }

    @Test
    void normalUserCannotCreateGamesAndInvalidGridIsRejected() throws Exception {
        String admin = register(true);
        String user = register(false);
        long imageId = uploadImage(admin, "Bien");
        mvc.perform(post("/api/admin/puzzle/games").header("Authorization", user).contentType("application/json")
            .content("{\"imageId\":" + imageId + ",\"rows\":3,\"cols\":3}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/puzzle/games").header("Authorization", admin).contentType("application/json")
            .content("{\"imageId\":" + imageId + ",\"rows\":1,\"cols\":3}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/puzzle/games").header("Authorization", admin).contentType("application/json")
            .content("{\"imageId\":" + imageId + ",\"rows\":3,\"cols\":99}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/puzzle/games").header("Authorization", admin).contentType("application/json")
            .content("{\"imageId\":99999,\"rows\":3,\"cols\":3}")).andExpect(status().isBadRequest());
    }

    @Test
    void uploadRejectsNonImage() throws Exception {
        String admin = register(true);
        MockMultipartFile file = new MockMultipartFile("file", "x.png", "image/png", "not an image".getBytes());
        mvc.perform(multipart("/api/admin/puzzle/images").file(file).param("title", "x").header("Authorization", admin))
            .andExpect(status().isBadRequest());
    }

    @Test
    void scoresAreValidatedAgainstTheGameAndRanked() throws Exception {
        String admin = register(true);
        long gameId = createGame(admin, uploadImage(admin, "Bien xanh"), 3, 3);
        String fast = register(false);
        String slow = register(false);

        // 3x3 = 9 manh: nhanh hon 9 * 300ms hoac it thao tac hon 4 la ket qua gia
        mvc.perform(post("/api/puzzle/scores").header("Authorization", fast).contentType("application/json")
            .content(score(gameId, 500, 20))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/puzzle/scores").header("Authorization", fast).contentType("application/json")
            .content(score(gameId, 60_000, 1))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/puzzle/scores").header("Authorization", fast).contentType("application/json")
            .content(score(99999, 60_000, 20))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/puzzle/scores").contentType("application/json")
            .content(score(gameId, 60_000, 20))).andExpect(status().isForbidden());

        mvc.perform(post("/api/puzzle/scores").header("Authorization", slow).contentType("application/json")
            .content(score(gameId, 90_000, 25))).andExpect(status().isOk());
        MvcResult res = mvc.perform(post("/api/puzzle/scores").header("Authorization", fast)
            .contentType("application/json").content(score(gameId, 40_000, 15))).andExpect(status().isOk()).andReturn();
        JsonNode body = JSON.readTree(res.getResponse().getContentAsString());
        assertEquals(1, body.get("rank").asInt());
        assertTrue(body.get("personalBest").asBoolean());

        String board = mvc.perform(get("/api/puzzle/leaderboard?gameId=" + gameId).header("Authorization", fast))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode rows = JSON.readTree(board);
        assertEquals(2, rows.size());
        assertEquals(40_000, rows.get(0).get("durationMs").asLong());
        assertEquals(2, rows.get(1).get("rank").asInt());
    }

    private static String score(long gameId, long ms, int moves) {
        return "{\"gameId\":" + gameId + ",\"durationMs\":" + ms + ",\"moves\":" + moves + "}";
    }
}
