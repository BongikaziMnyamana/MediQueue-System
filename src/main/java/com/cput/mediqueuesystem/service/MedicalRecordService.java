package com.cput.mediqueuesystem.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cput.mediqueuesystem.domain.MedicalRecord;
import com.cput.mediqueuesystem.factory.MedicalRecordFactory;
import com.cput.mediqueuesystem.repository.MedicalRecordRepository;

/*
 * MedicalRecordServiceImpl.java
 * Implements the business logic for managing medical records.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Service
public class MedicalRecordService implements IMedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;

    @Autowired
    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
    }

    @Override
    public MedicalRecord create(MedicalRecord medicalRecord) {
        if (medicalRecord == null) {
            return null;
        }
        MedicalRecord validated = MedicalRecordFactory.createMedicalRecord(
                medicalRecord.getRecordId(), medicalRecord.getPatient(), medicalRecord.getCreatedBy(),
                medicalRecord.getComplaint(), medicalRecord.getDiagnosis(), medicalRecord.getNotes(), medicalRecord.getRecordDate());
        if (validated == null) {
            return null;
        }
        return medicalRecordRepository.save(validated);
    }

    @Override
    public MedicalRecord read(String recordId) {
        return medicalRecordRepository.findById(recordId).orElse(null);
    }

    @Override
    public MedicalRecord update(MedicalRecord medicalRecord) {
        if (!medicalRecordRepository.existsById(medicalRecord.getRecordId())) {
            return null;
        }
        return medicalRecordRepository.save(medicalRecord);
    }

    @Override
    public boolean delete(String recordId) {
        if (!medicalRecordRepository.existsById(recordId)) {
            return false;
        }
        medicalRecordRepository.deleteById(recordId);
        return true;
    }

    @Override
    public List<MedicalRecord> getAll() {
        return medicalRecordRepository.findAll();
    }

    @Override
    public List<MedicalRecord> getByPatient(String patientId) {
        return medicalRecordRepository.findByPatientUserId(patientId);
    }
}
