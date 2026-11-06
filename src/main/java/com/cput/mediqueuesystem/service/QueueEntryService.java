package com.cput.mediqueuesystem.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Queue;
import com.cput.mediqueuesystem.domain.QueueEntry;
import com.cput.mediqueuesystem.domain.Staff;
import com.cput.mediqueuesystem.domain.Visit;
import com.cput.mediqueuesystem.factory.QueueEntryFactory;
import com.cput.mediqueuesystem.repository.PatientRepository;
import com.cput.mediqueuesystem.repository.QueueEntryRepository;
import com.cput.mediqueuesystem.repository.QueueRepository;
import com.cput.mediqueuesystem.repository.StaffRepository;
import com.cput.mediqueuesystem.repository.VisitRepository;

/*
 * QueueEntryService.java
 * Implements the business logic for managing queue entries.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Service
public class QueueEntryService implements IQueueEntryService {

    private final QueueEntryRepository queueEntryRepository;
    private final QueueRepository queueRepository;
    private final PatientRepository patientRepository;
    private final StaffRepository staffRepository;
    private final VisitRepository visitRepository;
    private final QueueNumberingService queueNumberingService;

    @Autowired
    public QueueEntryService(QueueEntryRepository queueEntryRepository,
                             QueueRepository queueRepository,
                             PatientRepository patientRepository,
                             StaffRepository staffRepository,
                             VisitRepository visitRepository,
                             QueueNumberingService queueNumberingService) {
        this.queueEntryRepository = queueEntryRepository;
        this.queueRepository = queueRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.visitRepository = visitRepository;
        this.queueNumberingService = queueNumberingService;
    }

    @Override
    public QueueEntry create(QueueEntry queueEntry) {
        if (queueEntry == null) {
            return null;
        }
        // Clients send only the ids of the queue, patient, doctor and visit,
        // so each reference is loaded again before the entry is saved.
        Queue queue = resolveQueue(queueEntry.getQueue());
        if (queue == null) {
            return null;
        }
        Patient patient = resolvePatient(queueEntry.getPatient());
        if (patient == null) {
            return null;
        }
        Staff doctor = resolveStaff(queueEntry.getDoctor());
        if (!isResolved(queueEntry.getDoctor(), doctor)) {
            return null;
        }
        Visit visit = resolveVisit(queueEntry.getVisit());
        if (!isResolved(queueEntry.getVisit(), visit)) {
            return null;
        }
        QueueEntry validated = QueueEntryFactory.createQueueEntry(
                queueEntry.getQueueEntryId(), queue, patient, doctor, visit,
                null, queueEntry.getPriorityLevel(),
                queueEntry.getStatus(), queueEntry.getCheckInTime());
        if (validated == null) {
            return null;
        }
        /*
         * The number is deliberately not taken from the request: it is issued
         * by QueueNumberingService when the entry joins a numbered status, so a
         * client cannot jump the queue by sending its own number.
         */
        QueueEntry saved = queueEntryRepository.save(validated);
        return queueNumberingService.numberIfApproved(saved);
    }

    @Override
    public QueueEntry read(String queueEntryId) {
        return queueEntryRepository.findById(queueEntryId).orElse(null);
    }

    @Override
    public QueueEntry update(QueueEntry queueEntry) {
        if (queueEntry == null || isBlank(queueEntry.getQueueEntryId())) {
            return null;
        }
        QueueEntry existing = queueEntryRepository.findById(queueEntry.getQueueEntryId()).orElse(null);
        if (existing == null) {
            return null;
        }
        // References are optional in a partial update: keep the stored record
        // unless the caller sent a new, resolvable one.
        if (queueEntry.getQueue() != null) {
            Queue queue = resolveQueue(queueEntry.getQueue());
            if (queue == null) {
                return null;
            }
            existing.setQueue(queue);
        }
        if (queueEntry.getPatient() != null) {
            Patient patient = resolvePatient(queueEntry.getPatient());
            if (patient == null) {
                return null;
            }
            existing.setPatient(patient);
        }
        if (queueEntry.getDoctor() != null) {
            Staff doctor = resolveStaff(queueEntry.getDoctor());
            if (doctor == null) {
                return null;
            }
            existing.setDoctor(doctor);
        }
        if (queueEntry.getVisit() != null) {
            Visit visit = resolveVisit(queueEntry.getVisit());
            if (visit == null) {
                return null;
            }
            existing.setVisit(visit);
        }
        // An explicit number may still be sent (for example to correct a
        // misprint), but a missing one is never a request to clear it: the
        // number stays as it is and is only issued by QueueNumberingService.
        if (queueEntry.getQueueNumber() != null && queueEntry.getQueueNumber() > 0) {
            existing.setQueueNumber(queueEntry.getQueueNumber());
        }
        if (queueEntry.getPriorityLevel() != null) {
            existing.setPriorityLevel(queueEntry.getPriorityLevel());
        }
        if (queueEntry.getStatus() != null) {
            // A doctor may only start the consultation after the nurse has
            // completed the assessment and marked the patient ready.
            if (isStartingConsultation(queueEntry.getStatus())
                    && !isReadyForConsultation(existing.getStatus())) {
                return null;
            }
            existing.setStatus(queueEntry.getStatus());
        }
        if (queueEntry.getCheckInTime() != null) {
            existing.setCheckInTime(queueEntry.getCheckInTime());
        }
        QueueEntry saved = queueEntryRepository.save(existing);
        // Assigning a doctor or approving the status releases the number.
        return queueNumberingService.numberIfApproved(saved);
    }

    @Override
    public void delete(String queueEntryId) {
        queueEntryRepository.deleteById(queueEntryId);
    }

    @Override
    public List<QueueEntry> getAll() {
        return queueEntryRepository.findAll();
    }

    private Queue resolveQueue(Queue reference) {
        if (reference == null || isBlank(reference.getQueueId())) {
            return null;
        }
        return queueRepository.findById(reference.getQueueId()).orElse(null);
    }

    private Patient resolvePatient(Patient reference) {
        if (reference == null || isBlank(reference.getUserId())) {
            return null;
        }
        return patientRepository.findById(reference.getUserId()).orElse(null);
    }

    private Staff resolveStaff(Staff reference) {
        if (reference == null || isBlank(reference.getUserId())) {
            return null;
        }
        return staffRepository.findById(reference.getUserId()).orElse(null);
    }

    private Visit resolveVisit(Visit reference) {
        if (reference == null || isBlank(reference.getVisitId())) {
            return null;
        }
        return visitRepository.findById(reference.getVisitId()).orElse(null);
    }

    // True when the caller did not send the reference at all, so a null
    // resolution is acceptable instead of a rejected request.
    private boolean isResolved(Object reference, Object resolved) {
        return resolved != null || reference == null;
    }

    private boolean isStartingConsultation(String status) {
        return "in consultation".equals(normalize(status));
    }

    private boolean isReadyForConsultation(String status) {
        String normalized = normalize(status);
        return "ready for doctor".equals(normalized) || "in consultation".equals(normalized);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
