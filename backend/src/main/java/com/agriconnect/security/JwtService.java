package com.agriconnect.security;

import com.agriconnect.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // ==========================================
    // 1. MÁY IN THẺ (Tạo Token)
    // ==========================================
    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("role", user.getRole().name())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignKey())
                .compact();
    }

    // ==========================================
    // 2. MÁY ĐỌC THẺ (Giải mã Token)
    // ==========================================
    
    // Lấy Email (Subject) từ trong Token ra
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Kiểm tra xem Token này có phải của User đang truy cập không, và còn hạn không?
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    // Kiểm tra thẻ hết hạn chưa
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Lấy thời gian hết hạn của thẻ
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Hàm tiện ích để trích xuất từng trường dữ liệu (Claim)
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Đưa thẻ vào máy quét, dùng Chữ ký bí mật (Secret Key) để mở khóa
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey()) // (Lưu ý: Nếu bạn dùng jjwt bản 0.11.5, đổi dòng này thành .setSigningKey(getSignKey()) )
                .build()
                .parseClaimsJws(token) // (Lưu ý: bản 0.11.5 là .parseClaimsJws(token).getBody() )
                .getBody(); 
    }

    // Lấy Chữ ký bí mật từ file cấu hình
    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}