package com.cput.mediqueuesystem.domain;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/*
 * QueueEntry.java
 * Represents a single patient's entry in a clinic queue.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

/*
 * Indexes:
 *  - queue_id  : the queue board loads every entry for one queue, in order.
 *  - patient_id: the patient portal reads a single patient's queue entry.
 *  - status    : the dashboard filters entries by state (Waiting, In
 *               Consultation, Ready for Doctor, ...).
 */
@Entity
@Table(
    name = "queue_entry",
    indexes = {
        @Index(name = "idx_queue_entry_queue", columnList = "queue_id"),
        @Index(name = "idx_queue_entry_patient", columnList = "patient_id"),
        @Index(name = "idx_queue_entry_status", columnList = "status")
    }
)
public class QueueEntry {

    // Primary Key
    @Id
    @Column(name = "queue_entry_id")
    private String queueEntryId;

    // The queue this entry belongs to
    @ManyToOne
    @JoinColumn(name = "queue_id", nullable = false)
    private Queue queue;

    // The patient in the queue
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // The doctor assigned to the patient (optional until assigned)
    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Staff doctor;

    // The related visit, if available
    @ManyToOne
    @JoinColumn(name = "visit_id")
    private Visit visit;

    // Number assigned to the patient in the queue. It is issued by the server
    // when the entry joins a numbered status such as Waiting, which happens at
    // booking time even before a doctor is assigned.
    @Column(name = "queue_number")
    private Integer queueNumber;

    // Priority level for the queue entry
    @Column(name = "priority_level")
    private String priorityLevel;

    // Status of the queue entry
    @Column(name = "status")
    private String status;

    // Time the patient checked in to the queue
    @Column(name = "check_in_time")
    private LocalTime checkInTime;

    // Default constructor required by JPA
    protected QueueEntry() {
    }

    // Constructor used by Builder
    private QueueEntry(Builder builder) {
        this.queueEntryId = builder.queueEntryId;
        this.queue = builder.queue;
        this.patient = builder.patient;
        this.doctor = builder.doctor;
        this.visit = builder.visit;
        this.queueNumber = builder.queueNumber;
        this.priorityLevel = builder.priorityLevel;
        this.status = builder.status;
        this.checkInTime = builder.checkInTime;
    }

    // Getters

    public String getQueueEntryId() {
        return queueEntryId;
    }

    public Queue getQueue() {
        return queue;
    }

    public Patient getPatient() {
        return patient;
    }

    public Staff getDoctor() {
        return doctor;
    }

    public void setDoctor(Staff doctor) {
        this.doctor = doctor;
    }

    public Visit getVisit() {
        return visit;
    }

    public Integer getQueueNumber() {
        return queueNumber;
    }

    public String getPriorityLevel() {
        return priorityLevel;
    }

    public String getStatus() {
        return status;
    }

    public LocalTime getCheckInTime() {
        return checkInTime;
    }

    // Setters used by the service layer when applying a validated update

    public void setQueue(Queue queue) {
        this.queue = queue;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public void setVisit(Visit visit) {
        this.visit = visit;
    }

    public void setQueueNumber(Integer queueNumber) {
        this.queueNumber = queueNumber;
    }

    public void setPriorityLevel(String priorityLevel) {
        this.priorityLevel = priorityLevel;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCheckInTime(LocalTime checkInTime) {
        this.checkInTime = checkInTime;
    }

    // Returns the QueueEntry object as a String
    @Override
    public String toString() {
        return "QueueEntry{" +
                "queueEntryId='" + queueEntryId + '\'' +
                ", queue=" + (queue != null ? queue.getQueueId() : null) +
                ", patient=" + (patient != null ? patient.getUserId() : null) +
                ", doctor=" + (doctor != null ? doctor.getUserId() : null) +
                ", visit=" + (visit != null ? visit.getVisitId() : null) +
                ", queueNumber=" + queueNumber +
                ", priorityLevel='" + priorityLevel + '\'' +
                ", status='" + status + '\'' +
                ", checkInTime=" + checkInTime +
                '}';
    }

    /*
     * Builder class for QueueEntry.
     */
    public static class Builder {

        private String queueEntryId;
        private Queue queue;
        private Patient patient;
        private Staff doctor;
        private Visit visit;
        private Integer queueNumber;
        private String priorityLevel;
        private String status;
        private LocalTime checkInTime;

        public Builder setQueueEntryId(String queueEntryId) {
            this.queueEntryId = queueEntryId;
            return this;
        }

        public Builder setQueue(Queue queue) {
            this.queue = queue;
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

        public Builder setVisit(Visit visit) {
            this.visit = visit;
            return this;
        }

        public Builder setQueueNumber(Integer queueNumber) {
            this.queueNumber = queueNumber;
            return this;
        }

        public Builder setPriorityLevel(String priorityLevel) {
            this.priorityLevel = priorityLevel;
            return this;
        }

        public Builder setStatus(String status) {
            this.status = status;
            return this;
        }

        public Builder setCheckInTime(LocalTime checkInTime) {
            this.checkInTime = checkInTime;
            return this;
        }

        public Builder copy(QueueEntry queueEntry) {
            this.queueEntryId = queueEntry.queueEntryId;
            this.queue = queueEntry.queue;
            this.patient = queueEntry.patient;
            this.doctor = queueEntry.doctor;
            this.visit = queueEntry.visit;
            this.queueNumber = queueEntry.queueNumber;
            this.priorityLevel = queueEntry.priorityLevel;
            this.status = queueEntry.status;
            this.checkInTime = queueEntry.checkInTime;
            return this;
        }

        public QueueEntry build() {
            return new QueueEntry(this);
        }
    }
}
