package com.agriconnect.auth;

import com.agriconnect.auth.dto.LoginRequest;
import com.agriconnect.auth.dto.LoginResponse;
import com.agriconnect.auth.dto.RegisterRequest;
import com.agriconnect.user.UserService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        
        userService.register(request);
        return ResponseEntity.ok("Đăng ký thành công tài khoản: " + request.getEmail());
    }

    @PostMapping("/login")
    // Lưu ý 1: Đổi kiểu trả về thành LoginResponse (để nó tự chuyển thành JSON chứa Token)
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        
        try {
        LoginResponse response = authService.login(request);
        
        // Trả về đối tượng LoginResponse (JSON có chứa token)
        return ResponseEntity.ok(response);
        
    } catch (BadCredentialsException e) {
        // Trả về String (Chuỗi thông báo lỗi)
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai email hoặc mật khẩu!");
        
    } catch (Exception e) {
        // Trả về String (Chuỗi thông báo lỗi)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi hệ thống: " + e.getMessage());
    }
    }
}