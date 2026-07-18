package com.agriconnect.crop;
import java.time.Instant; import java.util.Map; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import jakarta.servlet.http.HttpServletRequest;
class DomainException extends RuntimeException { final String code; final HttpStatus status; DomainException(HttpStatus s,String c,String m){super(m);status=s;code=c;} }
@RestControllerAdvice class ApiExceptionHandler { @ExceptionHandler(DomainException.class) ResponseEntity<?> domain(DomainException e,HttpServletRequest r){return ResponseEntity.status(e.status).body(Map.of("timestamp",Instant.now(),"status",e.status.value(),"error",e.status.getReasonPhrase(),"code",e.code,"message",e.getMessage(),"path",r.getRequestURI()));} }
