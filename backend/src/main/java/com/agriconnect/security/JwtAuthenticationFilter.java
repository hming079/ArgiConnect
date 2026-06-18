package com.agriconnect.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
// import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService; // Sổ danh bạ của Spring

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Lấy thẻ từ túi khách hàng (Lấy Header có tên "Authorization")
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Nếu khách không có thẻ, hoặc thẻ không bắt đầu bằng chữ "Bearer " -> Bỏ qua, cho đi tiếp 
        // (Sẽ bị chặn lại ở cửa các phòng ban cần bảo mật sau)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Tịch thu thẻ và cắt bỏ chữ "Bearer " để lấy đúng mã số Token
        jwt = authHeader.substring(7);

        // 4. Bỏ Token vào máy quét để đọc xem thẻ này của ai (Lấy Email)
        userEmail = jwtService.extractUsername(jwt);

        // 5. Nếu đọc được Email và người này chưa được hệ thống ghi nhận là đã đăng nhập
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Mở sổ danh bạ ra tìm thông tin chi tiết của người này
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // Bỏ Token vào máy quét lần nữa để kiểm tra xem thẻ còn hạn không, chữ ký có bị làm giả không
            if (jwtService.isTokenValid(jwt, userDetails)) {
                
                // Thẻ xịn! Cấp cho một cái "giấy thông hành" nội bộ của Spring Security
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // Đóng dấu: "Đã kiểm duyệt an toàn", lưu vào hệ thống
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        // 6. Mở cổng cho khách đi tiếp vào bên trong (vào các Controller)
        filterChain.doFilter(request, response);
    }
}