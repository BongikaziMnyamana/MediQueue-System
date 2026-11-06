package com.cput.mediqueuesystem.domain;

import java.time.LocalDateTime;

import com.cput.mediqueuesystem.util.PasswordUtil;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/*
 * User.java
 * Abstract parent entity for all users in the MediQueue system.
 * Patient and Staff inherit the common user information from this class.
 *
 * Author: Charmaine Dlamini
 * Date: 28 July 2026
 */

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Patient.class, name = "patient"),
    @JsonSubTypes.Type(value = Staff.class, name = "staff")
})
/*
 * email is declared unique above, which already creates the index used by the
 * login lookup. These two cover the admin screens: filtering the staff list by
 * role, and the name search on the staff table.
 */
@Entity
@Table(
    name = "user",
    indexes = {
        @Index(name = "idx_user_role", columnList = "role_id"),
        @Index(name = "idx_user_last_name", columnList = "last_name")
    }
)
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User {

    // Primary Key
    @Id
    @Column(name = "user_id")
    private String userId;

    // User's first name
    @Column(name = "first_name", nullable = false)
    private String firstName;

    // User's last name
    @Column(name = "last_name", nullable = false)
    private String lastName;

    // User's email address
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    // User's password
    @Column(name = "password", nullable = false)
    private String password;

    // User's contact number
    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    // Indicates whether the account is active
    @Column(name = "status", nullable = false)
    private boolean status;

    // Date and time the account was created
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Many users can have one role
    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    // Default constructor required by JPA
    protected User() {
    }

    // Constructor used by subclasses through the Builder
    protected User(Builder builder) {
        this.userId = builder.userId;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.email = builder.email;
        this.password = builder.password;
        this.phoneNumber = builder.phoneNumber;
        this.status = builder.status;
        this.createdAt = builder.createdAt;
        this.role = builder.role;
    }

    // Getters

    public String getUserId() {
        return userId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    // Password is never serialized back to clients; it is only
    // accepted on write, so hashed values never leak in responses.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getPassword() {
        return password;
    }

    // Used by the auth service when migrating a legacy plaintext
    // password to a hashed value after a successful login.
    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public boolean isStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Role getRole() {
        return role;
    }

    // Setters used by the service layer when applying a validated update.
    // Password is only ever written here, never read back to a client.

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    // Hashes the password before persisting/updating if it is still
    // plain text. Inherited by Patient and Staff entities.
    @PrePersist
    @PreUpdate
    protected void hashPasswordIfNeeded() {
        if (password != null && !PasswordUtil.isHashed(password)) {
            this.password = PasswordUtil.hash(password);
        }
    }

    // Returns the User object as a String
    @Override
    public String toString() {
        return "User{" +
                "userId='" + userId + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", status=" + status +
                ", createdAt=" + createdAt +
                ", role=" + role +
                '}';
    }

    /*
     * Builder class used to set User attributes.
     * Patient.Builder and Staff.Builder will extend this builder.
     */
    public static class Builder {

        protected String userId;
        protected String firstName;
        protected String lastName;
        protected String email;
        protected String password;
        protected String phoneNumber;
        protected boolean status;
        protected LocalDateTime createdAt;
        protected Role role;

        public Builder setUserId(String userId) {
            this.userId = userId;
            return this;
        }

        public Builder setFirstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder setLastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder setEmail(String email) {
            this.email = email;
            return this;
        }

        public Builder setPassword(String password) {
            this.password = password;
            return this;
        }

        public Builder setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        public Builder setStatus(boolean status) {
            this.status = status;
            return this;
        }

        public Builder setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder setRole(Role role) {
            this.role = role;
            return this;
        }

        // Creates a copy of an existing User object
        public Builder copy(User user) {
            this.userId = user.userId;
            this.firstName = user.firstName;
            this.lastName = user.lastName;
            this.email = user.email;
            this.password = user.password;
            this.phoneNumber = user.phoneNumber;
            this.status = user.status;
            this.createdAt = user.createdAt;
            this.role = user.role;
            return this;
        }
    }
}