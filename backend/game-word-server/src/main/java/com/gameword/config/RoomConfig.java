package com.gameword.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// Thong so phong choi nhieu nguoi (DOC-007 muc 3)
@Component
@ConfigurationProperties(prefix = "room")
public class RoomConfig {
    private Integer maxMembers = 8;
    private Integer minPlayers = 2;
    // Dua doan chu: thoi gian toi da cua mot van
    private Integer guessTimeSeconds = 300;
    // Noi tu: thoi gian moi luot
    private Integer chainTurnSeconds = 20;

    public Integer getMaxMembers() {
        return maxMembers;
    }

    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers;
    }

    public Integer getMinPlayers() {
        return minPlayers;
    }

    public void setMinPlayers(Integer minPlayers) {
        this.minPlayers = minPlayers;
    }

    public Integer getGuessTimeSeconds() {
        return guessTimeSeconds;
    }

    public void setGuessTimeSeconds(Integer guessTimeSeconds) {
        this.guessTimeSeconds = guessTimeSeconds;
    }

    public Integer getChainTurnSeconds() {
        return chainTurnSeconds;
    }

    public void setChainTurnSeconds(Integer chainTurnSeconds) {
        this.chainTurnSeconds = chainTurnSeconds;
    }
}
