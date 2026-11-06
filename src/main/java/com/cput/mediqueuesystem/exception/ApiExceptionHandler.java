package com.cput.mediqueuesystem.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.hibernate.TransientObjectException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.orm.jpa.JpaObjectRetrievalFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.persistence.EntityNotFoundException;

/*
 * ApiExceptionHandler.java
 * Turns persistence failures into real HTTP responses with a readable
 * message, so the frontend can show what went wrong instead of a blank
 * body from a 500.
 *
 * Author: Charmaine Dlamini
 * Date: 25 September 2026
 */

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        log.warn("Database rejected the request: {}", rootMessage(e));
        return build(HttpStatus.BAD_REQUEST,
                "The record could not be saved because it conflicts with data already stored. "
                        + rootMessage(e));
    }

    @ExceptionHandler({EntityNotFoundException.class, JpaObjectRetrievalFailureException.class})
    public ResponseEntity<Map<String, Object>> handleMissingReference(RuntimeException e) {
        log.warn("Request referenced a record that does not exist: {}", rootMessage(e));
        return build(HttpStatus.BAD_REQUEST,
                "A record referenced by this request does not exist. Refresh the page and try again.");
    }

    @ExceptionHandler(TransientObjectException.class)
    public ResponseEntity<Map<String, Object>> handleTransientReference(TransientObjectException e) {
        log.warn("Request referenced an unsaved record: {}", rootMessage(e));
        return build(HttpStatus.BAD_REQUEST,
                "A record referenced by this request has not been saved yet. Save it first and try again.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(HttpMessageNotReadableException e) {
        log.warn("Request body could not be read: {}", rootMessage(e));
        return build(HttpStatus.BAD_REQUEST, "The request body could not be read: " + rootMessage(e));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLock(ObjectOptimisticLockingFailureException e) {
        log.warn("Concurrent update rejected: {}", rootMessage(e));
        return build(HttpStatus.CONFLICT,
                "This record was changed by someone else. Reload it and try again.");
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", message);
        return new ResponseEntity<>(body, status);
    }

    private String rootMessage(Throwable e) {
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String message = root.getMessage();
        return message == null || message.isBlank() ? root.getClass().getSimpleName() : message;
    }
}
