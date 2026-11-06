package com.cput.mediqueuesystem.dto;

import java.time.LocalDate;

/*
 * RegisterRequest.java
 * Payload for self-registration of a new patient.
 *
 * Author: Charmaine Dlamini
 * Date: 24 September 2026
 */
public class RegisterRequest {

    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private String idNumber;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String medicalAidNumber;
    private String allergies;

    public RegisterRequest() {
    }

    public RegisterRequest(String firstName, String lastName, String email, String password,
                           String phoneNumber, String idNumber, LocalDate dateOfBirth,
                           String gender, String address, String medicalAidNumber, String allergies) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.phoneNumber = phoneNumber;
        this.idNumber = idNumber;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.address = address;
        this.medicalAidNumber = medicalAidNumber;
        this.allergies = allergies;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getIdNumber() {
        return idNumber;
    }

    public void setIdNumber(String idNumber) {
        this.idNumber = idNumber;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getMedicalAidNumber() {
        return medicalAidNumber;
    }

    public void setMedicalAidNumber(String medicalAidNumber) {
        this.medicalAidNumber = medicalAidNumber;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }
}