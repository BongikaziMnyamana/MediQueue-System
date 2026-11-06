package com.cput.mediqueuesystem.factory;


import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;

import com.cput.mediqueuesystem.domain.Clinic;
import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Queue;
import com.cput.mediqueuesystem.domain.Staff;

class QueueEntryFactoryTest {

    private Queue queue() {
        Clinic clinic = new Clinic.Builder().setClinicId("C-001").build();
        return new Queue.Builder().setQueueId("Q-001").setClinic(clinic).setDate(LocalDate.now()).build();
    }

    private Patient patient() {
        return new Patient.Builder().setCreatedAt(LocalDateTime.now()).setUserId("P-001").build();
    }

    private Staff doctor() {
        return new Staff.Builder().setUserId("U-001").build();
    }

    @Test
    void createQueueEntry_withValidData_returnsQueueEntry() {
        var entry = QueueEntryFactory.createQueueEntry(
                "QE-001", queue(), patient(), doctor(), null, 1, "Normal", "Waiting", LocalTime.of(9, 0));

        assertNotNull(entry);
        assertEquals("QE-001", entry.getQueueEntryId());
        assertEquals(1, entry.getQueueNumber());
    }

    @Test
    void createQueueEntry_withNullQueueEntryId_returnsNull() {
        var entry = QueueEntryFactory.createQueueEntry(
                null, queue(), patient(), doctor(), null, 1, "Normal", "Waiting", LocalTime.now());

        assertNull(entry);
    }

    @Test
    void createQueueEntry_withBlankQueueEntryId_returnsNull() {
        var entry = QueueEntryFactory.createQueueEntry(
                "  ", queue(), patient(), doctor(), null, 1, "Normal", "Waiting", LocalTime.now());

        assertNull(entry);
    }

    @Test
    void createQueueEntry_withNullQueue_returnsNull() {
        var entry = QueueEntryFactory.createQueueEntry(
                "QE-002", null, patient(), doctor(), null, 1, "Normal", "Waiting", LocalTime.now());

        assertNull(entry);
    }

    @Test
    void createQueueEntry_withNullPatient_returnsNull() {
        var entry = QueueEntryFactory.createQueueEntry(
                "QE-003", queue(), null, doctor(), null, 1, "Normal", "Waiting", LocalTime.now());

        assertNull(entry);
    }

    @Test
    void createQueueEntry_withNullDoctor_stillReturnsQueueEntry() {
        // a patient gets a queue number when they book, before a doctor is assigned
        var entry = QueueEntryFactory.createQueueEntry(
                "QE-004", queue(), patient(), null, null, 1, "Normal", "Waiting", LocalTime.now());

        assertNotNull(entry);
        assertNull(entry.getDoctor());
    }

    @Test
    void createQueueEntry_withNullVisitAndOptionalFields_stillReturnsQueueEntry() {
        // visit, priorityLevel, status, checkInTime are optional
        var entry = QueueEntryFactory.createQueueEntry(
                "QE-005", queue(), patient(), doctor(), null, 1, null, null, null);

        assertNotNull(entry);
    }
}