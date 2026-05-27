package com.foodshare.service;

import com.foodshare.dto.AuthDTOs;
import com.foodshare.entity.User;
import com.foodshare.repository.UserRepository;
import com.foodshare.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername().trim().toLowerCase(),
                        request.getPassword()));

        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found after auth"));

        String token = jwtUtils.generateToken(username);

        return AuthDTOs.LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name().toLowerCase())
                .build();
    }

    public AuthDTOs.LoginResponse register(AuthDTOs.RegisterRequest request) {
        String username = request.getUsername().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken");
        }

        User user = User.builder()
                .username(username)
                .fullName(request.getFullName().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .securityId(request.getSecurityId())
                .build();

        userRepository.save(user);

        String token = jwtUtils.generateToken(username);
        return AuthDTOs.LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name().toLowerCase())
                .build();
    }
}
