package com.agriconnect.auth;

import com.agriconnect.auth.dto.LoginRequest;
import com.agriconnect.auth.dto.LoginResponse;
import com.agriconnect.security.JwtService;
import com.agriconnect.user.User;
import com.agriconnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public LoginResponse login(LoginRequest request) {
        
        // 1. Giao cho Spring Security tự lo việc kiểm tra tài khoản & mật khẩu
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Nếu không có lỗi văng ra -> Đăng nhập đúng -> Lấy User từ DB
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không tìm thấy User sau khi xác thực")); 

        // 3. Tạo Token và trả về cho người dùng
        String token = jwtService.generateToken(user);
        
        return new LoginResponse(token);
    }
}