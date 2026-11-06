package com.cput.mediqueuesystem.domain;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/*
 * Prescription.java
 * Represents a medication prescribed to a patient as part of a
 * medical record entry.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

/*
 * Indexes:
 *  - record_id : the doctor loads a record together with its prescriptions.
 *  - status    : the pharmacist dashboard filters by dispensing state.
 */
@Entity
@Table(
    name = "prescription",
    indexes = {
        @Index(name = "idx_prescription_record", columnList = "record_id"),
        @Index(name = "idx_prescription_status", columnList = "status")
    }
)
public class Prescription {

    // Primary Key
    @Id
    @Column(name = "prescription_id")
    private String prescriptionId;

    // The medical record this prescription belongs to
    @ManyToOne
    @JoinColumn(name = "record_id", nullable = false)
    private MedicalRecord medicalRecord;

    // Name of the medication prescribed
    @Column(name = "medication_name", nullable = false)
    private String medicationName;

    // Dosage instructions, e.g. "500mg"
    @Column(name = "dosage")
    private String dosage;

    // Instructions for taking the medication
    @Column(name = "instructions")
    private String instructions;

    // Date the prescription was issued
    @Column(name = "prescription_date", nullable = false)
    private LocalDate prescriptionDate;

    // Dispensing status, e.g. "Pending", "Dispensed", "Cancelled"
    @Column(name = "status", nullable = false)
    private String status;

    // Default constructor required by JPA
    protected Prescription() {
    }

    // Constructor used by Builder
    private Prescription(Builder builder) {
        this.prescriptionId = builder.prescriptionId;
        this.medicalRecord = builder.medicalRecord;
        this.medicationName = builder.medicationName;
        this.dosage = builder.dosage;
        this.instructions = builder.instructions;
        this.prescriptionDate = builder.prescriptionDate;
        this.status = builder.status;
    }

    // Getters

    public String getPrescriptionId() {
        return prescriptionId;
    }

    public MedicalRecord getMedicalRecord() {
        return medicalRecord;
    }

    public String getMedicationName() {
        return medicationName;
    }

    public String getDosage() {
        return dosage;
    }

    public String getInstructions() {
        return instructions;
    }

    public LocalDate getPrescriptionDate() {
        return prescriptionDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // Returns the Prescription object as a String
    @Override
    public String toString() {
        return "Prescription{" +
                "prescriptionId='" + prescriptionId + '\'' +
                ", medicalRecord=" + (medicalRecord != null ? medicalRecord.getRecordId() : null) +
                ", medicationName='" + medicationName + '\'' +
                ", dosage='" + dosage + '\'' +
                ", instructions='" + instructions + '\'' +
                ", prescriptionDate=" + prescriptionDate +
                ", status='" + status + '\'' +
                '}';
    }

    /*
     * Builder class for Prescription.
     */
    public static class Builder {

        private String prescriptionId;
        private MedicalRecord medicalRecord;
        private String medicationName;
        private String dosage;
        private String instructions;
        private LocalDate prescriptionDate;
        private String status;

        public Builder setPrescriptionId(String prescriptionId) {
            this.prescriptionId = prescriptionId;
            return this;
        }

        public Builder setMedicalRecord(MedicalRecord medicalRecord) {
            this.medicalRecord = medicalRecord;
            return this;
        }

        public Builder setMedicationName(String medicationName) {
            this.medicationName = medicationName;
            return this;
        }

        public Builder setDosage(String dosage) {
            this.dosage = dosage;
            return this;
        }

        public Builder setInstructions(String instructions) {
            this.instructions = instructions;
            return this;
        }

        public Builder setPrescriptionDate(LocalDate prescriptionDate) {
            this.prescriptionDate = prescriptionDate;
            return this;
        }

        public Builder setStatus(String status) {
            this.status = status;
            return this;
        }

        public Builder copy(Prescription prescription) {
            this.prescriptionId = prescription.prescriptionId;
            this.medicalRecord = prescription.medicalRecord;
            this.medicationName = prescription.medicationName;
            this.dosage = prescription.dosage;
            this.instructions = prescription.instructions;
            this.prescriptionDate = prescription.prescriptionDate;
            this.status = prescription.status;
            return this;
        }

        public Prescription build() {
            return new Prescription(this);
        }
    }
}