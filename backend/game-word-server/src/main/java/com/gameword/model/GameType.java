package com.gameword.model;

// Che do choi trong phong; luu vao DB duoi dang ten (VARCHAR)
public enum GameType {
    // Moi nguoi doan cung mot tu, ai dung truoc thang
    WORD_GUESS,
    // Noi tu theo luot, sai/het gio bi loai
    WORD_CHAIN;

    public static GameType parse(String value) {
        if (value == null) {
            throw new RuntimeException("Invalid game type");
        }
        try {
            return GameType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid game type");
        }
    }
}
