package com.gameword.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

// Thong so phong choi nhieu nguoi (DOC-007 muc 3)
@Component
@ConfigurationProperties(prefix = "room")
public class RoomConfig {
    private Integer maxMembers = 8;
    private Integer minPlayers = 2;
    // Dua doan chu: thoi gian toi da cua mot van
    private Integer guessTimeSeconds = 300;
    // Dua doan chu: cac lua chon thoi gian van (phut) va khoang cach giua 2 goi y
    private List<Integer> guessMinuteOptions = List.of(5, 10);
    private Integer hintIntervalSeconds = 30;
    // Noi tu: thoi gian moi luot
    private Integer chainTurnSeconds = 30;

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

    public List<Integer> getGuessMinuteOptions() {
        return guessMinuteOptions;
    }

    public void setGuessMinuteOptions(List<Integer> guessMinuteOptions) {
        this.guessMinuteOptions = guessMinuteOptions;
    }

    public Integer getHintIntervalSeconds() {
        return hintIntervalSeconds;
    }

    public void setHintIntervalSeconds(Integer hintIntervalSeconds) {
        this.hintIntervalSeconds = hintIntervalSeconds;
    }

    public Integer getChainTurnSeconds() {
        return chainTurnSeconds;
    }

    public void setChainTurnSeconds(Integer chainTurnSeconds) {
        this.chainTurnSeconds = chainTurnSeconds;
    }
}
