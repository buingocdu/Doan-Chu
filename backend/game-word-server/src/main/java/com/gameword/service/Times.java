package com.gameword.service;

import java.time.LocalDateTime;
import java.time.ZoneId;

// Doi LocalDateTime (gio may chu, cung mui gio voi cac cot TIMESTAMP) sang epoch ms cho client
final class Times {

    private Times() {
    }

    static Long epochMillis(LocalDateTime time) {
        return time == null ? null : time.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    static long nowMillis() {
        return System.currentTimeMillis();
    }
}
