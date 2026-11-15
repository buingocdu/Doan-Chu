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

    @Test
    void adminUploadsAndPlayersSeeOnlyActiveImages() throws Exception {
        String admin = register(true);
        String player = register(false);
        long id = uploadImage(admin, "Hoa sen");

        mvc.perform(get("/api/puzzle/images").header("Authorization", player)).andExpect(status().isOk());
        String listBefore = mvc.perform(get("/api/puzzle/images").header("Authorization", player))
            .andReturn().getResponse().getContentAsString();
        assertTrue(listBefore.contains("\"id\":" + id));

        // Anh tai khong can token (the <img>) va luon la JPEG
        MvcResult file = mvc.perform(get("/api/puzzle/images/" + id + "/file")).andExpect(status().isOk()).andReturn();
        assertEquals("image/jpeg", file.getResponse().getContentType());

        // Admin an anh -> nguoi choi khong thay va khong tai duoc
        mvc.perform(put("/api/admin/puzzle/images/" + id).header("Authorization", admin)
            .contentType("application/json").content("{\"active\":false}")).andExpect(status().isOk());
        String listAfter = mvc.perform(get("/api/puzzle/images").header("Authorization", player))
            .andReturn().getResponse().getContentAsString();
        assertTrue(!listAfter.contains("\"id\":" + id));
        mvc.perform(get("/api/puzzle/images/" + id + "/file")).andExpect(status().isBadRequest());

        mvc.perform(delete("/api/admin/puzzle/images/" + id).header("Authorization", admin))
            .andExpect(status().isNoContent());
    }

    @Test
    void uploadRejectsNonImage() throws Exception {
        String admin = register(true);
        MockMultipartFile file = new MockMultipartFile("file", "x.png", "image/png", "not an image".getBytes());
        mvc.perform(multipart("/api/admin/puzzle/images").file(file).param("title", "x").header("Authorization", admin))
            .andExpect(status().isBadRequest());
    }

    @Test
    void scoresAreValidatedAndRanked() throws Exception {
        String admin = register(true);
        long id = uploadImage(admin, "Bien xanh");
        String fast = register(false);
        String slow = register(false);

        // 3x3 = 9 manh: nhanh hon 9 * 300ms hoac it thao tac hon 4 la ket qua gia
        mvc.perform(post("/api/puzzle/scores").header("Authorization", fast).contentType("application/json")
            .content(score(id, 3, 3, 500, 20))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/puzzle/scores").header("Authorization", fast).contentType("application/json")
            .content(score(id, 3, 3, 60_000, 1))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/puzzle/scores").header("Authorization", fast).contentType("application/json")
            .content(score(id, 99, 3, 60_000, 20))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/puzzle/scores").contentType("application/json")
            .content(score(id, 3, 3, 60_000, 20))).andExpect(status().isForbidden());

        mvc.perform(post("/api/puzzle/scores").header("Authorization", slow).contentType("application/json")
            .content(score(id, 3, 3, 90_000, 25))).andExpect(status().isOk());
        MvcResult res = mvc.perform(post("/api/puzzle/scores").header("Authorization", fast)
            .contentType("application/json").content(score(id, 3, 3, 40_000, 15))).andExpect(status().isOk()).andReturn();
        JsonNode body = JSON.readTree(res.getResponse().getContentAsString());
        assertEquals(1, body.get("rank").asInt());
        assertTrue(body.get("personalBest").asBoolean());

        String board = mvc.perform(get("/api/puzzle/leaderboard?imageId=" + id + "&rows=3&cols=3")
                .header("Authorization", fast))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode rows = JSON.readTree(board);
        assertEquals(2, rows.size());
        assertEquals(40_000, rows.get(0).get("durationMs").asLong());
        assertEquals(2, rows.get(1).get("rank").asInt());
    }

    private static String score(long imageId, int rows, int cols, long ms, int moves) {
        return "{\"imageId\":" + imageId + ",\"rows\":" + rows + ",\"cols\":" + cols
            + ",\"durationMs\":" + ms + ",\"moves\":" + moves + "}";
    }
}
