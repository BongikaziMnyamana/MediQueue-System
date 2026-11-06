package com.cput.mediqueuesystem.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cput.mediqueuesystem.domain.MedicalRecord;
import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Role;
import com.cput.mediqueuesystem.domain.Visit;
import com.cput.mediqueuesystem.repository.AppointmentRepository;
import com.cput.mediqueuesystem.repository.MedicalRecordRepository;
import com.cput.mediqueuesystem.repository.PatientRepository;
import com.cput.mediqueuesystem.repository.PrescriptionRepository;
import com.cput.mediqueuesystem.repository.QueueEntryRepository;
import com.cput.mediqueuesystem.repository.SymptomsAnalysisRepository;
import com.cput.mediqueuesystem.repository.VisitRepository;
import com.cput.mediqueuesystem.repository.VitalSignsRepository;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private QueueEntryRepository queueEntryRepository;

    @Mock
    private VisitRepository visitRepository;

    @Mock
    private VitalSignsRepository vitalSignsRepository;

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private SymptomsAnalysisRepository symptomsAnalysisRepository;

    @InjectMocks
    private PatientService patientService;

    private Patient patient;

    @BeforeEach
    void setUp() {
        Role role = new Role.Builder().setRoleId(1L).setRoleName("Patient").build();

        patient = new Patient.Builder().setCreatedAt(LocalDateTime.now())
                .setUserId("P-001").setFirstName("Ellen").setLastName("Luella")
                .setEmail("ellen@example.com").setPassword("pass123")
                .setPhoneNumber("0821234567").setStatus(true).setRole(role)
                .setIdNumber("9001015800081").setDateOfBirth(LocalDate.of(1990, 1, 1))
                .setGender("Female").setAddress("123 Main Street")
                .build();
    }

    @Test
    void create_savesAndReturnsPatient() {
        // NOTE: PatientService does not call PatientFactory before saving.
        when(patientRepository.save(any(Patient.class))).thenReturn(patient);

        Patient result = patientService.create(patient);

        assertEquals("P-001", result.getUserId());
        verify(patientRepository, times(1)).save(patient);
    }

    @Test
    void read_withExistingId_returnsPatient() {
        when(patientRepository.findById("P-001")).thenReturn(Optional.of(patient));

        Patient result = patientService.read("P-001");

        assertEquals("Ellen", result.getFirstName());
    }

    @Test
    void read_withNonExistingId_returnsNull() {
        when(patientRepository.findById("P-999")).thenReturn(Optional.empty());

        Patient result = patientService.read("P-999");

        assertNull(result);
    }

    @Test
    void update_savesAndReturnsPatient() {
        // The service merges the request over the stored record.
        when(patientRepository.findById("P-001")).thenReturn(Optional.of(patient));
        when(patientRepository.save(patient)).thenReturn(patient);

        Patient result = patientService.update(patient);

        assertEquals("P-001", result.getUserId());
    }

    @Test
    void update_keepsStoredValuesForFieldsTheCallerOmitted() {
        Patient stored = new Patient.Builder().setCreatedAt(LocalDateTime.now())
                .setUserId("P-001").setFirstName("Ellen").setLastName("Luella")
                .setEmail("ellen@example.com").setPassword("stored-hash")
                .setPhoneNumber("0821234567").setStatus(true).setRole(
                        new Role.Builder().setRoleId(1L).setRoleName("Patient").build())
                .setIdNumber("9001015800081").setDateOfBirth(LocalDate.of(1990, 1, 1))
                .setGender("Female").setAddress("123 Main Street")
                .build();
        when(patientRepository.findById("P-001")).thenReturn(Optional.of(stored));

        // A partial payload: only the address and phone were collected.
        Patient partial = new Patient.Builder().setUserId("P-001")
                .setPhoneNumber("0829999999").setStatus(true)
                .setAddress("9 Second Avenue")
                .build();
        when(patientRepository.save(partial)).thenReturn(partial);

        Patient result = patientService.update(partial);

        assertEquals("Ellen", result.getFirstName());
        assertEquals("ellen@example.com", result.getEmail());
        assertEquals("9001015800081", result.getIdNumber());
        assertEquals(LocalDate.of(1990, 1, 1), result.getDateOfBirth());
        assertEquals("Female", result.getGender());
        // The stored credential survives a request that carried none.
        assertEquals("stored-hash", result.getPassword());
        assertEquals("9 Second Avenue", result.getAddress());
    }

    @Test
    void update_withUnknownId_returnsNull() {
        when(patientRepository.findById("P-999")).thenReturn(Optional.empty());

        assertNull(patientService.update(new Patient.Builder().setUserId("P-999").build()));
    }

    @Test
    void delete_callsRepositoryDeleteById_andReturnsTrue() {
        when(patientRepository.existsById("P-001")).thenReturn(true);

        boolean result = patientService.delete("P-001");

        assertEquals(true, result);
        verify(patientRepository, times(1)).deleteById("P-001");
    }

    @Test
    void delete_withUnknownId_returnsFalse() {
        when(patientRepository.existsById("P-999")).thenReturn(false);

        assertEquals(false, patientService.delete("P-999"));
    }

    @Test
    void delete_removesDependentHistoryBeforeThePatient() {
        when(patientRepository.existsById("P-001")).thenReturn(true);
        Visit visit = new Visit.Builder().setVisitId("V-1")
                .setPatient(patient).setVisitDate(LocalDate.of(2026, 8, 5)).build();
        MedicalRecord record = new MedicalRecord.Builder().setRecordId("R-1")
                .setPatient(patient).build();
        when(visitRepository.findByPatientUserId("P-001")).thenReturn(List.of(visit));
        when(medicalRecordRepository.findByPatientUserId("P-001")).thenReturn(List.of(record));
        when(symptomsAnalysisRepository.findByPatientUserIdOrderByCreatedAtDesc("P-001"))
                .thenReturn(List.of());

        assertEquals(true, patientService.delete("P-001"));

        // The rows that point at the patient go first, deepest first. Queue
        // entries go before visits because a queue entry may reference one.
        InOrder order = inOrder(queueEntryRepository, vitalSignsRepository, visitRepository,
                prescriptionRepository, medicalRecordRepository, symptomsAnalysisRepository,
                appointmentRepository, patientRepository);
        order.verify(queueEntryRepository).deleteAll(anyList());
        order.verify(queueEntryRepository).flush();
        order.verify(vitalSignsRepository).deleteAll(anyList());
        order.verify(vitalSignsRepository).flush();
        order.verify(visitRepository).deleteAll(List.of(visit));
        order.verify(medicalRecordRepository).deleteAll(List.of(record));
        order.verify(symptomsAnalysisRepository).deleteAll(anyList());
        order.verify(appointmentRepository).deleteAll(anyList());
        order.verify(patientRepository).deleteById("P-001");
    }

    @Test
    void getAll_returnsAllPatients() {
        when(patientRepository.findAll()).thenReturn(List.of(patient));

        List<Patient> result = patientService.getAll();

        assertEquals(1, result.size());
    }
}