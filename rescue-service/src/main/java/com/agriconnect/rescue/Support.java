package com.agriconnect.rescue;
import java.time.Instant;import java.util.Map;import jakarta.servlet.http.HttpServletRequest;import org.springframework.http.*;import org.springframework.web.bind.annotation.*;
class DomainException extends RuntimeException{final String code;final HttpStatus status;DomainException(HttpStatus s,String c,String m){super(m);status=s;code=c;}}
@RestControllerAdvice class Errors{@ExceptionHandler(DomainException.class)ResponseEntity<?>domain(DomainException e,HttpServletRequest r){return ResponseEntity.status(e.status).body(Map.of("timestamp",Instant.now(),"status",e.status.value(),"error",e.status.getReasonPhrase(),"code",e.code,"message",e.getMessage(),"path",r.getRequestURI()));}}
