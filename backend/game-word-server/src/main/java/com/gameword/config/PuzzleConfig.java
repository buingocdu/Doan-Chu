package com.gameword.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// Cau hinh ghep hinh (prefix puzzle.*)
@Component
@ConfigurationProperties(prefix = "puzzle")
public class PuzzleConfig {
    // Gioi han so hang/cot nguoi choi tu chon
    private int minGrid = 2;
    private int maxGrid = 12;
    // Anh upload toi da (byte) truoc khi xu ly; anh luu duoc thu nho ve maxImageSide
    private long maxUploadBytes = 8L * 1024 * 1024;
    private int maxImageSide = 1600;
    private int minImageSide = 300;
    // Thoi gian toi thieu moi manh ghep (ms) de ket qua duoc coi la hop le
    private long minMsPerPiece = 300;

    public int getMinGrid() { return minGrid; }
    public void setMinGrid(int minGrid) { this.minGrid = minGrid; }
    public int getMaxGrid() { return maxGrid; }
    public void setMaxGrid(int maxGrid) { this.maxGrid = maxGrid; }
    public long getMaxUploadBytes() { return maxUploadBytes; }
    public void setMaxUploadBytes(long maxUploadBytes) { this.maxUploadBytes = maxUploadBytes; }
    public int getMaxImageSide() { return maxImageSide; }
    public void setMaxImageSide(int maxImageSide) { this.maxImageSide = maxImageSide; }
    public int getMinImageSide() { return minImageSide; }
    public void setMinImageSide(int minImageSide) { this.minImageSide = minImageSide; }
    public long getMinMsPerPiece() { return minMsPerPiece; }
    public void setMinMsPerPiece(long minMsPerPiece) { this.minMsPerPiece = minMsPerPiece; }
}
