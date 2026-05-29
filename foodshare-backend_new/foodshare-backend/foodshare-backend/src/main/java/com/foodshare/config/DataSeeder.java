package com.foodshare.config;

import com.foodshare.entity.User;
import com.foodshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private void seedUser(String username, String fullName, String password, String phoneNumber, User.Role role) {
        if (!userRepository.existsByUsername(username)) {
            userRepository.save(User.builder()
                    .username(username)
                    .fullName(fullName)
                    .password(passwordEncoder.encode(password))
                    .phoneNumber(phoneNumber)
                    .role(role)
                    .build());
            log.info("✅ Seeded demo user: {} ({})", username, role);
        }
    }

    @Override
    public void run(String... args) {
        // Clean up legacy status values in database
        try {
            int updated = jdbcTemplate.update("UPDATE donations SET status = 'CLAIMED' WHERE status = 'COMPLETED'");
            if (updated > 0) {
                log.info("✅ Migrated {} legacy 'COMPLETED' donations to 'CLAIMED'", updated);
            }
        } catch (Exception e) {
            log.error("Failed to migrate legacy 'COMPLETED' donations: {}", e.getMessage());
        }

        seedUser("yash", "Yash Veer Singh", "yash123", "+91 9876543210", User.Role.DONOR);
        seedUser("yug", "Yug Shah", "yug123", "+91 8765432109", User.Role.RECIPIENT);
        seedUser("yatharth", "Yatharth Gupta", "yatharth123", "+91 7654321098", User.Role.ADMIN);
    }
}
