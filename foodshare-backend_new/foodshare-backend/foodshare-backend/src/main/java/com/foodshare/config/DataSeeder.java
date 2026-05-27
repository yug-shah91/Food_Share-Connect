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

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .username("yash")
                    .fullName("Yash Veer Singh")
                    .password(passwordEncoder.encode("yash123"))
                    .phoneNumber("+91 9876543210")
                    .role(User.Role.DONOR)
                    .build());

            userRepository.save(User.builder()
                    .username("yug")
                    .fullName("Yug Shah")
                    .password(passwordEncoder.encode("yug123"))
                    .phoneNumber("+91 8765432109")
                    .role(User.Role.RECIPIENT)
                    .build());

            userRepository.save(User.builder()
                    .username("yatharth")
                    .fullName("Yatharth Gupta")
                    .password(passwordEncoder.encode("yatharth123"))
                    .phoneNumber("+91 7654321098")
                    .role(User.Role.ADMIN)
                    .build());

            log.info("✅  Demo users seeded: yash (donor), yug (recipient), yatharth (admin)");
        }
    }
}
