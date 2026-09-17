package com.cput.mediqueuesystem.controller;

import com.cput.mediqueuesystem.domain.Clinic;
import com.cput.mediqueuesystem.domain.Queue;
import com.cput.mediqueuesystem.factory.ClinicFactory;
import com.cput.mediqueuesystem.factory.QueueFactory;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(MethodOrderer.MethodName.class)
class QueueControllerTest {

    private static Queue queue;
    private static Clinic clinic;

    @Autowired
    private TestRestTemplate restTemplate;
    private static final String BASE_URL = "/mediqueue/queue";

    @BeforeAll
    public static void setUp() {
        clinic = ClinicFactory.createClinic(
                "TCL01", "Main Clinic", "Building A", "021 555 0999");
        queue = QueueFactory.createQueue(
                "TQ001", clinic, LocalDate.of(2026, 6, 25), 30);
    }

    @Test
    void a_create() {
        // Create clinic first
        this.restTemplate.postForObject("/clinic/create", clinic, Clinic.class);

        String url = BASE_URL + "/create";
        ResponseEntity<Queue> response = this.restTemplate.postForEntity(url, queue, Queue.class);
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        queue = response.getBody();
        System.out.println("Created: " + queue);
    }

    @Test
    void b_read() {
        String url = BASE_URL + "/read/" + queue.getQueueId();
        ResponseEntity<Queue> response = restTemplate.getForEntity(url, Queue.class);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        System.out.println(response.getBody());
    }

    @Test
    void c_update() {
        Queue updatedQueue = new Queue.Builder().copy(queue)
                .setMaxCapacity(50)
                .build();
        String url = BASE_URL + "/update";
        ResponseEntity<Queue> response = this.restTemplate.postForEntity(url, updatedQueue, Queue.class);
        System.out.println("Updated status: " + response.getStatusCode());
        ResponseEntity<Queue> getResponse = this.restTemplate.getForEntity(BASE_URL + "/read/" + updatedQueue.getQueueId(), Queue.class);
        assertEquals(HttpStatus.OK, getResponse.getStatusCode());
        assertNotNull(getResponse.getBody());
        System.out.println("Updated: " + getResponse.getBody());
    }

    @Test
    @Disabled
    void e_delete() {
        String url = BASE_URL + "/delete/" + queue.getQueueId();
        this.restTemplate.delete(url);
        ResponseEntity<Queue> response = this.restTemplate.getForEntity(BASE_URL + "/read/" + queue.getQueueId(), Queue.class);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        System.out.println("Queue deleted: true");
    }

    @Test
    void d_getAll() {
        String url = BASE_URL + "/all";
        ResponseEntity<Queue[]> response = this.restTemplate.getForEntity(url, Queue[].class);
        assertNotNull(response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        System.out.println("Get All: ");
        for (Queue q : response.getBody()) {
            System.out.println(q);
        }
    }
}
