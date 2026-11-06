package com.cput.mediqueuesystem.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cput.mediqueuesystem.domain.QueueEntry;
import com.cput.mediqueuesystem.repository.QueueEntryRepository;

/*
 * QueueNumberingService.java
 * Owns the rule for when a patient is issued a queue number.
 *
 * A booking joins the clinic queue immediately, so the patient is given a
 * number at booking time. Doctor assignment only links the waiting entry to a
 * doctor; it does not create or change the number. This is the only place that
 * decides the next number, so the receptionist screen, the booking flow and the
 * doctor assignment cannot disagree with each other.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Service
public class QueueNumberingService {

    // Statuses that mean the patient is genuinely in line, so a number is due.
    // Both queue-entry wording ("waiting") and appointment wording ("confirmed",
    // "checked in") are accepted so the two flows cannot disagree.
    private static final List<String> APPROVED_STATUSES = Arrays.asList(
            "waiting", "ready for doctor", "confirmed", "checked in", "in consultation", "completed");

    private final QueueEntryRepository queueEntryRepository;

    @Autowired
    public QueueNumberingService(QueueEntryRepository queueEntryRepository) {
        this.queueEntryRepository = queueEntryRepository;
    }

    /*
     * Issues the number if the entry is in line and does not have one yet.
     * Safe to call repeatedly: an already numbered entry is returned untouched.
     */
    @Transactional
    public QueueEntry numberIfApproved(QueueEntry entry) {
        if (entry == null || entry.getQueueNumber() != null || entry.getQueue() == null) {
            return entry;
        }
        if (!isApproved(entry)) {
            return entry;
        }
        entry.setQueueNumber(nextNumberFor(entry.getQueue().getQueueId()));
        return queueEntryRepository.save(entry);
    }

    /*
     * A patient is eligible once they are waiting in the clinic queue, or once
     * their status has been moved to another in-line state. A doctor is not
     * required: the patient is already waiting for the nurse.
     */
    public boolean isApproved(QueueEntry entry) {
        if (entry == null) {
            return false;
        }
        if (entry.getDoctor() != null) {
            return true;
        }
        return entry.getStatus() != null
                && APPROVED_STATUSES.contains(entry.getStatus().trim().toLowerCase());
    }

    // Numbers run from 1 upwards within a single queue, and the highest number
    // already taken is the starting point. Requests that are not yet in line
    // hold no number, so they are skipped instead of consuming one.
    private Integer nextNumberFor(String queueId) {
        return queueEntryRepository.findByQueueQueueId(queueId).stream()
                .map(QueueEntry::getQueueNumber)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;
    }
}
