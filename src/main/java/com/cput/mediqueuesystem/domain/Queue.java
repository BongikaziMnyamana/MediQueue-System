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
 * Queue.java
 * Represents a queue for a clinic on a given date.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

// The dashboards list the current day's queues, so the date is indexed.
@Entity
@Table(
    name = "queue",
    indexes = {
        @Index(name = "idx_queue_date", columnList = "date")
    }
)
public class Queue {

    // Primary Key
    @Id
    @Column(name = "queue_id")
    private String queueId;

    // The clinic this queue belongs to
    @ManyToOne
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    // Date the queue is active
    @Column(name = "date", nullable = false)
    private LocalDate date;

    // Maximum number of patients that can be in the queue
    @Column(name = "max_capacity", nullable = false)
    private int maxCapacity;

    // Default constructor required by JPA
    protected Queue() {
    }

    // Constructor used by Builder
    private Queue(Builder builder) {
        this.queueId = builder.queueId;
        this.clinic = builder.clinic;
        this.date = builder.date;
        this.maxCapacity = builder.maxCapacity;
    }

    // Getters

    public String getQueueId() {
        return queueId;
    }

    public Clinic getClinic() {
        return clinic;
    }

    public LocalDate getDate() {
        return date;
    }

    public int getMaxCapacity() {
        return maxCapacity;
    }

    // Returns the Queue object as a String
    @Override
    public String toString() {
        return "Queue{" +
                "queueId='" + queueId + '\'' +
                ", clinic=" + (clinic != null ? clinic.getClinicId() : null) +
                ", date=" + date +
                ", maxCapacity=" + maxCapacity +
                '}';
    }

    /*
     * Builder class for Queue.
     */
    public static class Builder {

        private String queueId;
        private Clinic clinic;
        private LocalDate date;
        private int maxCapacity;

        public Builder setQueueId(String queueId) {
            this.queueId = queueId;
            return this;
        }

        public Builder setClinic(Clinic clinic) {
            this.clinic = clinic;
            return this;
        }

        public Builder setDate(LocalDate date) {
            this.date = date;
            return this;
        }

        public Builder setMaxCapacity(int maxCapacity) {
            this.maxCapacity = maxCapacity;
            return this;
        }

        public Builder copy(Queue queue) {
            this.queueId = queue.queueId;
            this.clinic = queue.clinic;
            this.date = queue.date;
            this.maxCapacity = queue.maxCapacity;
            return this;
        }

        public Queue build() {
            return new Queue(this);
        }
    }
}
