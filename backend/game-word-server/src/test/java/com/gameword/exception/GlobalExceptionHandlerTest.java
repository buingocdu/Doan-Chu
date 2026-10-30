package com.gameword.exception;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void businessErrorKeepsMessage() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> res =
            handler.handleRuntimeException(new RuntimeException("Room not found"));
        assertEquals(400, res.getStatusCode().value());
        assertEquals("Room not found", res.getBody().getMessage());
    }

    @Test
    void unexpectedErrorsDoNotLeakDetails() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> npe =
            handler.handleRuntimeException(new IllegalStateException("noi bo: bang users, cot password"));
        assertEquals(500, npe.getStatusCode().value());
        assertEquals(GlobalExceptionHandler.INTERNAL_ERROR, npe.getBody().getMessage());

        ResponseEntity<GlobalExceptionHandler.ErrorResponse> db =
            handler.handleDataAccess(new DataIntegrityViolationException("duplicate key uk_users_email"));
        assertEquals(500, db.getStatusCode().value());
        assertFalse(db.getBody().getMessage().contains("uk_users"));
    }

    @Test
    void malformedRequestGetsGenericMessage() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> res =
            handler.handleBadRequest(new Exception("JSON parse error: Unexpected character"));
        assertEquals(400, res.getStatusCode().value());
        assertEquals(GlobalExceptionHandler.INVALID_REQUEST, res.getBody().getMessage());
    }
}
