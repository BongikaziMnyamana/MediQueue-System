package com.cput.mediqueuesystem.domain;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/*
 * Department.java
 * Department entity that stores the different departments
 * within a clinic.
 *
 * Author: Charmaine Dlamini
 * Date: 30 July 2026
 */

@Entity
@Table(name = "department")
public class Department {

    // Primary Key
    @Id
    @JsonProperty("departmentId")
    @Column(name = "department_id")
    private String departmentId;

    // Department name
    @Column(name = "department_name", nullable = false, unique = true)
    private String departmentName;

    // Department description
    @Column(name = "description")
    private String description;

    // One department can have many staff members
    @JsonIgnore
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<Staff> staffMembers = new ArrayList<>();

    // Default constructor required by JPA
    protected Department() {
    }

    // Constructor used by Builder
    private Department(Builder builder) {
        this.departmentId = builder.departmentId;
        this.departmentName = builder.departmentName;
        this.description = builder.description;
        this.staffMembers = builder.staffMembers;
    }

    // Getters


    public String getDepartmentId() {
        return departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public String getDescription() {
        return description;
    }

    public List<Staff> getStaffMembers() {
        return staffMembers;
    }

    // Returns the Department object as a String
    @Override
    public String toString() {
        return "Department{" +
                "departmentId='" + departmentId + '\'' +
                ", departmentName='" + departmentName + '\'' +
                ", description='" + description + '\'' +
                '}';
    }

    /*
     * Builder class for Department.
     */
    public static class Builder {

        private String departmentId;
        private String departmentName;
        private String description;
        private List<Staff> staffMembers = new ArrayList<>();

        public Builder setDepartmentId(String departmentId) {
            this.departmentId = departmentId;
            return this;
        }

        public Builder setDepartmentName(String departmentName) {
            this.departmentName = departmentName;
            return this;
        }

        public Builder setDescription(String description) {
            this.description = description;
            return this;
        }

        public Builder setStaffMembers(List<Staff> staffMembers) {
            this.staffMembers = staffMembers;
            return this;
        }

        public Builder copy(Department department) {
            this.departmentId = department.departmentId;
            this.departmentName = department.departmentName;
            this.description = department.description;
            this.staffMembers = department.staffMembers;
            return this;
        }

        public Department build() {
            return new Department(this);
        }
    }
}