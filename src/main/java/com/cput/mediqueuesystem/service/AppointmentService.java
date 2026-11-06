package com.cput.mediqueuesystem.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cput.mediqueuesystem.domain.Appointment;
import com.cput.mediqueuesystem.domain.Clinic;
import com.cput.mediqueuesystem.domain.Department;
import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Queue;
import com.cput.mediqueuesystem.domain.QueueEntry;
import com.cput.mediqueuesystem.domain.Staff;
import com.cput.mediqueuesystem.factory.AppointmentFactory;
import com.cput.mediqueuesystem.factory.QueueEntryFactory;
import com.cput.mediqueuesystem.factory.QueueFactory;
import com.cput.mediqueuesystem.repository.AppointmentRepository;
import com.cput.mediqueuesystem.repository.ClinicRepository;
import com.cput.mediqueuesystem.repository.DepartmentRepository;
import com.cput.mediqueuesystem.repository.PatientRepository;
import com.cput.mediqueuesystem.repository.QueueEntryRepository;
import com.cput.mediqueuesystem.repository.QueueRepository;
import com.cput.mediqueuesystem.repository.StaffRepository;

/*
 * AppointmentServiceImpl.java
 * Implements the business logic for managing appointments.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Service
public class AppointmentService implements IAppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);
    private static final List<String> OPEN_QUEUE_STATUSES = Arrays.asList(
            "Waiting", "Pending", "Ready for Doctor", "In Consultation");

    private final AppointmentRepository appointmentRepository;
    private final StaffRepository staffRepository;
    private final PatientRepository patientRepository;
    private final ClinicRepository clinicRepository;
    private final DepartmentRepository departmentRepository;
    private final QueueRepository queueRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final QueueNumberingService queueNumberingService;

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository,
                              StaffRepository staffRepository,
                              PatientRepository patientRepository,
                              ClinicRepository clinicRepository,
                              DepartmentRepository departmentRepository,
                              QueueRepository queueRepository,
                              QueueEntryRepository queueEntryRepository,
                              QueueNumberingService queueNumberingService) {
        this.appointmentRepository = appointmentRepository;
        this.staffRepository = staffRepository;
        this.patientRepository = patientRepository;
        this.clinicRepository = clinicRepository;
        this.departmentRepository = departmentRepository;
        this.queueRepository = queueRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.queueNumberingService = queueNumberingService;
    }

    @Override
    public Appointment create(Appointment appointment) {
        if (appointment == null) {
            return null;
        }
        // Clients only know the ids of the records they reference, so every
        // nested object is looked up again before it is persisted. A reference
        // that cannot be resolved is rejected instead of being merged.
        Patient patient = resolvePatient(appointment.getPatient());
        if (patient == null) {
            return null;
        }
        Staff doctor = resolveStaff(appointment.getDoctor());
        if (!isResolved(appointment.getDoctor(), doctor)) {
            return null;
        }
        Staff createdBy = resolveStaff(appointment.getCreatedBy());
        if (!isResolved(appointment.getCreatedBy(), createdBy)) {
            return null;
        }
        Clinic clinic = resolveClinic(appointment.getClinic());
        if (!isResolved(appointment.getClinic(), clinic)) {
            return null;
        }
        Department department = resolveDepartment(appointment.getDepartment());
        if (!isResolved(appointment.getDepartment(), department)) {
            return null;
        }
        if (department == null && doctor != null) {
            department = doctor.getDepartment();
        }

        // A booking that already has a doctor is approved immediately. Only a
        // booking with no doctor stays "Pending" until somebody assigns one.
        String status = appointment.getStatus();
        if (doctor != null && (isBlank(status) || "Pending".equalsIgnoreCase(status.trim()))) {
            status = "Confirmed";
        }

        Appointment validated = AppointmentFactory.createAppointment(
                appointment.getAppointmentId(), patient, doctor,
                appointment.getScheduledDate(), appointment.getScheduledTime(),
                appointment.getAppointmentType(), status, createdBy);
        if (validated == null) {
            return null;
        }
        validated.setClinic(clinic);
        validated.setDepartment(department);
        validated.setReason(appointment.getReason());
        Appointment saved = appointmentRepository.save(validated);
        ensureQueueEntry(saved);
        return saved;
    }

    /*
     * Puts the patient in the clinic's queue for the booking date so the
     * booking is visible to the nurse, doctor, admin and reception straight
     * away. The queue entry is "Waiting" even before a doctor is assigned, so
     * the patient is issued a number immediately and can be assessed by the
     * nurse. Never creates duplicates.
     */
    private void ensureQueueEntry(Appointment appointment) {
        try {
            Patient patient = appointment.getPatient();
            if (patient == null) {
                return;
            }

            // The appointment may have been booked without a clinic (for
            // example the old self-booking form only sent a name). The queue
            // still needs a clinic, so fall back to the first one on file.
            Clinic clinic = appointment.getClinic();
            if (clinic == null || isBlank(clinic.getClinicId())) {
                clinic = clinicRepository.findAll().stream().findFirst().orElse(null);
            }
            if (clinic == null || isBlank(clinic.getClinicId())) {
                log.warn("No clinic exists, so no queue entry was created for appointment {} / patient {}",
                        appointment.getAppointmentId(), patient.getUserId());
                return;
            }

            LocalDate date = appointment.getScheduledDate() != null ? appointment.getScheduledDate() : LocalDate.now();
            final Clinic queueClinic = clinic;

            Queue queue = queueRepository
                    .findByClinicClinicIdAndDate(queueClinic.getClinicId(), date)
                    .orElseGet(() -> queueRepository.save(QueueFactory.createQueue(
                            "QUE-" + System.currentTimeMillis(),
                            queueClinic, date, 50)));

            boolean hasDoctor = appointment.getDoctor() != null;
            String queueStatus = "Waiting";

            var openEntry = queueEntryRepository.findFirstByPatientUserIdAndStatusIn(
                    patient.getUserId(), OPEN_QUEUE_STATUSES);
            if (openEntry.isPresent()) {
                QueueEntry entry = openEntry.get();
                if (hasDoctor) {
                    entry.setDoctor(appointment.getDoctor());
                }
                // A legacy "Pending" entry is moved into the live queue too,
                // so every booking ends up numbered and visible to the nurse.
                if (isUnapproved(entry.getStatus())) {
                    entry.setStatus(queueStatus);
                }
                queueEntryRepository.save(entry);
                queueNumberingService.numberIfApproved(entry);
                return;
            }

            QueueEntry entry = QueueEntryFactory.createQueueEntry(
                    "QE-" + System.currentTimeMillis(), queue, patient, appointment.getDoctor(), null,
                    null, "Normal", queueStatus, LocalTime.now());
            if (entry == null) {
                return;
            }
            queueEntryRepository.save(entry);
            queueNumberingService.numberIfApproved(entry);
        } catch (RuntimeException e) {
            // Queue assignment must never break the booking itself, but the
            // failure has to be visible instead of silently swallowed.
            log.error("Queue entry could not be created for appointment {}",
                    appointment.getAppointmentId(), e);
        }
    }

    private boolean isUnapproved(String status) {
        return isBlank(status) || "Pending".equalsIgnoreCase(status.trim());
    }

    @Override
    public Appointment read(String appointmentId) {
        return appointmentRepository.findById(appointmentId).orElse(null);
    }

    @Override
    public Appointment update(Appointment appointment) {
        if (appointment == null || isBlank(appointment.getAppointmentId())) {
            return null;
        }
        Appointment existing = appointmentRepository.findById(appointment.getAppointmentId()).orElse(null);
        if (existing == null) {
            return null;
        }
        // References are optional in a partial update: keep the stored record
        // unless the caller sent a new, resolvable one.
        if (appointment.getPatient() != null) {
            Patient patient = resolvePatient(appointment.getPatient());
            if (patient == null) {
                return null;
            }
            existing.setPatient(patient);
        }
        if (appointment.getDoctor() != null) {
            Staff doctor = resolveStaff(appointment.getDoctor());
            if (doctor == null) {
                return null;
            }
            existing.setDoctor(doctor);
        }
        if (appointment.getClinic() != null) {
            Clinic clinic = resolveClinic(appointment.getClinic());
            if (clinic == null) {
                return null;
            }
            existing.setClinic(clinic);
        }
        if (appointment.getDepartment() != null) {
            Department department = resolveDepartment(appointment.getDepartment());
            if (department == null) {
                return null;
            }
            existing.setDepartment(department);
        }
        if (appointment.getCreatedBy() != null) {
            Staff createdBy = resolveStaff(appointment.getCreatedBy());
            if (createdBy == null) {
                return null;
            }
            existing.setCreatedBy(createdBy);
        }
        if (appointment.getScheduledDate() != null) {
            existing.setScheduledDate(appointment.getScheduledDate());
        }
        if (appointment.getScheduledTime() != null) {
            existing.setScheduledTime(appointment.getScheduledTime());
        }
        if (appointment.getAppointmentType() != null) {
            existing.setAppointmentType(appointment.getAppointmentType());
        }
        if (appointment.getStatus() != null) {
            existing.setStatus(appointment.getStatus());
        } else if (existing.getDoctor() != null && isUnapproved(existing.getStatus())) {
            existing.setStatus("Confirmed");
        }
        if (appointment.getReason() != null) {
            existing.setReason(appointment.getReason());
        }
        return appointmentRepository.save(existing);
    }

    @Override
    @Transactional
    public boolean delete(String appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) {
            return false;
        }

        /*
         * Creating a booking also opens a queue entry for the patient, so
         * cancelling the booking has to close that entry again. Leaving it
         * behind would keep the patient waiting in a queue for an appointment
         * that no longer exists.
         */
        Patient patient = appointment.getPatient();
        if (patient != null) {
            queueEntryRepository
                    .findByPatientUserIdAndStatusIn(patient.getUserId(), OPEN_QUEUE_STATUSES)
                    .forEach(entry -> {
                        entry.setStatus("Cancelled");
                        queueEntryRepository.save(entry);
                    });
        }

        appointmentRepository.delete(appointment);
        return true;
    }

    @Override
    public List<Appointment> getAll() {
        return appointmentRepository.findAll();
    }

    @Override
    public List<Appointment> getByPatient(String patientId) {
        return appointmentRepository.findByPatientUserId(patientId);
    }

    @Override
    public List<Appointment> getByDoctor(String doctorId) {
        return appointmentRepository.findByDoctorUserId(doctorId);
    }

    @Override
    @Transactional
    public Appointment assignDoctor(String appointmentId, String doctorId) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) {
            return null;
        }
        Staff doctor = staffRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            return null;
        }
        appointment.setDoctor(doctor);
        if (doctor.getDepartment() != null) {
            appointment.setDepartment(doctor.getDepartment());
        }
        appointment.setStatus("Confirmed");
        Appointment saved = appointmentRepository.save(appointment);

        /*
         * The queue number was already issued at booking time. Assigning a
         * doctor only links the waiting entry to that doctor's line.
         */
        Patient patient = saved.getPatient();
        if (patient != null) {
            queueEntryRepository.findByPatientUserIdAndStatusIn(patient.getUserId(), OPEN_QUEUE_STATUSES)
                    .forEach(entry -> {
                        entry.setDoctor(doctor);
                        if (isUnapproved(entry.getStatus())) {
                            entry.setStatus("Waiting");
                        }
                        queueEntryRepository.save(entry);
                        queueNumberingService.numberIfApproved(entry);
                    });
        }

        // Older bookings may not have had a queue entry at all, so make sure
        // one exists for the now-approved appointment.
        ensureQueueEntry(saved);
        return saved;
    }

    @Override
    public Appointment updateStatus(String appointmentId, String status) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) {
            return null;
        }
        appointment.setStatus(status);
        Appointment saved = appointmentRepository.save(appointment);

        // Approving the booking through its status (rather than by assigning a
        // doctor) also moves a legacy pending entry into the live waiting line.
        String normalized = status == null ? "" : status.trim().toLowerCase();
        boolean approved = normalized.equals("confirmed") || normalized.equals("checked in");
        Patient patient = saved.getPatient();
        if (patient != null) {
            queueEntryRepository.findByPatientUserIdAndStatusIn(patient.getUserId(), OPEN_QUEUE_STATUSES)
                    .forEach(entry -> {
                        if (approved && isUnapproved(entry.getStatus())) {
                            entry.setStatus("Waiting");
                            queueEntryRepository.save(entry);
                        }
                        if (entry.getStatus() == null || OPEN_QUEUE_STATUSES.contains(entry.getStatus())) {
                            queueNumberingService.numberIfApproved(entry);
                        }
                    });
        }
        return saved;
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

    private Clinic resolveClinic(Clinic reference) {
        if (reference == null || isBlank(reference.getClinicId())) {
            return null;
        }
        return clinicRepository.findById(reference.getClinicId()).orElse(null);
    }

    private Department resolveDepartment(Department reference) {
        if (reference == null || isBlank(reference.getDepartmentId())) {
            return null;
        }
        return departmentRepository.findById(reference.getDepartmentId()).orElse(null);
    }

    // True when the caller did not send the reference at all, so a null
    // resolution is acceptable instead of a rejected request.
    private boolean isResolved(Object reference, Object resolved) {
        return resolved != null || reference == null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
