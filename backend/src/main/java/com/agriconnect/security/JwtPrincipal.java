package com.agriconnect.security;

public record JwtPrincipal(Long userId, String email, String role) {}
