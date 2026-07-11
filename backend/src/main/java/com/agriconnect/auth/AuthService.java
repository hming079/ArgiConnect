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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import com.agriconnect.auth.dto.ChangePasswordRequest;
import com.agriconnect.auth.dto.ForgotPasswordResponse;
import com.agriconnect.auth.dto.ResetPasswordRequest;
import com.agriconnect.common.BadRequestException;
import com.agriconnect.security.CurrentUser;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUser currentUser;
    private final PasswordResetTokenRepository resetTokenRepository;

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

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = currentUser.get();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        resetTokenRepository.deleteByUserId(user.getId());
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(String rawEmail) {
        String message = "If the email exists, a password reset link has been created";
        return userRepository.findByEmail(rawEmail.trim().toLowerCase()).map(user -> {
            resetTokenRepository.deleteByUserId(user.getId());
            byte[] bytes = new byte[32];
            new SecureRandom().nextBytes(bytes);
            String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(hash(rawToken));
            token.setExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
            resetTokenRepository.save(token);
            // Returned for the current local/demo deployment. In production, deliver this token by email.
            return new ForgotPasswordResponse(message, rawToken);
        }).orElseGet(() -> new ForgotPasswordResponse(message, null));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = resetTokenRepository.findByTokenHash(hash(request.token()))
                .orElseThrow(() -> new BadRequestException("Reset link is invalid or expired"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Reset link is invalid or expired");
        }
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        token.setUsedAt(Instant.now());
        resetTokenRepository.save(token);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}
