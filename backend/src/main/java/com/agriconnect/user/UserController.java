package com.agriconnect.user;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.agriconnect.auth.dto.RegisterRequest;
import com.agriconnect.user.dto.UserProfileResponse;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(){
        UserProfileResponse profile = userService.getMyProfile();
        return ResponseEntity.ok(profile);
    }

}
