package com.cput.mediqueuesystem.domain;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/*
 * Visit.java
 * Represents a clinic visit for a patient.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

/*
 * Indexes:
 *  - patient_id      : the medical-record page loads one patient's history.
 *  - appointment_id  : resolving the visit behind a booked appointment.
 *  - visit_date      : "visits today" on the dashboards.
 */
@Entity
@Table(
    name = "visit",
    indexes = {
        @Index(name = "idx_visit_patient", columnList = "patient_id"),
        @Index(name = "idx_visit_appointment", columnList = "appointment_id"),
        @Index(name = "idx_visit_date", columnList = "visit_date")
    }
)
public class Visit {

    // Primary Key
    @Id
    @Column(name = "visit_id")
    private String visitId;

    // The patient who attended the visit
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // The booked appointment associated with the visit, if any
    @ManyToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    // Date the visit occurred
    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    // Time the patient checked in
    @Column(name = "check_in_time")
    private LocalTime checkInTime;

    // Time the patient checked out
    @Column(name = "check_out_time")
    private LocalTime checkOutTime;

    // Status of the visit, e.g. "pending", "completed"
    @Column(name = "status")
    private String status;

    // Default constructor required by JPA
    protected Visit() {
    }

    // Constructor used by Builder
    private Visit(Builder builder) {
        this.visitId = builder.visitId;
        this.patient = builder.patient;
        this.appointment = builder.appointment;
        this.visitDate = builder.visitDate;
        this.checkInTime = builder.checkInTime;
        this.checkOutTime = builder.checkOutTime;
        this.status = builder.status;
    }

    // Getters

    public String getVisitId() {
        return visitId;
    }

    public Patient getPatient() {
        return patient;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public LocalTime getCheckInTime() {
        return checkInTime;
    }

    public LocalTime getCheckOutTime() {
        return checkOutTime;
    }

    public String getStatus() {
        return status;
    }

    // Returns the Visit object as a String
    @Override
    public String toString() {
        return "Visit{" +
                "visitId='" + visitId + '\'' +
                ", patient=" + (patient != null ? patient.getUserId() : null) +
                ", appointment=" + (appointment != null ? appointment.getAppointmentId() : null) +
                ", visitDate=" + visitDate +
                ", checkInTime=" + checkInTime +
                ", checkOutTime=" + checkOutTime +
                ", status='" + status + '\'' +
                '}';
    }

    /*
     * Builder class for Visit.
     */
    public static class Builder {

        private String visitId;
        private Patient patient;
        private Appointment appointment;
        private LocalDate visitDate;
        private LocalTime checkInTime;
        private LocalTime checkOutTime;
        private String status;

        public Builder setVisitId(String visitId) {
            this.visitId = visitId;
            return this;
        }

        public Builder setPatient(Patient patient) {
            this.patient = patient;
            return this;
        }

        public Builder setAppointment(Appointment appointment) {
            this.appointment = appointment;
            return this;
        }

        public Builder setVisitDate(LocalDate visitDate) {
            this.visitDate = visitDate;
            return this;
        }

        public Builder setCheckInTime(LocalTime checkInTime) {
            this.checkInTime = checkInTime;
            return this;
        }

        public Builder setCheckOutTime(LocalTime checkOutTime) {
            this.checkOutTime = checkOutTime;
            return this;
        }

        public Builder setStatus(String status) {
            this.status = status;
            return this;
        }

        public Builder copy(Visit visit) {
            this.visitId = visit.visitId;
            this.patient = visit.patient;
            this.appointment = visit.appointment;
            this.visitDate = visit.visitDate;
            this.checkInTime = visit.checkInTime;
            this.checkOutTime = visit.checkOutTime;
            this.status = visit.status;
            return this;
        }

        public Visit build() {
            return new Visit(this);
        }
    }
}
