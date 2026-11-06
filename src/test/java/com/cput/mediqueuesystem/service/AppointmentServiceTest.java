package com.cput.mediqueuesystem.service;

import com.cput.mediqueuesystem.domain.*;
import com.cput.mediqueuesystem.factory.*;
import com.cput.mediqueuesystem.repository.QueueEntryRepository;
import com.cput.mediqueuesystem.repository.QueueRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.MethodName.class)
class AppointmentServiceTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private DepartmentService departmentService;

    @Autowired
    private PatientService patientService;

    @Autowired
    private StaffService staffService;

    @Autowired
    private ClinicService clinicService;

    @Autowired
    private QueueEntryRepository queueEntryRepository;

    @Autowired
    private QueueRepository queueRepository;

    @Autowired
    private QueueService queueService;

    @Autowired
    private QueueEntryService queueEntryService;

    Role patientRole = RoleFactory.createRole("TestPatientRole");
    Role docRole = RoleFactory.createRole("TestDoctorRole");
    Department department = DepartmentFactory.createDepartment("TD001", "General", "General");

    Patient patient = PatientFactory.createPatient(
            "TP001", "Charmaine", "Dlamini",
            "test.charmaine@gmail.com", "Password123",
            "0731234567", true, LocalDateTime.now(), patientRole,
            "9901011234599", LocalDate.of(1999, 1, 1),
            "Female", "123 Main St", null, null);

    Staff doctor = StaffFactory.createStaff(
            "TS001", "Imaan", "Achmat",
            "test.imaan@gmail.com", "Password123",
            "0731234568", true, LocalDateTime.now(), docRole,
            department, "Doctor");

    Appointment appointment = AppointmentFactory.createAppointment(
            "TA001", patient, doctor,
            LocalDate.of(2026, 6, 25), LocalTime.of(10, 30),
            "walk-in", "pending", doctor);

    @Test
    void a_create() {
        roleService.createRole(patientRole);
        roleService.createRole(docRole);
        departmentService.create(department);
        patientService.create(patient);
        staffService.create(doctor);
        Appointment created = appointmentService.create(appointment);
        assertNotNull(created);
        System.out.println(created);
    }

    @Test
    void b_read() {
        Appointment read = appointmentService.read(appointment.getAppointmentId());
        assertNotNull(read);
        System.out.println(read);
    }

    @Test
    void c_update() {
        Appointment updated = new Appointment.Builder().copy(appointment)
                .setStatus("confirmed")
                .build();
        Appointment result = appointmentService.update(updated);
        assertNotNull(result);
        System.out.println(result);
    }

    @Test
    @Disabled
    void e_delete() {
        appointmentService.delete(appointment.getAppointmentId());
        Appointment deleted = appointmentService.read(appointment.getAppointmentId());
        assertNull(deleted);
        System.out.println("Appointment deleted successfully");
    }

    @Test
    void d_getAll() {
        System.out.println(appointmentService.getAll());
    }

    /*
     * Creating a booking opens a queue entry for the patient, so cancelling
     * the booking has to close it again - otherwise the patient keeps waiting
     * in a queue for an appointment that no longer exists.
     */
    @Test
    void f_delete_closesThePatientsOpenQueueEntry() {
        // The other tests in this class already created these rows, and the
        // role/department names are unique, so only create what is missing.
        if (roleService.getRoleByName("TestPatientRole") == null) {
            roleService.createRole(patientRole);
        }
        if (roleService.getRoleByName("TestDoctorRole") == null) {
            roleService.createRole(docRole);
        }
        if (departmentService.read("TD001") == null) {
            departmentService.create(department);
        }
        if (patientService.read("TP001") == null) {
            patientService.create(patient);
        }
        if (staffService.read("TS001") == null) {
            staffService.create(doctor);
        }

        Clinic clinic = ClinicFactory.createClinic(
                "TCA001", "Cancel Clinic", "Cape Town", "0215550000");
        if (clinicService.read("TCA001") == null) {
            clinicService.create(clinic);
        }

        // The clinic has to be on the appointment *before* it is created: the
        // service only opens a queue entry when it knows which clinic's queue
        // the patient belongs to.
        Appointment booked = appointmentService.create(
                new Appointment.Builder()
                        .setAppointmentId("TAC001")
                        .setPatient(patient)
                        .setDoctor(doctor)
                        .setClinic(clinic)
                        .setScheduledDate(LocalDate.now())
                        .setScheduledTime(LocalTime.of(11, 0))
                        .setAppointmentType("booked")
                        .setStatus("Pending")
                        .setCreatedBy(doctor)
                        .build());
        assertNotNull(booked);

        // Creating the booking must have opened a queue entry.
        List<QueueEntry> open =
                queueEntryRepository.findByPatientUserIdAndStatusIn(
                        patient.getUserId(), List.of("Waiting", "Pending", "In Consultation"));
        assertFalse(open.isEmpty(), "booking should open a queue entry");

        assertTrue(appointmentService.delete(booked.getAppointmentId()));

        // The appointment is gone...
        assertNull(appointmentService.read(booked.getAppointmentId()));

        // ...and so is the stale queue entry.
        List<QueueEntry> stillOpen =
                queueEntryRepository.findByPatientUserIdAndStatusIn(
                        patient.getUserId(), List.of("Waiting", "Pending", "In Consultation"));
        assertTrue(stillOpen.isEmpty(), "open queue entries should be closed on cancel");
    }

    /**
     * A booking joins the queue immediately, so it must already carry a queue
     * number before any doctor is assigned. The patient is waiting for the
     * nurse at that point.
     */
    @Test
    void g_bookingGetsAQueueNumberImmediately() {
        if (roleService.getRoleByName("TestPatientRole") == null) {
            roleService.createRole(patientRole);
        }
        if (roleService.getRoleByName("TestDoctorRole") == null) {
            roleService.createRole(docRole);
        }
        if (departmentService.read("TD001") == null) {
            departmentService.create(department);
        }
        if (patientService.read("TP001") == null) {
            patientService.create(patient);
        }
        if (staffService.read("TS001") == null) {
            staffService.create(doctor);
        }

        // A patient of their own, so this test cannot be affected by the queue
        // entry that the other tests open for the shared patient. The stored
        // role is used, because an earlier test may already have created it.
        Role storedRole = roleService.getRoleByName("TestPatientRole");
        Patient waiting = PatientFactory.createPatient(
                "TP002", "Thandi", "Mokoena",
                "test.thandi@gmail.com", "Password123",
                "0731234599", true, LocalDateTime.now(), storedRole,
                "9902021234599", LocalDate.of(1998, 2, 2),
                "Female", "45 Main St", null, null);
        if (patientService.read("TP002") == null) {
            patientService.create(waiting);
        }

        Clinic clinic = ClinicFactory.createClinic(
                "TCA002", "Approval Clinic", "Cape Town", "0215550001");
        if (clinicService.read("TCA002") == null) {
            clinicService.create(clinic);
        }

        // Booked without a doctor: the patient is still in the live queue and
        // must already have a number so the nurse can assess them.
        Appointment requested = appointmentService.create(
                new Appointment.Builder()
                        .setAppointmentId("TAC002")
                        .setPatient(waiting)
                        .setClinic(clinic)
                        .setScheduledDate(LocalDate.now().plusDays(1))
                        .setScheduledTime(LocalTime.of(9, 30))
                        .setAppointmentType("booked")
                        .setStatus("Pending")
                        .build());
        assertNotNull(requested);

        List<QueueEntry> queued =
                queueEntryRepository.findByPatientUserIdAndStatusIn(
                        waiting.getUserId(), List.of("Waiting", "Pending", "In Consultation"));
        assertFalse(queued.isEmpty(), "the booking should be in the live queue");
        QueueEntry numbered = queued.get(0);
        assertEquals("Waiting", numbered.getStatus(),
                "a booking should wait for the nurse immediately");
        assertNotNull(numbered.getQueueNumber(),
                "a booking must be given a queue number immediately");
        assertTrue(numbered.getQueueNumber() > 0, "the queue number should start at 1 or above");

        // Assigning a doctor links the entry to that doctor without changing
        // the number that was issued at booking time.
        Appointment approved = appointmentService.assignDoctor("TAC002", doctor.getUserId());
        assertNotNull(approved);
        assertEquals("Confirmed", approved.getStatus());

        QueueEntry linked = queueEntryRepository
                .findByPatientUserIdAndStatusIn(
                        waiting.getUserId(), List.of("Waiting", "Pending", "In Consultation"))
                .get(0);
        assertEquals(numbered.getQueueNumber(), linked.getQueueNumber(),
                "doctor assignment must keep the booking queue number");
        assertNotNull(linked.getDoctor(), "the queue entry should be linked to the doctor");
    }

    /**
     * Approving through the status rather than a doctor assignment also releases
     * the number, so the receptionist can approve from the queue screen.
     */
    @Test
    void h_approvingTheStatusIssuesTheQueueNumber() {
        Queue queue = queueService.read(queueForToday());
        assertNotNull(queue);

        Patient patientNoDoc = PatientFactory.createPatient(
                "TP003", "Lebo", "Dlamini",
                "test.lebo@gmail.com", "Password123",
                "0731234588", true, LocalDateTime.now(),
                roleService.getRoleByName("TestPatientRole"),
                "9903031234599", LocalDate.of(1997, 3, 3),
                "Male", "7 Main St", null, null);
        if (patientService.read("TP003") == null) {
            patientService.create(patientNoDoc);
        }

        QueueEntry unnumbered = new QueueEntry.Builder()
                .setQueueEntryId("TE-APPROVE-1")
                .setQueue(queue)
                .setPatient(patientNoDoc)
                .setPriorityLevel("Normal")
                .setStatus("Pending")
                .build();
        queueEntryRepository.save(unnumbered);
        assertNull(unnumbered.getQueueNumber(), "created without a number");

        queueEntryService.update(new QueueEntry.Builder()
                .setQueueEntryId("TE-APPROVE-1")
                .setStatus("Confirmed")
                .build());

        QueueEntry reloaded = queueEntryRepository.findById("TE-APPROVE-1").orElse(null);
        assertNotNull(reloaded);
        assertNotNull(reloaded.getQueueNumber(),
                "approving the status should issue the queue number");
    }

    private String queueForToday() {
        return queueRepository.findAll().stream()
                .filter(q -> LocalDate.now().equals(q.getDate()))
                .map(Queue::getQueueId)
                .findFirst()
                .orElse(null);
    }
}
