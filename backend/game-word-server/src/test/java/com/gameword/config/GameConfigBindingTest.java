package com.gameword.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;
import org.springframework.core.io.support.PropertiesLoaderUtils;

import java.io.IOException;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;

// Truoc day khoa trong application*.properties (game.guess.max-attempts) khong khop GameConfig (prefix game) nen bi bo qua
// va gia tri that lay tu mac dinh trong code. Test nay bat loi do: file cau hinh phai bind duoc vao GameConfig.
class GameConfigBindingTest {

    private static GameConfig bindFrom(String resource) throws IOException {
        Properties props = PropertiesLoaderUtils.loadAllProperties(resource);
        GameConfig config = new GameConfig();
        // Dat gia tri khac mac dinh de chac chan la file cau hinh gan vao chu khong phai mac dinh trong code
        config.setMaxAttempts(-1);
        config.setScoreMin(-1);
        config.setScoreMax(-1);
        new Binder(new MapConfigurationPropertySource(props)).bind("game", Bindable.ofInstance(config));
        return config;
    }

    @Test
    void defaultIsSixAttemptsWithScoreFrom100To10() {
        GameConfig config = new GameConfig();
        assertEquals(6, config.getMaxAttempts());
        assertEquals(10, config.getScoreMin());
        assertEquals(100, config.getScoreMax());
    }

    @Test
    void applicationPropertiesBindToGameConfig() throws IOException {
        GameConfig config = bindFrom("application.properties");
        assertEquals(6, config.getMaxAttempts());
        assertEquals(10, config.getScoreMin());
        assertEquals(100, config.getScoreMax());
    }

    @Test
    void prodPropertiesBindToGameConfig() throws IOException {
        GameConfig config = bindFrom("application-prod.properties");
        assertEquals(6, config.getMaxAttempts());
        assertEquals(10, config.getScoreMin());
        assertEquals(100, config.getScoreMax());
    }
}
