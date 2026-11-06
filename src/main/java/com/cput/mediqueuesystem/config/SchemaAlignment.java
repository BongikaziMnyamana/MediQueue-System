package com.cput.mediqueuesystem.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.Statement;
import java.util.Locale;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/*
 * SchemaAlignment.java
 * Repairs schema drift that ddl-auto=update cannot fix on an existing
 * database: appointment.doctor_id was created as NOT NULL, while a
 * patient may book before a doctor is assigned, and
 * queue_entry.queue_number was created as NOT NULL, while a booking
 * may join the live queue before the number is issued.
 *
 * Author: Charmaine Dlamini
 * Date: 25 September 2026
 */

@Component
public class SchemaAlignment {

    private static final Logger log = LoggerFactory.getLogger(SchemaAlignment.class);

    private final DataSource dataSource;

    public SchemaAlignment(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void align() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            String product = metaData.getDatabaseProductName().toLowerCase(Locale.ROOT);
            if (!product.contains("mysql")) {
                log.debug("Skipping schema alignment for {}", metaData.getDatabaseProductName());
                return;
            }
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE appointment MODIFY COLUMN doctor_id VARCHAR(255) NULL");
                log.info("appointment.doctor_id is now nullable, so bookings can be made before a doctor is assigned");
                statement.execute("ALTER TABLE queue_entry MODIFY COLUMN queue_number INT NULL");
                log.info("queue_entry.queue_number is now nullable, so a queue entry can be created before its number is issued");
            }
        } catch (Exception e) {
            log.warn("Could not align the nullable booking columns: {}", e.getMessage());
        }
    }
}
