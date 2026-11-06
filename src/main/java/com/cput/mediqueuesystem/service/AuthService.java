package com.cput.mediqueuesystem.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Role;
import com.cput.mediqueuesystem.domain.Staff;
import com.cput.mediqueuesystem.domain.User;
import com.cput.mediqueuesystem.dto.AuthResponse;
import com.cput.mediqueuesystem.dto.LoginRequest;
import com.cput.mediqueuesystem.dto.RegisterRequest;
import com.cput.mediqueuesystem.factory.PatientFactory;
import com.cput.mediqueuesystem.repository.PatientRepository;
import com.cput.mediqueuesystem.repository.UserRepository;
import com.cput.mediqueuesystem.util.Helper;
import com.cput.mediqueuesystem.util.PasswordUtil;

/*
 * AuthService.java
 * Registration, login and session lookup logic for the MediQueue
 * system. Uses bcrypt-free PBKDF2 hashing (see PasswordUtil) and
 * supports legacy plaintext passwords, migrating them on login.
 *
 * Author: MediQueue
 * Date: 24 September 2026
 */
@Service
public class AuthService {

    public static class AuthException extends RuntimeException {
        public AuthException(String message) {
            super(message);
        }
    }

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final RoleService roleService;
    private final TokenService tokenService;

    @Autowired
    public AuthService(UserRepository userRepository,
                       PatientRepository patientRepository,
                       RoleService roleService,
                       TokenService tokenService) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.roleService = roleService;
        this.tokenService = tokenService;
    }

    // Registers a new patient and returns an authenticated session.
    public AuthResponse register(RegisterRequest request) {
        if (request == null) {
            throw new AuthException("Missing registration details.");
        }

        if (Helper.isNullOrEmpty(request.getFirstName())
                || Helper.isNullOrEmpty(request.getLastName())) {
            throw new AuthException("First name and last name are required.");
        }
        if (!Helper.isValidEmail(request.getEmail())) {
            throw new AuthException("Please provide a valid email address.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new AuthException("Password must be at least 6 characters long.");
        }
        if (!Helper.isValidPhoneNumber(request.getPhoneNumber())) {
            throw new AuthException("Please provide a valid phone number (e.g. 0821234567).");
        }
        if (!Helper.isValidIdNumber(request.getIdNumber())) {
            throw new AuthException("Please provide a valid 13-digit South African ID number.");
        }
        if (request.getDateOfBirth() == null
                || Helper.isNullOrEmpty(request.getGender())
                || Helper.isNullOrEmpty(request.getAddress())) {
            throw new AuthException("Date of birth, gender and address are required.");
        }
        if (Helper.isNullOrEmpty(request.getAllergies())) {
            throw new AuthException("Please enter your allergies, or write None.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AuthException("An account with that email address already exists.");
        }
        if (patientRepository.findByIdNumber(request.getIdNumber()).isPresent()) {
            throw new AuthException("A patient with that ID number is already registered.");
        }

        Role patientRole = roleService.getRoleByName("PATIENT");
        if (patientRole == null) {
            throw new AuthException("The PATIENT role is not configured. Please contact staff.");
        }

        Patient patient = PatientFactory.createPatient(
                nextPatientId(), request.getFirstName(), request.getLastName(),
                request.getEmail(), request.getPassword(), request.getPhoneNumber(),
                true, LocalDateTime.now(), patientRole,
                request.getIdNumber(), request.getDateOfBirth(), request.getGender(),
                request.getAddress(), request.getMedicalAidNumber(), request.getAllergies());

        if (patient == null) {
            throw new AuthException("Registration failed. Please check your details.");
        }

        try {
            patientRepository.save(patient);
        } catch (DataIntegrityViolationException e) {
            throw new AuthException("An account with that email or ID number already exists.");
        }

        String token = tokenService.createToken(patient.getUserId());
        return buildResponse(patient, token);
    }

    // Authenticates a user by email/password and returns a session.
    public AuthResponse login(LoginRequest request) {
        if (request == null || Helper.isNullOrEmpty(request.getEmail())
                || request.getPassword() == null) {
            throw new AuthException("Email and password are required.");
        }

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new AuthException("Invalid email or password."));

        if (!user.isStatus()) {
            throw new AuthException("This account has been disabled. Please contact staff.");
        }

        if (!PasswordUtil.verify(request.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid email or password.");
        }

        // Migrate any legacy plaintext password to a hash on first login.
        if (!PasswordUtil.isHashed(user.getPassword())) {
            user.setPassword(PasswordUtil.hash(request.getPassword()));
            userRepository.save(user);
        }

        String token = tokenService.createToken(user.getUserId());
        return buildResponse(user, token);
    }

    // Resolves the profile for a token, e.g. GET /api/auth/me.
    public AuthResponse getSession(String token) {
        String userId = tokenService.getUserId(token);
        if (userId == null) {
            throw new AuthException("Session is invalid or has expired.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User no longer exists."));
        return buildResponse(user, token);
    }

    public void logout(String token) {
        tokenService.remove(token);
    }

    public AuthResponse buildResponse(User user, String token) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getUserId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole() != null ? user.getRole().getRoleName() : null);
        if (user instanceof Patient) {
            response.setPatientId(user.getUserId());
        }
        if (user instanceof Staff staff) {
            response.setStaffId(user.getUserId());
            response.setPosition(staff.getPosition());
            response.setDepartment(staff.getDepartment() != null
                    ? staff.getDepartment().getDepartmentName() : null);
        }
        return response;
    }

    // Generates the next sequential "P-XXXX" patient id.
    private String nextPatientId() {
        long max = 2300;
        for (Patient patient : patientRepository.findAll()) {
            String id = patient.getUserId();
            if (id == null || !id.startsWith("P-")) {
                continue;
            }
            try {
                max = Math.max(max, Long.parseLong(id.substring(2)));
            } catch (NumberFormatException ignored) {
                // skip non-numeric patient ids
            }
        }
        String candidate;
        do {
            max++;
            candidate = "P-" + String.format("%04d", max);
        } while (userRepository.existsById(candidate));
        return candidate;
    }
}