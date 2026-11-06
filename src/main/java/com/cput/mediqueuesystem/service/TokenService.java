package com.cput.mediqueuesystem.service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/*
 * TokenService.java
 * In-memory bearer token store mapping a token to the userId it was
 * issued for. Tokens are lost on restart (fine for this system);
 * the login flow simply issues a fresh token each time.
 *
 * Author: Charmaine Dlamini
 * Date: 24 September 2026
 */
@Service
public class TokenService {

    private final Map<String, String> tokens = new ConcurrentHashMap<>();

    public String createToken(String userId) {
        String token = UUID.randomUUID().toString() + "." + userId;
        tokens.put(token, userId);
        return token;
    }

    public String getUserId(String token) {
        if (token == null) {
            return null;
        }
        return tokens.get(token);
    }

    public boolean isValid(String token) {
        return token != null && tokens.containsKey(token);
    }

    public void remove(String token) {
        if (token != null) {
            tokens.remove(token);
        }
    }
}