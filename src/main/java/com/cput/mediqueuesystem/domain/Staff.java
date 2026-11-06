package com.cput.mediqueuesystem.domain;

import java.time.LocalDateTime;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

/*
 * Staff.java
 * Staff entity that extends the User entity.
 * Stores staff-specific information.
 *
 * Author: Charmaine Dlamini
 * Date: 28 July 2026
 */

/*
 * Indexes:
 *  - department_id : the book-appointment dropdown loads doctors per department.
 *  - position      : filtering the staff list by role.
 */
@Entity
@Table(
    name = "staff",
    indexes = {
        @Index(name = "idx_staff_department", columnList = "department_id"),
        @Index(name = "idx_staff_position", columnList = "position")
    }
)
@PrimaryKeyJoinColumn(name = "user_id")
@JsonDeserialize(builder = Staff.Builder.class)
public class Staff extends User {

    // Department the staff member belongs to
    @ManyToOne
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    // Staff position (Doctor, Nurse, Receptionist, Admin)
    @Column(name = "position", nullable = false)
    private String position;

    // Default constructor required by JPA
    protected Staff() {
    }

    // Constructor used by Builder
    private Staff(Builder builder) {
        super(builder);
        this.department = builder.department;
        this.position = builder.position;
    }

    // Getters

    public Department getDepartment() {
        return department;
    }

    public String getPosition() {
        return position;
    }

    // Setters used by the service layer when applying a validated update

    public void setDepartment(Department department) {
        this.department = department;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    // Returns the Staff object as a String
    @Override
    public String toString() {
        return "Staff{" +
                "userId='" + getUserId() + '\'' +
                ", firstName='" + getFirstName() + '\'' +
                ", lastName='" + getLastName() + '\'' +
                ", department=" + department +
                ", position='" + position + '\'' +
                '}';
    }

    /*
     * Builder class for Staff.
     *
     * NOTE: same fix as Patient.Builder - every inherited User.Builder
     * setter is overridden here purely to change its return type from
     * User.Builder to Staff.Builder, so chaining works with Staff-only
     * setters (setDepartment, setPosition) and .build().
     */
    @JsonPOJOBuilder(withPrefix = "set")
    public static class Builder extends User.Builder {

        private Department department;
        private String position;

        // ---- Overridden User.Builder setters (return Staff.Builder) ----

        @Override
        public Builder setUserId(String userId) {
            super.setUserId(userId);
            return this;
        }

        @Override
        public Builder setFirstName(String firstName) {
            super.setFirstName(firstName);
            return this;
        }

        @Override
        public Builder setLastName(String lastName) {
            super.setLastName(lastName);
            return this;
        }

        @Override
        public Builder setEmail(String email) {
            super.setEmail(email);
            return this;
        }

        @Override
        public Builder setPassword(String password) {
            super.setPassword(password);
            return this;
        }

        @Override
        public Builder setPhoneNumber(String phoneNumber) {
            super.setPhoneNumber(phoneNumber);
            return this;
        }

        @Override
        public Builder setStatus(boolean status) {
            super.setStatus(status);
            return this;
        }

        @Override
        public Builder setCreatedAt(LocalDateTime createdAt) {
            super.setCreatedAt(createdAt);
            return this;
        }

        @Override
        public Builder setRole(Role role) {
            super.setRole(role);
            return this;
        }

        // ---- Staff-specific setters ----

        public Builder setDepartment(Department department) {
            this.department = department;
            return this;
        }

        public Builder setPosition(String position) {
            this.position = position;
            return this;
        }

        public Builder copy(Staff staff) {
            super.copy(staff);
            this.department = staff.department;
            this.position = staff.position;
            return this;
        }

        public Staff build() {
            return new Staff(this);
        }
    }
}