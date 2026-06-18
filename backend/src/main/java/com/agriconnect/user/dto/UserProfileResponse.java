package com.agriconnect.user.dto;

import com.agriconnect.user.Role;
import com.agriconnect.user.UserStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private UserStatus status;
}
