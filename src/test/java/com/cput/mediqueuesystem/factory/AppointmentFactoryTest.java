package com.cput.mediqueuesystem.factory;

import com.cput.mediqueuesystem.domain.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

class AppointmentFactoryTest {

    @Test
    void createAppointment() {
        Role role = RoleFactory.createRole("921", "Patient");
        Role docRole = RoleFactory.createRole("922", "Doctor");
        Department department = DepartmentFactory.createDepartment("D001", "General", "General");

        Patient patient = PatientFactory.createPatient(
                "P001", "Charmaine", "Dlamini",
                "charmaine@gmail.com", "Password123",
                "0731234567", true, LocalDateTime.now(), role,
                "9901011234567", LocalDate.of(1999, 1, 1),
                "Female", "123 Main St", null, null);

        Staff doctor = StaffFactory.createStaff(
                "S001", "Imaan", "Achmat",
                "imaan@gmail.com", "Password123",
                "0731234568", true, LocalDateTime.now(), docRole,
                department, "Doctor");

        Appointment appointment = AppointmentFactory.createAppointment(
                "A001", patient, doctor,
                LocalDate.of(2026, 6, 25), LocalTime.of(10, 30),
                "walk-in", "pending", doctor);
        assertNotNull(appointment);
        assertEquals("A001", appointment.getAppointmentId());
        System.out.println(appointment);
    }
}
