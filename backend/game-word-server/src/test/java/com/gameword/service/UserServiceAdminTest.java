package com.gameword.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserServiceAdminTest {

    private static UserService serviceWithAdmins(String value) {
        UserService service = new UserService(null, null, null, null, null, "https://game.example");
        service.setAdminUsernames(value);
        return service;
    }

    @Test
    void adminListIsCaseInsensitiveAndTrimmed() {
        UserService service = serviceWithAdmins(" Admin , ngocdu ,,");
        assertTrue(service.isConfiguredAdmin("admin"));
        assertTrue(service.isConfiguredAdmin("NGOCDU"));
        assertFalse(service.isConfiguredAdmin("someone"));
        assertFalse(service.isConfiguredAdmin(null));
    }

    @Test
    void emptyConfigurationGrantsNobody() {
        assertFalse(serviceWithAdmins("").isConfiguredAdmin("admin"));
        assertFalse(serviceWithAdmins(null).isConfiguredAdmin("admin"));
    }
}
