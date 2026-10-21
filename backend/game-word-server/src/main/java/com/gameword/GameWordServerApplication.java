package com.gameword;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.gameword.model.Word;
import com.gameword.repository.WordRepository;

@SpringBootApplication
public class GameWordServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameWordServerApplication.class, args);
    }

    @Bean
    CommandLineRunner init(WordRepository wordRepository) {
        return args -> {
            if (wordRepository.count() == 0) {
                String[][] words = {
                    {"MAYTINH", "MAY", "TINH", "1"},
                    {"DIENTHOAI", "DIEN", "THOAI", "1"},
                    {"LANHDAU", "LANH", "DAU", "2"},
                    {"XANHLA", "XANH", "LA", "2"},
                    {"BAOBI", "BAO", "BI", "3"},
                    {"THUVIEN", "THU", "VIEN", "3"},
                    {"BANTAY", "BAN", "TAY", "1"},
                    {"MACHA", "MA", "CHA", "1"},
                    {"CAUTUYEN", "CAU", "TUYEN", "2"},
                    {"TUQUYEN", "TU", "QUYEN", "2"},
                    {"XANHDAU", "XANH", "DAU", "3"},
                    {"THUYET", "THU", "YET", "3"},
                    {"QUANGCAO", "QUANG", "CAO", "2"},
                    {"BAOCAO", "BAO", "CAO", "2"},
                    {"CHINHANH", "CHINH", "ANH", "1"},
                    {"PHANLOAI", "PHAN", "LOAI", "3"},
                    {"SUYNGAN", "SUY", "NGAN", "2"},
                    {"MAMNON", "MAM", "NON", "1"},
                    {"CONMEO", "CON", "MEO", "1"},
                    {"CHOMON", "CHO", "MON", "2"}
                };
                for (String[] w : words) {
                    wordRepository.save(Word.builder()
                        .value(w[0])
                        .part1(w[1])
                        .part2(w[2])
                        .level(Integer.parseInt(w[3]))
                        .active(true)
                        .build());
                }
            }
        };
    }
}
