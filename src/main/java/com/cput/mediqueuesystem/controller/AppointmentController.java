package com.cput.mediqueuesystem.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cput.mediqueuesystem.domain.Appointment;
import com.cput.mediqueuesystem.service.IAppointmentService;

/*
 * AppointmentController.java
 * REST controller for managing appointments.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@RestController
@RequestMapping("/appointment")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final IAppointmentService appointmentService;

    @Autowired
    public AppointmentController(IAppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping("/create")
    public ResponseEntity<Appointment> create(@RequestBody Appointment appointment) {
        Appointment created = appointmentService.create(appointment);
        if (created == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/read/{id}")
    public ResponseEntity<Appointment> read(@PathVariable("id") String appointmentId) {
        Appointment appointment = appointmentService.read(appointmentId);
        if (appointment == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(appointment, HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<Appointment> update(@RequestBody Appointment appointment) {
        Appointment updated = appointmentService.update(appointment);
        if (updated == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Boolean> delete(@PathVariable("id") String appointmentId) {
        if (!appointmentService.delete(appointmentId)) {
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(true, HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Appointment>> getAll() {
        return new ResponseEntity<>(appointmentService.getAll(), HttpStatus.OK);
    }

    // Appointments for a specific patient (used by the patient dashboard)
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getByPatient(@PathVariable("patientId") String patientId) {
        return new ResponseEntity<>(appointmentService.getByPatient(patientId), HttpStatus.OK);
    }

    // Appointments assigned to a specific doctor (used by the doctor dashboard)
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getByDoctor(@PathVariable("doctorId") String doctorId) {
        return new ResponseEntity<>(appointmentService.getByDoctor(doctorId), HttpStatus.OK);
    }

    // Assign a doctor to an appointment (admin/doctor/receptionist)
    @PutMapping("/assign/{appointmentId}/{doctorId}")
    public ResponseEntity<Appointment> assignDoctor(@PathVariable("appointmentId") String appointmentId,
                                                    @PathVariable("doctorId") String doctorId) {
        Appointment appointment = appointmentService.assignDoctor(appointmentId, doctorId);
        if (appointment == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(appointment, HttpStatus.OK);
    }

    // Update the status of an appointment (admin/doctor/receptionist)
    @PutMapping("/status/{appointmentId}/{status}")
    public ResponseEntity<Appointment> updateStatus(@PathVariable("appointmentId") String appointmentId,
                                                    @PathVariable("status") String status) {
        Appointment appointment = appointmentService.updateStatus(appointmentId, status);
        if (appointment == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(appointment, HttpStatus.OK);
    }
}
