package com.cput.mediqueuesystem.util;

import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/*
 * PasswordUtil.java
 * Zero-dependency password hashing using PBKDF2 with HMAC-SHA256.
 *
 * Stored format:  pbkdf2$<iterations>$<base64 salt>$<base64 hash>
 * Plain (legacy) passwords that do not use the pbkdf2 prefix are
 * verified by direct comparison so accounts seeded before hashing
 * keep working; they are re-hashed on first successful login.
 *
 * Author: Charmaine Dlamini
 * Date: 24 September 2026
 */
public class PasswordUtil {

    private static final String PREFIX = "pbkdf2$";
    private static final int ITERATIONS = 100_000;
    private static final int KEY_LENGTH = 256; // bits
    private static final int SALT_LENGTH = 16; // bytes

    private PasswordUtil() {
    }

    // Returns true if the stored value is already a pbkdf2 hash
    public static boolean isHashed(String stored) {
        return stored != null && stored.startsWith(PREFIX);
    }

    // Hashes a plaintext password into the pbkdf2 format
    public static String hash(String plainPassword) {
        byte[] salt = new byte[SALT_LENGTH];
        new SecureRandom().nextBytes(salt);
        byte[] derived = pbkdf2(plainPassword, salt, ITERATIONS);
        return PREFIX + ITERATIONS + "$"
                + Base64.getEncoder().encodeToString(salt) + "$"
                + Base64.getEncoder().encodeToString(derived);
    }

    // Generates a random secret for accounts that are provisioned without a
    // password. It is hashed like any other password before it is stored, so
    // nobody can sign in with it until a real password is set.
    public static String generateRandomPassword() {
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // Verifies a plaintext password against the stored value.
    // Supports both hashed (pbkdf2) and legacy plaintext entries.
    public static boolean verify(String plainPassword, String stored) {
        if (plainPassword == null || stored == null) {
            return false;
        }
        if (!isHashed(stored)) {
            return plainPassword.equals(stored);
        }
        String[] parts = stored.split("\\$");
        if (parts.length != 4) {
            return false;
        }
        try {
            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            byte[] actual = pbkdf2(plainPassword, salt, iterations);
            return constantTimeEquals(actual, expected);
        } catch (Exception e) {
            return false;
        }
    }

    private static byte[] pbkdf2(String plainPassword, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(plainPassword.toCharArray(), salt, iterations, KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return factory.generateSecret(spec).getEncoded();
        } catch (Exception e) {
            throw new IllegalStateException("PBKDF2 hashing failed", e);
        }
    }

    private static boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a.length != b.length) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }
}