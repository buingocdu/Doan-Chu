package com.gameword;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Du lieu tu (bang words) duoc nap boi Liquibase: db/changelog/v1.2.0/words-vi-2000.csv
@SpringBootApplication
public class GameWordServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameWordServerApplication.class, args);
    }
}
