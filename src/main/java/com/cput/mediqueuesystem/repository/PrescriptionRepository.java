package com.cput.mediqueuesystem.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cput.mediqueuesystem.domain.Prescription;

/*
 * PrescriptionRepository.java
 * JPA repository for Prescription entities.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, String> {

    List<Prescription> findByMedicalRecordRecordId(String recordId);
}
