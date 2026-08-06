package com.agriconnect.auth;

import java.time.Instant;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
class Errors {
    private ResponseEntity<Map<String, Object>> out(HttpStatus s, String m, HttpServletRequest r) {
        return ResponseEntity.status(s).body(Map.of("timestamp", Instant.now().toString(), "status", s.value(), "error",
                s.getReasonPhrase(), "message", m, "path", r.getRequestURI()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<?> bad(BadCredentialsException e, HttpServletRequest r) {
        return out(HttpStatus.UNAUTHORIZED, e.getMessage(), r);
    }

    @ExceptionHandler({ IllegalArgumentException.class, MethodArgumentNotValidException.class })
    ResponseEntity<?> invalid(Exception e, HttpServletRequest r) {
        return out(HttpStatus.BAD_REQUEST, e.getMessage(), r);
    }
}
