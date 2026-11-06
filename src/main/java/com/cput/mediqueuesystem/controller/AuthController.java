package com.cput.mediqueuesystem.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cput.mediqueuesystem.dto.AuthResponse;
import com.cput.mediqueuesystem.dto.LoginRequest;
import com.cput.mediqueuesystem.dto.RegisterRequest;
import com.cput.mediqueuesystem.service.AuthService;
import com.cput.mediqueuesystem.service.AuthService.AuthException;

/*
 * AuthController.java
 * Authentication endpoints: patient self-registration, login for any
 * user, logout, and session lookup. Login/register succeed only when
 * the backend actually validated the credentials - no fake success.
 *
 * Author: Charmaine Dlamini
 * Date: 24 September 2026
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (AuthException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (AuthException e) {
            return error(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null) {
            return error(HttpStatus.UNAUTHORIZED, "Not logged in.");
        }
        String token = authorization.startsWith("Bearer ") ? authorization.substring(7) : authorization;
        authService.logout(token);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Logged out.");
        return new ResponseEntity<>(body, HttpStatus.OK);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null) {
            return error(HttpStatus.UNAUTHORIZED, "Not logged in.");
        }
        String token = authorization.startsWith("Bearer ") ? authorization.substring(7) : authorization;
        try {
            AuthResponse response = authService.getSession(token);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (AuthException e) {
            return error(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        return new ResponseEntity<>(body, status);
    }
}