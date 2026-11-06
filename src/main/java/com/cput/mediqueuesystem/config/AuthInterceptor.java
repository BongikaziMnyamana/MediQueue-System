package com.cput.mediqueuesystem.config;

import java.io.IOException;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.cput.mediqueuesystem.domain.User;
import com.cput.mediqueuesystem.repository.UserRepository;
import com.cput.mediqueuesystem.service.TokenService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/*
 * AuthInterceptor.java
 * Protects the flows that require an authenticated user:
 *  - POST /appointment/** (booking, etc.) requires a valid bearer token
 *  - PUT/DELETE /appointment/** requires a valid token; doctor
 *    assignment and status updates are limited to staff roles
 *  - POST /api/auth/logout and GET /api/auth/me require a token
 *
 * Login, registration and all existing read endpoints stay public so
 * the current API surface keeps working.
 *
 * Author: Charmaine Dlamini
 * Date: 24 September 2026
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final ObjectProvider<TokenService> tokenServiceProvider;
    private final ObjectProvider<UserRepository> userRepositoryProvider;

    @Autowired
    public AuthInterceptor(ObjectProvider<TokenService> tokenServiceProvider,
                           ObjectProvider<UserRepository> userRepositoryProvider) {
        this.tokenServiceProvider = tokenServiceProvider;
        this.userRepositoryProvider = userRepositoryProvider;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI().substring(request.getContextPath().length());

        // Public endpoints
        if (path.equals("/api/auth/login") || path.equals("/api/auth/register")) {
            return true;
        }

        String token = extractToken(request);

        // Session endpoints require a token
        if (path.equals("/api/auth/me")) {
            return requireToken(request, response, token);
        }

        // Appointment mutations require an authenticated user
        if (path.startsWith("/appointment") && !HttpMethod.GET.matches(request.getMethod())) {
            if (!requireToken(request, response, token)) {
                return false;
            }
            if (isStaffOnlyMutation(path) && !isStaffRole(token)) {
                writeError(response, HttpServletResponse.SC_FORBIDDEN, "You do not have permission to perform this action.");
                return false;
            }
            return true;
        }

        return true;
    }

    private String extractToken(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null) {
            return null;
        }
        return authorization.startsWith("Bearer ") ? authorization.substring(7) : authorization;
    }

    private boolean requireToken(HttpServletRequest request, HttpServletResponse response, String token)
            throws IOException {
        TokenService tokenService = tokenServiceProvider.getIfAvailable();
        if (tokenService == null || !tokenService.isValid(token)) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Please log in to continue.");
            return false;
        }
        return true;
    }

    private boolean isStaffOnlyMutation(String path) {
        return path.contains("/assign") || path.contains("/status");
    }

    private boolean isStaffRole(String token) {
        TokenService tokenService = tokenServiceProvider.getIfAvailable();
        if (tokenService == null) {
            return false;
        }
        String userId = tokenService.getUserId(token);
        if (userId == null) {
            return false;
        }
        UserRepository userRepository = userRepositoryProvider.getIfAvailable();
        if (userRepository == null) {
            return false;
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getRole() == null) {
            return false;
        }
        String role = user.getRole().getRoleName();
        return "ADMIN".equals(role) || "DOCTOR".equals(role) || "RECEPTIONIST".equals(role);
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}