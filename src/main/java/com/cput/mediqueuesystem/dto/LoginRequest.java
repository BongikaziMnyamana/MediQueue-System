package com.cput.mediqueuesystem.dto;

/*
 * LoginRequest.java
 * Payload for user login. Users sign in with their email and password;
 * the response carries their role so the frontend can route to the
 * correct dashboard.
 *
 * Author: Charmaine Dlamini
 * Date: 24 September 2026
 */
public class LoginRequest {

    private String email;
    private String password;

    public LoginRequest() {
    }

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}