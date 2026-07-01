package com.agriconnect.user;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.agriconnect.user.dto.UserProfileResponse;

@RestController
@RequestMapping("/api/users")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> getMyProfile(){
        UserProfileResponse profile = userService.getMyProfile();
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/visible-buyers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserProfileResponse>> getVisibleBuyerProfiles() {
        return ResponseEntity.ok(userService.getVisibleBuyerProfiles());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileResponse>> getAllProfiles() {
        return ResponseEntity.ok(userService.getAllProfiles());
    }

}
