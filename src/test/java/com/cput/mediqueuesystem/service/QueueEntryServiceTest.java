package com.cput.mediqueuesystem.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cput.mediqueuesystem.domain.Clinic;
import com.cput.mediqueuesystem.domain.Patient;
import com.cput.mediqueuesystem.domain.Queue;
import com.cput.mediqueuesystem.domain.QueueEntry;
import com.cput.mediqueuesystem.domain.Staff;
import com.cput.mediqueuesystem.repository.PatientRepository;
import com.cput.mediqueuesystem.repository.QueueEntryRepository;
import com.cput.mediqueuesystem.repository.QueueRepository;
import com.cput.mediqueuesystem.repository.StaffRepository;
import com.cput.mediqueuesystem.repository.VisitRepository;

@ExtendWith(MockitoExtension.class)
class QueueEntryServiceTest {

    @Mock
    private QueueEntryRepository queueEntryRepository;

    @Mock
    private QueueRepository queueRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private VisitRepository visitRepository;

    @Mock
    private QueueNumberingService queueNumberingService;

    @InjectMocks
    private QueueEntryService queueEntryService;

    private QueueEntry validEntry;
    private Queue queue;
    private Patient patient;
    private Staff doctor;

    @BeforeEach
    void setUp() {
        Clinic clinic = new Clinic.Builder().setClinicId("C-001").build();
        queue = new Queue.Builder().setQueueId("Q-001").setClinic(clinic).setDate(LocalDate.now()).build();
        patient = new Patient.Builder().setUserId("P-001").build();
        doctor = new Staff.Builder().setUserId("U-001").build();

        validEntry = new QueueEntry.Builder()
                .setQueueEntryId("QE-001").setQueue(queue).setPatient(patient).setDoctor(doctor)
                .setQueueNumber(1).setStatus("Waiting")
                .build();

        // The numbering service owns the queue number, so it is stubbed to hand
        // the entry straight back and leave the numbering itself to the tests
        // that exercise the real service. Lenient because reads and deletes
        // never reach it.
        lenient().when(queueNumberingService.numberIfApproved(any(QueueEntry.class)))
                .thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void create_withValidEntry_savesAndReturnsEntry() {
        when(queueRepository.findById("Q-001")).thenReturn(Optional.of(queue));
        when(patientRepository.findById("P-001")).thenReturn(Optional.of(patient));
        when(staffRepository.findById("U-001")).thenReturn(Optional.of(doctor));
        when(queueEntryRepository.save(any(QueueEntry.class))).thenReturn(validEntry);

        QueueEntry result = queueEntryService.create(validEntry);

        assertEquals("QE-001", result.getQueueEntryId());
        verify(queueEntryRepository, times(1)).save(any(QueueEntry.class));
    }

    @Test
    void create_withUnknownQueueReference_returnsNull() {
        when(queueRepository.findById("Q-001")).thenReturn(Optional.empty());

        QueueEntry result = queueEntryService.create(validEntry);

        assertNull(result);
        verify(queueEntryRepository, never()).save(any(QueueEntry.class));
    }

    @Test
    void create_withNullEntry_returnsNull() {
        QueueEntry result = queueEntryService.create(null);

        assertNull(result);
        verify(queueEntryRepository, never()).save(any(QueueEntry.class));
    }

    @Test
    void create_withInvalidEntry_failsFactoryValidation_returnsNull() {
        QueueEntry invalid = new QueueEntry.Builder().setQueueEntryId(null).build();

        QueueEntry result = queueEntryService.create(invalid);

        assertNull(result);
        verify(queueEntryRepository, never()).save(any(QueueEntry.class));
    }

    @Test
    void read_withExistingId_returnsEntry() {
        when(queueEntryRepository.findById("QE-001")).thenReturn(Optional.of(validEntry));

        QueueEntry result = queueEntryService.read("QE-001");

        assertEquals("Waiting", result.getStatus());
    }

    @Test
    void read_withNonExistingId_returnsNull() {
        when(queueEntryRepository.findById("QE-999")).thenReturn(Optional.empty());

        QueueEntry result = queueEntryService.read("QE-999");

        assertNull(result);
    }

    @Test
    void update_whenEntryExists_savesAndReturnsUpdated() {
        when(queueEntryRepository.findById("QE-001")).thenReturn(Optional.of(validEntry));
        when(queueRepository.findById("Q-001")).thenReturn(Optional.of(queue));
        when(patientRepository.findById("P-001")).thenReturn(Optional.of(patient));
        when(staffRepository.findById("U-001")).thenReturn(Optional.of(doctor));
        when(queueEntryRepository.save(validEntry)).thenReturn(validEntry);

        QueueEntry result = queueEntryService.update(validEntry);

        assertEquals("QE-001", result.getQueueEntryId());
    }

    @Test
    void update_withOnlyStatus_keepsStoredReferences() {
        validEntry.setStatus("Ready for Doctor");
        QueueEntry statusOnly = new QueueEntry.Builder()
                .setQueueEntryId("QE-001").setStatus("In Consultation").build();
        when(queueEntryRepository.findById("QE-001")).thenReturn(Optional.of(validEntry));
        when(queueEntryRepository.save(validEntry)).thenReturn(validEntry);

        QueueEntry result = queueEntryService.update(statusOnly);

        assertEquals("In Consultation", result.getStatus());
        assertEquals("P-001", result.getPatient().getUserId());
        assertEquals("Q-001", result.getQueue().getQueueId());
    }

    @Test
    void update_toInConsultation_withoutNurseAssessment_returnsNull() {
        QueueEntry statusOnly = new QueueEntry.Builder()
                .setQueueEntryId("QE-001").setStatus("In Consultation").build();
        when(queueEntryRepository.findById("QE-001")).thenReturn(Optional.of(validEntry));

        QueueEntry result = queueEntryService.update(statusOnly);

        assertNull(result);
        verify(queueEntryRepository, never()).save(any(QueueEntry.class));
    }

    @Test
    void update_whenEntryDoesNotExist_returnsNull() {
        when(queueEntryRepository.findById("QE-001")).thenReturn(Optional.empty());

        QueueEntry result = queueEntryService.update(validEntry);

        assertNull(result);
        verify(queueEntryRepository, never()).save(any(QueueEntry.class));
    }

    @Test
    void delete_callsRepositoryDeleteById() {
        queueEntryService.delete("QE-001");

        verify(queueEntryRepository, times(1)).deleteById("QE-001");
    }

    @Test
    void getAll_returnsAllEntries() {
        when(queueEntryRepository.findAll()).thenReturn(List.of(validEntry));

        List<QueueEntry> result = queueEntryService.getAll();

        assertEquals(1, result.size());
    }
}