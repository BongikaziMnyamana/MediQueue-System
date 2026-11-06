package com.cput.mediqueuesystem.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cput.mediqueuesystem.domain.MedicalRecord;
import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Visit;
import com.cput.mediqueuesystem.repository.AppointmentRepository;
import com.cput.mediqueuesystem.repository.MedicalRecordRepository;
import com.cput.mediqueuesystem.repository.PatientRepository;
import com.cput.mediqueuesystem.repository.PrescriptionRepository;
import com.cput.mediqueuesystem.repository.QueueEntryRepository;
import com.cput.mediqueuesystem.repository.SymptomsAnalysisRepository;
import com.cput.mediqueuesystem.repository.VisitRepository;
import com.cput.mediqueuesystem.repository.VitalSignsRepository;
import com.cput.mediqueuesystem.util.PasswordUtil;

/*
PatientService.java
PatientService
Author: Charmaine Dlamini
Date: 05 August 2026
 */

@Service
public class PatientService implements IPatientService {

    private static final Logger log = LoggerFactory.getLogger(PatientService.class);

    private final PatientRepository repository;
    private final AppointmentRepository appointmentRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final VisitRepository visitRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final SymptomsAnalysisRepository symptomsAnalysisRepository;

    @Autowired
    PatientService(PatientRepository repository,
            AppointmentRepository appointmentRepository,
            QueueEntryRepository queueEntryRepository,
            VisitRepository visitRepository,
            VitalSignsRepository vitalSignsRepository,
            MedicalRecordRepository medicalRecordRepository,
            PrescriptionRepository prescriptionRepository,
            SymptomsAnalysisRepository symptomsAnalysisRepository) {
        this.repository = repository;
        this.appointmentRepository = appointmentRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.visitRepository = visitRepository;
        this.vitalSignsRepository = vitalSignsRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.symptomsAnalysisRepository = symptomsAnalysisRepository;
    }

    // Saves a new patient to the database
    @Override
    public Patient create(Patient patient) {
        if (patient == null) {
            return null;
        }
        // Passwords are write-only, so an admin-created account can arrive
        // without one. Give it an unusable random credential instead of
        // failing the insert; the account signs in only after a reset.
        if (isBlank(patient.getPassword())) {
            log.warn("No password supplied for patient {} - generated a random one; a password reset is required before first login",
                    patient.getUserId());
            patient.setPassword(PasswordUtil.generateRandomPassword());
        }
        if (isBlank(patient.getUserId()) || patient.getRole() == null) {
            return null;
        }
        if (patient.getCreatedAt() == null) {
            patient.setCreatedAt(LocalDateTime.now());
        }
        // Never keep a plaintext credential, whether it was supplied or generated.
        if (!PasswordUtil.isHashed(patient.getPassword())) {
            patient.setPassword(PasswordUtil.hash(patient.getPassword()));
        }
        return this.repository.save(patient);
    }

    // Finds a patient by their patient ID
    @Override
    public Patient read(String patientId) {
        return this.repository.findById(patientId).orElse(null);
    }

    // Updates an existing patient in the database
    @Override
    public Patient update(Patient patient) {
        if (patient == null || isBlank(patient.getUserId())) {
            return null;
        }
        Patient existing = this.repository.findById(patient.getUserId()).orElse(null);
        if (existing == null) {
            return null;
        }
        // The browser only sends the fields the form collected, so merge the
        // request over the stored record instead of overwriting columns that
        // were left out (most of them are NOT NULL in MySQL).
        if (isBlank(patient.getPassword())) {
            patient.setPassword(existing.getPassword());
        } else if (!PasswordUtil.isHashed(patient.getPassword())) {
            patient.setPassword(PasswordUtil.hash(patient.getPassword()));
        }
        if (patient.getRole() == null) {
            patient.setRole(existing.getRole());
        }
        if (isBlank(patient.getFirstName())) {
            patient.setFirstName(existing.getFirstName());
        }
        if (isBlank(patient.getLastName())) {
            patient.setLastName(existing.getLastName());
        }
        if (isBlank(patient.getEmail())) {
            patient.setEmail(existing.getEmail());
        }
        if (isBlank(patient.getPhoneNumber())) {
            patient.setPhoneNumber(existing.getPhoneNumber());
        }
        if (isBlank(patient.getIdNumber())) {
            patient.setIdNumber(existing.getIdNumber());
        }
        if (patient.getDateOfBirth() == null) {
            patient.setDateOfBirth(existing.getDateOfBirth());
        }
        if (isBlank(patient.getGender())) {
            patient.setGender(existing.getGender());
        }
        if (isBlank(patient.getAddress())) {
            patient.setAddress(existing.getAddress());
        }
        if (patient.getCreatedAt() == null) {
            patient.setCreatedAt(existing.getCreatedAt());
        }
        return this.repository.save(patient);
    }

    // Deletes a patient by their patient ID
    /*
     * @Transactional so the whole cascade commits or rolls back as one unit.
     * Without it each repository call is its own transaction, and a failure
     * part-way through would leave the patient deleted with their history
     * already gone - unrecoverable data loss.
     */
    @Override
    @Transactional
    public boolean delete(String patientId) {
        if (isBlank(patientId) || !this.repository.existsById(patientId)) {
            return false;
        }
        // The child tables have NOT NULL references to the patient, so the
        // history is removed first, deepest rows before the rows that point at
        // them. Queue entries are removed first because they may reference a
        // visit, and a visit cannot be deleted while that reference exists.
        this.queueEntryRepository.deleteAll(this.queueEntryRepository.findByPatientUserId(patientId));
        this.queueEntryRepository.flush();

        List<Visit> visits = this.visitRepository.findByPatientUserId(patientId);
        for (Visit visit : visits) {
            this.vitalSignsRepository.deleteAll(this.vitalSignsRepository.findByVisitVisitId(visit.getVisitId()));
        }
        this.vitalSignsRepository.flush();
        this.visitRepository.deleteAll(visits);
        this.visitRepository.flush();

        List<MedicalRecord> records = this.medicalRecordRepository.findByPatientUserId(patientId);
        for (MedicalRecord record : records) {
            this.prescriptionRepository.deleteAll(
                    this.prescriptionRepository.findByMedicalRecordRecordId(record.getRecordId()));
        }
        this.prescriptionRepository.flush();
        this.medicalRecordRepository.deleteAll(records);
        this.medicalRecordRepository.flush();

        this.symptomsAnalysisRepository.deleteAll(
                this.symptomsAnalysisRepository.findByPatientUserIdOrderByCreatedAtDesc(patientId));
        this.appointmentRepository.deleteAll(this.appointmentRepository.findByPatientUserId(patientId));
        this.appointmentRepository.flush();

        this.repository.deleteById(patientId);
        return true;
    }

    // Returns a list of all patients
    @Override
    public List<Patient> getAll() {
        return this.repository.findAll();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
