package com.cput.mediqueuesystem.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cput.mediqueuesystem.domain.Department;
import com.cput.mediqueuesystem.domain.Role;
import com.cput.mediqueuesystem.domain.Staff;
import com.cput.mediqueuesystem.repository.StaffRepository;
import com.cput.mediqueuesystem.util.PasswordUtil;

@ExtendWith(MockitoExtension.class)
class StaffServiceTest {

    @Mock
    private StaffRepository staffRepository;

    @InjectMocks
    private StaffService staffService;

    private Staff staff;

    @BeforeEach
    void setUp() {
        Role role = new Role.Builder().setRoleId(2L).setRoleName("Doctor").build();
        Department department = new Department.Builder()
                .setDepartmentId("D-1").setDepartmentName("General Medicine").build();

        staff = new Staff.Builder().setCreatedAt(LocalDateTime.now())
                .setUserId("S-001").setFirstName("Nomsa").setLastName("Zulu")
                .setEmail("nomsa@example.com").setPassword("stored-hash")
                .setPhoneNumber("0821234567").setStatus(true).setRole(role)
                .setPosition("Doctor").setDepartment(department)
                .build();
    }

    @Test
    void update_keepsStoredValuesForFieldsTheCallerOmitted() {
        when(staffRepository.findById("S-001")).thenReturn(Optional.of(staff));

        // A password-only change carries none of the required columns.
        Staff partial = new Staff.Builder().setUserId("S-001")
                .setPassword("new-secret").setStatus(true)
                .build();
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Staff result = staffService.update(partial);

        assertEquals("Nomsa", result.getFirstName());
        assertEquals("nomsa@example.com", result.getEmail());
        assertEquals("0821234567", result.getPhoneNumber());
        assertEquals("Doctor", result.getPosition());
        assertEquals("General Medicine", result.getDepartment().getDepartmentName());
        // The new credential is stored hashed, never in plaintext.
        assertNotEquals("new-secret", result.getPassword());
        assertEquals(true, PasswordUtil.verify("new-secret", result.getPassword()));
    }

    @Test
    void create_hashesTheSuppliedPassword() {
        Staff created = new Staff.Builder().setUserId("S-002")
                .setFirstName("Thabo").setLastName("Mokoena")
                .setEmail("thabo@example.com").setPassword("pass123")
                .setPhoneNumber("0820000000").setStatus(true)
                .setRole(staff.getRole()).setPosition("Nurse").setDepartment(staff.getDepartment())
                .build();
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Staff result = staffService.create(created);

        assertEquals(true, PasswordUtil.verify("pass123", result.getPassword()));
    }

    @Test
    void create_withoutRequiredFields_returnsNull() {
        Staff incomplete = new Staff.Builder().setUserId("S-003")
                .setFirstName("No").setLastName("Role")
                .build();

        assertNull(staffService.create(incomplete));
    }

    @Test
    void update_withUnknownId_returnsNull() {
        when(staffRepository.findById("S-999")).thenReturn(Optional.empty());

        assertNull(staffService.update(new Staff.Builder().setUserId("S-999").build()));
    }

    @Test
    void delete_callsRepositoryDeleteById() {
        assertEquals(true, staffService.delete("S-001"));

        verify(staffRepository).deleteById("S-001");
    }
}
