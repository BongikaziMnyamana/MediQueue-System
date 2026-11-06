# MediQueue System

A clinic queue-management and patient-records system. Staff register walk-in or
booked patients, patients are queued and called through a clinic queue, and
every stage of the visit — vital signs, symptom analysis, consultation notes,
prescriptions and dispensing — is written to a MySQL database and read back by
the web front end through a REST API.

* **Backend:** Spring Boot 3.2.5, Java 21, Spring Data JPA / Hibernate, MySQL 8
* **Frontend:** vanilla HTML, CSS and JavaScript (no framework, no build step)
* **Tests:** JUnit 5, Mockito, MockMvc, H2 (55 test classes, 308 tests)

---

## Table of contents

1. [What the system does](#what-the-system-does)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Setup and running](#setup-and-running)
5. [Demo accounts](#demo-accounts)
6. [Project structure](#project-structure)
7. [REST API reference](#rest-api-reference)
8. [Database design](#database-design)
9. [Frontend-to-backend integration](#frontend-to-backend-integration)
10. [Design decisions](#design-decisions)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## What the system does

| Role | Responsibilities |
|------|------------------|
| **Receptionist** | Books appointments, registers walk-ins, opens the daily queue, calls the next patient, assigns the doctor |
| **Nurse** | Works the queue, records vital signs, marks the patient `Ready for Doctor`, runs symptom analysis |
| **Doctor** | Starts consultations only after nurse readiness, writes medical records, issues prescriptions |
| **Pharmacist** | Views prescriptions, marks them dispensed |
| **Patient** | Books appointments, tracks their queue position, views records and prescriptions, receives notifications |
| **Administrator** | Manages staff accounts, clinics and departments |

### End-to-end flow

```
Walk-in / booking  ->  Appointment + QueueEntry (doctor may be NULL, number issued immediately)
   ->  Nurse: VitalSigns + SymptomsAnalysis -> status = Ready for Doctor
   ->  Doctor: MedicalRecord
   ->  Doctor: Prescription
   ->  Pharmacist: prescription status = Dispensed
```

---

## Tech stack

| Layer | Technology | Documentation |
|-------|-----------|---------------|
| Web framework | Spring Boot 3.2.5 | https://docs.spring.io/spring-boot/docs/3.2.5/reference/html/ |
| Language | Java 21 (LTS) | https://docs.oracle.com/en/java/javase/21/ |
| Persistence | Spring Data JPA | https://docs.spring.io/spring-data/jpa/reference/ |
| ORM | Hibernate 6 | https://docs.jboss.org/hibernate/orm/6.2/ |
| Database | MySQL 8 | https://dev.mysql.com/doc/refman/8.0/en/ |
| JDBC driver | mysql-connector-j | https://dev.mysql.com/doc/connector-j/en/ |
| JSON mapping | Jackson | https://github.com/FasterXML/jackson-docs |
| Validation | Apache Commons Validator 1.10.1 | https://commons.apache.org/proper/commons-validator/ |
| Auth | Custom `HandlerInterceptor` (JWT-style opaque token) | https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping.html |
| Test DB | H2 (in-memory) | https://www.h2database.com/html/features.html |
| Unit tests | JUnit 5 + Mockito | https://junit.org/junit5/docs/current/user-guide/ , https://site.mockito.org/ |
| Integration tests | Spring MockMvc | https://docs.spring.io/spring-framework/reference/testing/webappctx/mvc-mockmvc.html |
| Build | Apache Maven (wrapper included) | https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html |
| Frontend | HTML5, CSS3, ES6+ JavaScript, Fetch API | https://developer.mozilla.org/en-US/docs/Web/JavaScript , https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API |
 
---

## Prerequisites

* **JDK 21** — `java -version`
* **MySQL 8** running on `localhost:3306`, or set `MYSQL_HOST`
* **Maven** is not required; the repository includes `mvnw.cmd` (Windows) and
  `mvnw` (macOS/Linux)
* A modern browser. A static file server is only needed because the front end
  uses `fetch` (see below)

---

## Setup and running

### 1. Database

The application creates its own schema and tables on first start
(`createDatabaseIfNotExist=true`, `ddl-auto=update`). You only need a MySQL
server with a user that can create databases:

```sql
CREATE USER 'root'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
```

Connection settings live in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://${MYSQL_HOST:localhost}:3306/MediQueue?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
server.servlet.context-path=/MediQueue
server.port=8080
```

Override the host without editing the file:

```powershell
$env:MYSQL_HOST="localhost"
```

### 2. Backend

```powershell
# Windows
.\mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

Startup log ends with:

```
Tomcat started on port 8080 (http) with context path '/MediQueue'
DataSeeder: seeding complete (roles, clinics, departments, patients, staff, appointments, visits, records, prescriptions, queue).
```

`DataSeeder` runs **only when the `roles` table is empty**, so restarting never
duplicates data. It inserts ~50 interlinked, domain-realistic records: 6
patients, 8 staff members, 4 clinics, 4 departments, 5 appointments, 4 visits,
3 medical records, 5 prescriptions, 1 queue and 5 queue entries.

### 3. Frontend

The pages are plain static files. Because they call the API with `fetch`, they
must be served over `http://` rather than opened with `file://`. Either use VS
Code **Live Server** (right-click `frontend/html/index.html` → *Open with Live
Server*), or:

```powershell
npx serve frontend
```

Then open the URL it prints, for example `http://localhost:3000/html/index.html`.

The API base URL is defined once, in `frontend/js/data.js`:

```js
const API_BASE = "http://localhost:8080/MediQueue";
```

Change it there if your backend runs on another host or port.

### 4. Tests

```powershell
.\mvnw.cmd test
```

Expected: `Tests run: 308, Failures: 0, Errors: 0, Skipped: 2` and
`BUILD SUCCESS`. Tests use an in-memory H2 database, so MySQL does not need to
be running.

### 5. Reset the database

```sql
DROP DATABASE MediQueue;
```

Restart the backend the schema and starter data are recreated.

---

## Demo accounts

All seeded accounts use the password **`pass123`**.

| Role | Email | ID |
|------|-------|-----|
| Administrator | s.ndaba@mediqueue.co.za | U-107 |
| Receptionist | thandi.m@mediqueue.co.za | U-100 |
| Doctor | n.zulu@mediqueue.co.za | U-101 |
| Doctor (Pediatrics) | l.pillay@mediqueue.co.za | U-102 |
| Doctor (Antenatal) | t.mthembu@mediqueue.co.za | U-103 |
| Doctor (HIV Care) | r.jacobs@mediqueue.co.za | U-104 |
| Pharmacist | p.adams@mediqueue.co.za | U-105 |
| Nurse | b.mnyamana@mediqueue.co.za | U-106 |
| Patient | sipho.dlamini@mediqueue.co.za | P-0231 |
| Patient | nomsa.khumalo@mediqueue.co.za | P-0232 |

Staff sign in at `frontend/html/staff-login.html`, patients at
`frontend/html/patient-login.html`.

---

## Project structure

```
MediQueue-System/
├── mvnw / mvnw.cmd           Maven wrapper
├── pom.xml                   Dependencies, Java 21, surefire config
├── src/main/java/com/cput/mediqueuesystem/
│   ├── config/               WebConfig, AuthInterceptor, DataSeeder, SchemaAlignment
│   ├── controller/           16 REST controllers (HTTP layer only)
│   ├── domain/               14 JPA entities
│   ├── factory/              Entity factories (builder entry points)
│   ├── repository/           Spring Data JPA interfaces
│   ├── service/              Business logic, password hashing, referential cleanup
│   └── util/                 PasswordUtil (PBKDF2), ApiExceptionHandler
├── src/main/resources/application.properties
├── src/test/java/...         55 test classes (unit + integration)
└── frontend/
    ├── html/                 42 pages
    ├── css/                  Shared stylesheet(s)
    └── js/
        ├── data.js           The single API layer for the whole front end
        ├── guard.js          Session and role guards
        └── pages/            One script per page (rendering only)
```

**The layering rule:** a controller never touches a repository, and a page
script never calls `fetch` directly. Business rules live in services, HTTP lives
in controllers, rendering lives in page scripts.

---

## REST API reference

Base URL: `http://localhost:8080/MediQueue`

---

## Database design

14 tables, InnoDB, foreign keys enforced.

```
roles ──┐
        ├──< user >────┬──── patient
        │              └──── staff ────> department ────> clinic
        └────────────── role_id
                        user_id (PK, shared)

patient ──┬──< appointment >──┬── staff (doctor, NULLABLE)
          │                   └── clinic, department, created_by (staff)
          ├──< visit >─────── appointment (nullable)
          │      └──< vital_signs
          ├──< medical_record >── staff (doctor)
          │      └──< prescription
          ├──< symptoms_analysis
          ├──< queue_entry >── queue, staff (doctor, NULLABLE)
          └──< prescription (via record)
```
---

## References

* Spring Boot reference — https://docs.spring.io/spring-boot/docs/3.2.5/reference/html/
* Spring Data JPA — https://docs.spring.io/spring-data/jpa/reference/
* Hibernate 6 User Guide — https://docs.jboss.org/hibernate/orm/6.2/
* MySQL 8 Reference Manual — https://dev.mysql.com/doc/refman/8.0/en/
* Jackson Annotations — https://github.com/FasterXML/jackson-annotations
* JUnit 5 User Guide — https://junit.org/junit5/docs/current/user-guide/
* Mockito — https://site.mockito.org/
* Spring MockMvc — https://docs.spring.io/spring-framework/reference/testing/webappctx/mvc-mockmvc.html
* H2 Database — https://www.h2database.com/html/features.html
* MDN Fetch API — https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
