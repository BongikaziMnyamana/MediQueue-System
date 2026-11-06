package com.cput.mediqueuesystem.config;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Logger;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cput.mediqueuesystem.domain.Department;
import com.cput.mediqueuesystem.domain.Role;
import com.cput.mediqueuesystem.domain.Staff;
import com.cput.mediqueuesystem.factory.ClinicFactory;
import com.cput.mediqueuesystem.factory.DepartmentFactory;
import com.cput.mediqueuesystem.factory.RoleFactory;
import com.cput.mediqueuesystem.factory.StaffFactory;
import com.cput.mediqueuesystem.service.ClinicService;
import com.cput.mediqueuesystem.service.DepartmentService;
import com.cput.mediqueuesystem.service.PatientService;
import com.cput.mediqueuesystem.service.RoleService;
import com.cput.mediqueuesystem.service.StaffService;

/*
 * DataSeeder.java
 * Seeds only the infrastructure a brand-new database needs to be usable:
 * roles, clinics, departments, staff accounts and the administrator.
 *
 * Demo patients, appointments, visits, medical records, prescriptions and
 * queue entries are deliberately NOT seeded. Every patient shown in the app
 * must be a real registration, and a doctor only sees the patients actually
 * booked to them.
 *
 * Author: Charmaine Dlamini
 * Date: 21 September 2026
 */
@Configuration
public class DataSeeder {

    private static final Logger LOG = Logger.getLogger(DataSeeder.class.getName());

    // Rows created by older versions of this seeder. They are removed once so
    // an existing database stops showing the hardcoded demo patients.
    private static final List<String> LEGACY_DEMO_PATIENT_IDS = Arrays.asList(
            "P-0231", "P-0232", "P-0233", "P-0234", "P-0235", "P-0236");

    @Bean
    CommandLineRunner seedDatabase(RoleService roleService,
                                   ClinicService clinicService,
                                   DepartmentService departmentService,
                                   StaffService staffService,
                                   PatientService patientService) {
        return args -> {
            if (roleService.getAllRoles().isEmpty()) {
                LOG.info("DataSeeder: seeding roles, clinics, departments and staff accounts...");
                seedInfrastructure(roleService, clinicService, departmentService, staffService);
                LOG.info("DataSeeder: infrastructure seed complete. No demo patients were created.");
            } else {
                LOG.info("DataSeeder: database already has data, skipping infrastructure seed.");
            }

            ensureAdminStaff(roleService, departmentService, staffService);
            removeLegacyDemoPatients(patientService);
        };
    }

    private void seedInfrastructure(RoleService roleService,
                                    ClinicService clinicService,
                                    DepartmentService departmentService,
                                    StaffService staffService) {
        // ---- Roles ----
        roleService.createRole(RoleFactory.createRole("PATIENT"));
        Role roleReceptionist = roleService.createRole(RoleFactory.createRole("RECEPTIONIST"));
        Role roleDoctor = roleService.createRole(RoleFactory.createRole("DOCTOR"));
        Role roleNurse = roleService.createRole(RoleFactory.createRole("NURSE"));
        Role rolePharmacist = roleService.createRole(RoleFactory.createRole("PHARMACIST"));
        roleService.createRole(RoleFactory.createRole("ADMIN"));

        // ---- Clinics ----
        clinicService.create(ClinicFactory.createClinic("CL001", "District Six Clinic", "Cape Town", "0215551001"));
        clinicService.create(ClinicFactory.createClinic("CL002", "Bellville Clinic", "Bellville", "0215551002"));
        clinicService.create(ClinicFactory.createClinic("CL003", "Khayelitsha Clinic", "Khayelitsha", "0215551003"));
        clinicService.create(ClinicFactory.createClinic("CL004", "Mitchells Plain Clinic", "Mitchells Plain", "0215551004"));

        // ---- Departments ----
        departmentService.create(DepartmentFactory.createDepartment("DEP001", "General Medicine", "General consultations"));
        departmentService.create(DepartmentFactory.createDepartment("DEP002", "Pediatrics", "Child health care"));
        departmentService.create(DepartmentFactory.createDepartment("DEP003", "Antenatal Care", "Pregnancy care"));
        departmentService.create(DepartmentFactory.createDepartment("DEP004", "HIV Care", "HIV testing and treatment"));

        Department deptGeneral = departmentService.read("DEP001");
        Department deptPediatrics = departmentService.read("DEP002");
        Department deptAntenatal = departmentService.read("DEP003");
        Department deptHiv = departmentService.read("DEP004");

        // ---- Staff ----
        // Starter staff accounts only. Real patients are never seeded.
        LocalDateTime now = LocalDateTime.now();
        staffService.create(StaffFactory.createStaff(
                "U-100", "Thandi", "M.", "thandi.m@mediqueue.co.za", "pass123",
                "0712345678", true, now, roleReceptionist, deptGeneral, "Receptionist"));
        staffService.create(StaffFactory.createStaff(
                "U-101", "N.", "Zulu", "n.zulu@mediqueue.co.za", "pass123",
                "0823456789", true, now, roleDoctor, deptGeneral, "Doctor"));
        staffService.create(StaffFactory.createStaff(
                "U-102", "L.", "Pillay", "l.pillay@mediqueue.co.za", "pass123",
                "0716667778", true, now, roleDoctor, deptPediatrics, "Doctor"));
        staffService.create(StaffFactory.createStaff(
                "U-103", "T.", "Mthembu", "t.mthembu@mediqueue.co.za", "pass123",
                "0631112223", true, now, roleDoctor, deptAntenatal, "Doctor"));
        staffService.create(StaffFactory.createStaff(
                "U-104", "R.", "Jacobs", "r.jacobs@mediqueue.co.za", "pass123",
                "0608889990", true, now, roleDoctor, deptHiv, "Doctor"));
        staffService.create(StaffFactory.createStaff(
                "U-105", "P.", "Adams", "p.adams@mediqueue.co.za", "pass123",
                "0634567890", true, now, rolePharmacist, deptGeneral, "Pharmacist"));
        staffService.create(StaffFactory.createStaff(
                "U-106", "Bongikazi", "M.", "b.mnyamana@mediqueue.co.za", "pass123",
                "0721112233", true, now, roleNurse, deptPediatrics, "Nurse"));
    }

    /*
     * Removes the demo patients created by older versions of this seeder.
     * PatientService.delete also removes their appointments, visits, vitals,
     * records, prescriptions and queue entries, so no orphan rows are left
     * behind. Unknown ids are simply skipped.
     */
    private void removeLegacyDemoPatients(PatientService patientService) {
        for (String patientId : LEGACY_DEMO_PATIENT_IDS) {
            try {
                if (patientService.delete(patientId)) {
                    LOG.info("DataSeeder: removed legacy demo patient " + patientId);
                }
            } catch (RuntimeException e) {
                LOG.warning("DataSeeder: could not remove legacy demo patient " + patientId + ": " + e.getMessage());
            }
        }
    }

    /*
     * Creates the ADMIN staff user (U-107) if it does not exist yet.
     * Runs on every startup so databases seeded before admin support
     * was added still get an administrator without a duplicate role.
     */
    private void ensureAdminStaff(RoleService roleService,
                                  DepartmentService departmentService,
                                  StaffService staffService) {
        if (staffService.read("U-107") != null) {
            return;
        }
        Role admin = roleService.getRoleByName("ADMIN");
        if (admin == null) {
            admin = roleService.createRole(RoleFactory.createRole("ADMIN"));
        }
        Department dept = departmentService.read("DEP001");
        if (dept == null) {
            dept = departmentService.create(DepartmentFactory.createDepartment(
                    "DEP001", "General Medicine", "General consultations"));
        }
        Staff adminUser = staffService.create(StaffFactory.createStaff(
                "U-107", "S.", "Ndaba", "s.ndaba@mediqueue.co.za", "pass123",
                "0723334455", true, LocalDateTime.now(), admin, dept, "Administrator"));
        if (adminUser != null) {
            LOG.info("DataSeeder: created ADMIN staff user " + adminUser.getUserId());
        }
    }
}
