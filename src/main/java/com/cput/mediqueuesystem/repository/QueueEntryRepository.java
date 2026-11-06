package com.cput.mediqueuesystem.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cput.mediqueuesystem.domain.QueueEntry;

/*
 * QueueEntryRepository.java
 * JPA repository for QueueEntry entities.
 *
 * Author: Uya
 * Date: 03 August 2026
 */

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, String> {

    List<QueueEntry> findByQueueQueueId(String queueId);

    Optional<QueueEntry> findFirstByPatientUserIdAndStatusIn(String patientId, Collection<String> statuses);

    List<QueueEntry> findByPatientUserIdAndStatusIn(String patientId, Collection<String> statuses);

    List<QueueEntry> findByPatientUserId(String patientId);
}
