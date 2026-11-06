package com.cput.mediqueuesystem.factory;


import java.time.LocalDate;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Test;
import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Staff;

class MedicalRecordFactoryTest {

    private Patient patient() {
        return new Patient.Builder().setCreatedAt(LocalDateTime.now()).setUserId("P-001").build();
    }

    private Staff staff() {
        return new Staff.Builder().setUserId("U-001").build();
    }

    @Test
    void createMedicalRecord_withValidData_returnsMedicalRecord() {
        var record = MedicalRecordFactory.createMedicalRecord(
                "MR-001", patient(), staff(), "Fever", "Flu", "Prescribed rest", LocalDate.of(2026, 5, 7));

        assertNotNull(record);
        assertEquals("MR-001", record.getRecordId());
        assertEquals("Flu", record.getDiagnosis());
    }

    @Test
    void createMedicalRecord_withNullRecordId_returnsNull() {
        var record = MedicalRecordFactory.createMedicalRecord(
                null, patient(), staff(), "Fever", "Flu", "notes", LocalDate.now());

        assertNull(record);
    }

    @Test
    void createMedicalRecord_withBlankRecordId_returnsNull() {
        var record = MedicalRecordFactory.createMedicalRecord(
                "   ", patient(), staff(), "Fever", "Flu", "notes", LocalDate.now());

        assertNull(record);
    }

    @Test
    void createMedicalRecord_withNullPatient_returnsNull() {
        var record = MedicalRecordFactory.createMedicalRecord(
                "MR-002", null, staff(), "Fever", "Flu", "notes", LocalDate.now());

        assertNull(record);
    }

    @Test
    void createMedicalRecord_withNullCreatedBy_returnsNull() {
        var record = MedicalRecordFactory.createMedicalRecord(
                "MR-003", patient(), null, "Fever", "Flu", "notes", LocalDate.now());

        assertNull(record);
    }

    @Test
    void createMedicalRecord_withNullRecordDate_returnsNull() {
        var record = MedicalRecordFactory.createMedicalRecord(
                "MR-004", patient(), staff(), "Fever", "Flu", "notes", null);

        assertNull(record);
    }

    @Test
    void createMedicalRecord_withNullDiagnosisAndNotes_stillReturnsRecord() {
        // diagnosis and notes are optional
        var record = MedicalRecordFactory.createMedicalRecord(
            "MR-005", patient(), staff(), "Fever", null, null, LocalDate.of(2026, 5, 7));

        assertNotNull(record);
    }
}