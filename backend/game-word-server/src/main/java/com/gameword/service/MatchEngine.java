package com.gameword.service;

import com.gameword.model.GameType;
import com.gameword.model.RoomMatch;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Consumer;

// Luat cua mot che do choi trong phong. RoomService giu khoa phong khi goi cac ham nay.
// announce: gui tin he thong vao chat phong.
interface MatchEngine {

    GameType type();

    // match da duoc luu (co id), status PLAYING
    void start(RoomMatch match, List<Long> playerIds, Consumer<String> announce);

    // Xu ly su kien hen gio da den han (het gio / het luot)
    void tick(RoomMatch match, LocalDateTime now, Consumer<String> announce);

    // Nguoi choi roi phong giua van
    void forfeit(RoomMatch match, Long userId, Consumer<String> announce);

    // Han su kien hen gio tiep theo; null neu van da ket thuc
    LocalDateTime nextDeadline(RoomMatch match);
}
