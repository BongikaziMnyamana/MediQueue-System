package com.cput.mediqueuesystem.domain;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;

/*
 * Appointment.java
 * Represents a booked, walk-in, or emergency appointment for a
 * patient with a doctor.
 *
 * Note: this links to the existing Patient and Staff entities
 * rather than the ERD's Patient_Profile/User, since those have
 * not been built yet. Reconcile once Patient_Profile exists.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Entity
@Table(name = "appointment")
@JsonDeserialize(builder = Appointment.Builder.class)
public class Appointment {

    // Primary Key
    @Id
    @Column(name = "appointment_id")
    private String appointmentId;

    // The patient this appointment is for
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // The doctor this appointment is with
    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Staff doctor;

    // Date the appointment is scheduled for
    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    // Time the appointment is scheduled for
    @Column(name = "scheduled_time", nullable = false)
    private LocalTime scheduledTime;

    // Type of appointment, e.g. "walk-in", "booked", "emergency"
    @Column(name = "appointment_type")
    private String appointmentType;

    // Status of the appointment, e.g. "pending", "completed", "cancelled"
    @Column(name = "status")
    private String status;

    // Staff member who created this appointment (e.g. receptionist)
    @ManyToOne
    @JoinColumn(name = "created_by")
    private Staff createdBy;

    // Default constructor required by JPA
    protected Appointment() {
    }

    // Constructor used by Builder
    private Appointment(Builder builder) {
        this.appointmentId = builder.appointmentId;
        this.patient = builder.patient;
        this.doctor = builder.doctor;
        this.scheduledDate = builder.scheduledDate;
        this.scheduledTime = builder.scheduledTime;
        this.appointmentType = builder.appointmentType;
        this.status = builder.status;
        this.createdBy = builder.createdBy;
    }

    // Getters

    public String getAppointmentId() {
        return appointmentId;
    }

    public Patient getPatient() {
        return patient;
    }

    public Staff getDoctor() {
        return doctor;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public LocalTime getScheduledTime() {
        return scheduledTime;
    }

    public String getAppointmentType() {
        return appointmentType;
    }

    public String getStatus() {
        return status;
    }

    public Staff getCreatedBy() {
        return createdBy;
    }

    // Returns the Appointment object as a String
    @Override
    public String toString() {
        return "Appointment{" +
                "appointmentId='" + appointmentId + '\'' +
                ", patient=" + (patient != null ? patient.getUserId() : null) +
                ", doctor=" + (doctor != null ? doctor.getUserId() : null) +
                ", scheduledDate=" + scheduledDate +
                ", scheduledTime=" + scheduledTime +
                ", appointmentType='" + appointmentType + '\'' +
                ", status='" + status + '\'' +
                '}';
    }

    /*
     * Builder class for Appointment.
     */
    @JsonPOJOBuilder(withPrefix = "set")
    public static class Builder {

        private String appointmentId;
        private Patient patient;
        private Staff doctor;
        private LocalDate scheduledDate;
        private LocalTime scheduledTime;
        private String appointmentType;
        private String status;
        private Staff createdBy;

        public Builder setAppointmentId(String appointmentId) {
            this.appointmentId = appointmentId;
            return this;
        }

        public Builder setPatient(Patient patient) {
            this.patient = patient;
            return this;
        }

        public Builder setDoctor(Staff doctor) {
            this.doctor = doctor;
            return this;
        }

        public Builder setScheduledDate(LocalDate scheduledDate) {
            this.scheduledDate = scheduledDate;
            return this;
        }

        public Builder setScheduledTime(LocalTime scheduledTime) {
            this.scheduledTime = scheduledTime;
            return this;
        }

        public Builder setAppointmentType(String appointmentType) {
            this.appointmentType = appointmentType;
            return this;
        }

        public Builder setStatus(String status) {
            this.status = status;
            return this;
        }

        public Builder setCreatedBy(Staff createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public Builder copy(Appointment appointment) {
            this.appointmentId = appointment.appointmentId;
            this.patient = appointment.patient;
            this.doctor = appointment.doctor;
            this.scheduledDate = appointment.scheduledDate;
            this.scheduledTime = appointment.scheduledTime;
            this.appointmentType = appointment.appointmentType;
            this.status = appointment.status;
            this.createdBy = appointment.createdBy;
            return this;
        }

        public Appointment build() {
            return new Appointment(this);
        }
    }
}
