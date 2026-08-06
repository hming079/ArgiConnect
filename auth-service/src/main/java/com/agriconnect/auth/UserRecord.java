package com.agriconnect.auth;

public record UserRecord(Long id, String fullName, String email, String passwordHash, String phone, String role,
        String status) {
}
