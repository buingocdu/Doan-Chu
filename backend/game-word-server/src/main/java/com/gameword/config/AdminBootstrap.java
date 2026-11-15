package com.gameword.config;

import com.gameword.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

// Luc khoi dong: tai khoan co trong app.admin-usernames (ADMIN_USERNAMES) duoc nang len ADMIN
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserService userService;

    public AdminBootstrap(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void run(ApplicationArguments args) {
        int promoted = userService.promoteConfiguredAdmins();
        if (promoted > 0) {
            log.info("Da cap quyen ADMIN cho {} tai khoan theo cau hinh", promoted);
        }
    }
}
