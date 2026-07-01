package com.agriconnect.user;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.agriconnect.auth.dto.RegisterRequest;
import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.order.Order;
import com.agriconnect.order.OrderRepository;
import com.agriconnect.orderItem.OrderItemRepository;
import com.agriconnect.security.CurrentUser;
import com.agriconnect.user.dto.UserProfileResponse;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUser currentUser;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CropBatchRepository cropBatchRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CurrentUser currentUser,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CropBatchRepository cropBatchRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUser = currentUser;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cropBatchRepository = cropBatchRepository;
    }

    public void register(RegisterRequest request) {
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setStatus(UserStatus.ACTIVE);

        userRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Collection<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(!user.isActive())
                .build();
    }

    public UserProfileResponse getMyProfile() {
        return toProfileResponse(currentUser.get());
    }

    public List<UserProfileResponse> getAllProfiles() {
        return userRepository.findAll().stream()
                .map(this::toProfileResponse)
                .toList();
    }

    public List<UserProfileResponse> getVisibleBuyerProfiles() {
        User user = currentUser.get();
        return switch (user.getRole()) {
            case ADMIN, LOGISTICS -> userRepository.findAll().stream()
                    .filter(candidate -> candidate.getRole() == Role.BUYER)
                    .map(this::toProfileResponse)
                    .toList();
            case BUYER -> List.of(toProfileResponse(user));
            case FARMER -> getBuyerProfilesForFarmer(user.getId());
        };
    }

    private List<UserProfileResponse> getBuyerProfilesForFarmer(Long farmerId) {
        Set<Long> farmerBatchIds = cropBatchRepository.findByFarmerId(farmerId).stream()
                .map(CropBatch::getId)
                .collect(Collectors.toSet());
        if (farmerBatchIds.isEmpty()) {
            return List.of();
        }

        Set<Long> orderIds = orderItemRepository.findAll().stream()
                .filter(item -> farmerBatchIds.contains(item.getBatchId()))
                .map(item -> item.getOrderId())
                .collect(Collectors.toSet());
        if (orderIds.isEmpty()) {
            return List.of();
        }

        Set<Long> buyerIds = orderRepository.findAll().stream()
                .filter(order -> orderIds.contains(order.getId()))
                .map(Order::getBuyerId)
                .collect(Collectors.toSet());

        return userRepository.findAllById(buyerIds).stream()
                .filter(candidate -> candidate.getRole() == Role.BUYER)
                .map(this::toProfileResponse)
                .toList();
    }

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}
