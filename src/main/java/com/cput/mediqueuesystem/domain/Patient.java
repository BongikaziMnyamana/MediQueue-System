package com.cput.mediqueuesystem.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

/*
 * Patient.java
 * Patient entity that extends the User entity.
 * Stores patient-specific information.
 *
 * Author: Charmaine Dlamini
 * Date: 28 July 2026
 */

@Entity
@Table(name = "patient")
@PrimaryKeyJoinColumn(name = "user_id")
@JsonDeserialize(builder = Patient.Builder.class)
public class Patient extends User {

    // South African ID number
    @Column(name = "id_number", nullable = false, unique = true)
    private String idNumber;

    // Patient's date of birth
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    // Patient gender
    @Column(name = "gender", nullable = false)
    private String gender;

    // Residential address
    @Column(name = "address", nullable = false)
    private String address;

    // Medical aid number (optional)
    @Column(name = "medical_aid_number")
    private String medicalAidNumber;

    // Allergies recorded for the patient
    @Column(name = "allergies")
    private String allergies;

    // Default constructor required by JPA
    protected Patient() {
    }

    // Constructor used by Builder
    private Patient(Builder builder) {
        super(builder);
        this.idNumber = builder.idNumber;
        this.dateOfBirth = builder.dateOfBirth;
        this.gender = builder.gender;
        this.address = builder.address;
        this.medicalAidNumber = builder.medicalAidNumber;
        this.allergies = builder.allergies;
    }

    // Getters

    public String getIdNumber() {
        return idNumber;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public String getAddress() {
        return address;
    }

    public String getMedicalAidNumber() {
        return medicalAidNumber;
    }

    public String getAllergies() {
        return allergies;
    }

    // Setters used by the service layer when applying a validated update

    public void setIdNumber(String idNumber) {
        this.idNumber = idNumber;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setMedicalAidNumber(String medicalAidNumber) {
        this.medicalAidNumber = medicalAidNumber;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    @Override
    public String toString() {
        return "Patient{" +
                "userId='" + getUserId() + '\'' +
                ", firstName='" + getFirstName() + '\'' +
                ", lastName='" + getLastName() + '\'' +
                ", idNumber='" + idNumber + '\'' +
                ", dateOfBirth=" + dateOfBirth +
                ", gender='" + gender + '\'' +
                ", address='" + address + '\'' +
                ", medicalAidNumber='" + medicalAidNumber + '\'' +
                ", allergies='" + allergies + '\'' +
                '}';
    }

    /*
     * Builder class for Patient.
     *
     * NOTE: every inherited User.Builder setter is overridden here purely to
     * change its return type from User.Builder to Patient.Builder. Without
     * this, chaining a User field setter (setUserId, setFirstName, etc.)
     * together with a Patient-only setter (setIdNumber, etc.) or .build()
     * fails to compile, because Java resolves the chain using the
     * *declared* return type of whichever setter was last called - and
     * User.Builder's setters are declared to return User.Builder.
     */
    @JsonPOJOBuilder(withPrefix = "set")
    public static class Builder extends User.Builder {

        private String idNumber;
        private LocalDate dateOfBirth;
        private String gender;
        private String address;
        private String medicalAidNumber;
        private String allergies;

        // ---- Overridden User.Builder setters (return Patient.Builder) ----

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

        // ---- Patient-specific setters ----

        public Builder setIdNumber(String idNumber) {
            this.idNumber = idNumber;
            return this;
        }

        public Builder setDateOfBirth(LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
            return this;
        }

        public Builder setGender(String gender) {
            this.gender = gender;
            return this;
        }

        public Builder setAddress(String address) {
            this.address = address;
            return this;
        }

        public Builder setMedicalAidNumber(String medicalAidNumber) {
            this.medicalAidNumber = medicalAidNumber;
            return this;
        }

        public Builder setAllergies(String allergies) {
            this.allergies = allergies;
            return this;
        }

        public Builder copy(Patient patient) {
            super.copy(patient);
            this.idNumber = patient.idNumber;
            this.dateOfBirth = patient.dateOfBirth;
            this.gender = patient.gender;
            this.address = patient.address;
            this.medicalAidNumber = patient.medicalAidNumber;
            this.allergies = patient.allergies;
            return this;
        }

        public Patient build() {
            return new Patient(this);
        }
    }
}