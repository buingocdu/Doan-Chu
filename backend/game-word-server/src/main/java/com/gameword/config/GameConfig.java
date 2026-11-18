package com.gameword.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "game")
public class GameConfig {
    // So luot doan toi da (game.max-attempts); diem giam deu tu scoreMax o luot 1 xuong scoreMin o luot cuoi
    private Integer maxAttempts = 6;
    private Integer scoreMin = 10;
    private Integer scoreMax = 100;

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Integer getScoreMin() {
        return scoreMin;
    }

    public void setScoreMin(Integer scoreMin) {
        this.scoreMin = scoreMin;
    }

    public Integer getScoreMax() {
        return scoreMax;
    }

    public void setScoreMax(Integer scoreMax) {
        this.scoreMax = scoreMax;
    }
}
