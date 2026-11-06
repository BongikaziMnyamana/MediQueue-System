package com.cput.mediqueuesystem.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cput.mediqueuesystem.domain.Staff;
import com.cput.mediqueuesystem.repository.StaffRepository;
import com.cput.mediqueuesystem.util.PasswordUtil;

/*
StaffService.java
StaffService
Author: Charmaine Dlamini
Date: 05 August 2026
 */

@Service
public class StaffService implements IStaffService {

    private static final Logger log = LoggerFactory.getLogger(StaffService.class);

    private final StaffRepository repository;

    @Autowired
    StaffService(StaffRepository repository) {
        this.repository = repository;
    }

    // Saves a new staff member to the database
    @Override
    public Staff create(Staff staff) {
        if (staff == null) {
            return null;
        }
        // Passwords are write-only, so a staff record created by an admin can
        // arrive without one. Give it an unusable random credential instead of
        // failing the insert; the account signs in only after a reset.
        if (isBlank(staff.getPassword())) {
            log.warn("No password supplied for staff {} - generated a random one; a password reset is required before first login",
                    staff.getUserId());
            staff.setPassword(PasswordUtil.generateRandomPassword());
        }
        if (isBlank(staff.getUserId()) || staff.getRole() == null || staff.getDepartment() == null
                || isBlank(staff.getPosition())) {
            return null;
        }
        if (staff.getCreatedAt() == null) {
            staff.setCreatedAt(LocalDateTime.now());
        }
        // Never keep a plaintext credential, whether it was supplied or generated.
        if (!PasswordUtil.isHashed(staff.getPassword())) {
            staff.setPassword(PasswordUtil.hash(staff.getPassword()));
        }
        return this.repository.save(staff);
    }

    // Finds a staff member by their staff ID
    @Override
    public Staff read(String staffId) {
        return this.repository.findById(staffId).orElse(null);
    }

    // Updates an existing staff member in the database
    @Override
    public Staff update(Staff staff) {
        if (staff == null || isBlank(staff.getUserId())) {
            return null;
        }
        Staff existing = this.repository.findById(staff.getUserId()).orElse(null);
        if (existing == null) {
            return null;
        }
        // The browser only sends the fields the form collected, so merge the
        // request over the stored record instead of overwriting columns that
        // were left out (most of them are NOT NULL in MySQL).
        if (isBlank(staff.getPassword())) {
            staff.setPassword(existing.getPassword());
        } else if (!PasswordUtil.isHashed(staff.getPassword())) {
            staff.setPassword(PasswordUtil.hash(staff.getPassword()));
        }
        if (staff.getRole() == null) {
            staff.setRole(existing.getRole());
        }
        if (staff.getDepartment() == null) {
            staff.setDepartment(existing.getDepartment());
        }
        if (isBlank(staff.getFirstName())) {
            staff.setFirstName(existing.getFirstName());
        }
        if (isBlank(staff.getLastName())) {
            staff.setLastName(existing.getLastName());
        }
        if (isBlank(staff.getEmail())) {
            staff.setEmail(existing.getEmail());
        }
        if (isBlank(staff.getPhoneNumber())) {
            staff.setPhoneNumber(existing.getPhoneNumber());
        }
        if (isBlank(staff.getPosition())) {
            staff.setPosition(existing.getPosition());
        }
        if (staff.getCreatedAt() == null) {
            staff.setCreatedAt(existing.getCreatedAt());
        }
        return this.repository.save(staff);
    }

    // Deletes a staff member by their staff ID
    @Override
    public boolean delete(String staffId) {
        this.repository.deleteById(staffId);
        return true;
    }

    // Returns a list of all staff members
    @Override
    public List<Staff> getAll() {
        return this.repository.findAll();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
