package com.cput.mediqueuesystem.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cput.mediqueuesystem.domain.Visit;

/*
 * VisitRepository.java
 * JPA repository for Visit entities.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Repository
public interface VisitRepository extends JpaRepository<Visit, String> {

    List<Visit> findByPatientUserId(String patientId);
}
