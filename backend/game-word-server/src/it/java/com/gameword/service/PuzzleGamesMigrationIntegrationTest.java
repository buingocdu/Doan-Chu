package com.gameword.service;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

// Migration v1.13.0 phai giu ket qua xep hang cu: chay den v1.12.0 (29 changeset), chen du lieu, roi chay phan con lai
class PuzzleGamesMigrationIntegrationTest {

    private static final int CHANGESETS_UP_TO_V112 = 29;

    @Test
    void oldScoresAreKeptAndAttachedToGeneratedGames() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().start();
             Connection connection = postgres.getPostgresDatabase().getConnection()) {
            Database database = DatabaseFactory.getInstance()
                .findCorrectDatabaseImplementation(new JdbcConnection(connection));
            Liquibase liquibase = new Liquibase("db/changelog/db.changelog-master.xml",
                new ClassLoaderResourceAccessor(), database);
            liquibase.update(CHANGESETS_UP_TO_V112, "");

            JdbcTemplate jdbc = new JdbcTemplate(new SingleConnectionDataSource(connection, true));
            jdbc.update("insert into users (username, password, email, role, token_version) "
                + "values ('u1','x','u1@e.com','USER',0), ('u2','x','u2@e.com','USER',0)");
            Long u1 = jdbc.queryForObject("select id from users where username='u1'", Long.class);
            Long u2 = jdbc.queryForObject("select id from users where username='u2'", Long.class);
            jdbc.update("insert into puzzle_images (title, content_type, width, height, size_bytes, active, created_at) "
                + "values ('Hoa sen','image/jpeg',800,600,10,true,now())");
            Long img = jdbc.queryForObject("select id from puzzle_images", Long.class);
            // Hai ket qua 3x3 va mot ket qua 4x4 tren cung anh
            jdbc.update("insert into puzzle_scores (user_id, image_id, piece_rows, piece_cols, duration_ms, moves, created_at) "
                + "values (?,?,3,3,50000,20,now()), (?,?,3,3,40000,18,now()), (?,?,4,4,90000,40,now())",
                u1, img, u2, img, u1, img);

            liquibase.update("");

            List<Map<String, Object>> games = jdbc.queryForList(
                "select title, piece_rows, piece_cols, active from puzzle_games order by piece_rows");
            assertEquals(2, games.size());
            assertEquals("Hoa sen", games.get(0).get("title"));
            assertEquals(3, games.get(0).get("piece_rows"));
            assertEquals(4, games.get(1).get("piece_rows"));
            assertEquals(Boolean.TRUE, games.get(0).get("active"));

            // Moi ket qua cu van con va gan dung game cung luoi
            assertEquals(3, jdbc.queryForObject("select count(*) from puzzle_scores", Integer.class));
            assertEquals(2, jdbc.queryForObject("select count(*) from puzzle_scores s "
                + "join puzzle_games g on g.id = s.game_id where g.piece_rows = 3 and g.piece_cols = 3", Integer.class));
            assertEquals(1, jdbc.queryForObject("select count(*) from puzzle_scores s "
                + "join puzzle_games g on g.id = s.game_id where g.piece_rows = 4", Integer.class));
            // Cot cu da bi go
            assertEquals(0, jdbc.queryForObject("select count(*) from information_schema.columns "
                + "where table_name = 'puzzle_scores' and column_name in ('image_id','piece_rows','piece_cols')",
                Integer.class));
        }
    }
}
