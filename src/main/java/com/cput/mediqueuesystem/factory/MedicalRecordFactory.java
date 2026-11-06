package com.cput.mediqueuesystem.factory;

import java.time.LocalDate;

import org.apache.commons.validator.GenericValidator;

import com.cput.mediqueuesystem.domain.MedicalRecord;
import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Staff;

/*
 * MedicalRecordFactory.java
 * Validates input and builds MedicalRecord objects. Returns null
 * if required fields are missing or invalid, so callers can check
 * for a null result before persisting.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

public class MedicalRecordFactory {

    public static MedicalRecord createMedicalRecord(String recordId, Patient patient, Staff createdBy,
                                                      String complaint, String diagnosis, String notes, LocalDate recordDate) {

        if (GenericValidator.isBlankOrNull(recordId)
                || patient == null
                || createdBy == null
                || recordDate == null) {
            return null;
        }

        return new MedicalRecord.Builder()
                .setRecordId(recordId)
                .setPatient(patient)
                .setCreatedBy(createdBy)
                .setComplaint(complaint)
                .setDiagnosis(diagnosis)
                .setNotes(notes)
                .setRecordDate(recordDate)
                .build();
    }
}