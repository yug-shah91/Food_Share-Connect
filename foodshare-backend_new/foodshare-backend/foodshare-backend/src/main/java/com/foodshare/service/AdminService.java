package com.foodshare.service;

import com.foodshare.dto.AdminStatsDTO;
import com.foodshare.dto.DonationDTOs;
import com.foodshare.entity.Donation;
import com.foodshare.entity.User;
import com.foodshare.repository.DonationRepository;
import com.foodshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DonationRepository donationRepository;
    private final DonationService donationService;

    public AdminStatsDTO getDashboard() {
        long totalMeals     = donationRepository.sumAllQuantities();
        long totalListings  = donationRepository.count();
        long completed      = donationRepository.countByStatus(Donation.DonationStatus.CLAIMED);
        long active         = donationRepository.countByStatus(Donation.DonationStatus.ACTIVE);
        double co2Saved     = totalMeals * 0.26;

        List<AdminStatsDTO.UserSummary> userSummaries = userRepository.findAll().stream()
                .map(u -> buildUserSummary(u))
                .collect(Collectors.toList());

        List<DonationDTOs.DonationResponse> allDonations = donationService.getAllDonations();

        return AdminStatsDTO.builder()
                .totalMeals(totalMeals)
                .co2Saved(Math.round(co2Saved * 10.0) / 10.0)
                .totalListings(totalListings)
                .completedListings(completed)
                .activeListings(active)
                .users(userSummaries)
                .allDonations(allDonations)
                .build();
    }

    private AdminStatsDTO.UserSummary buildUserSummary(User u) {
        long count;
        String label;

        switch (u.getRole()) {
            case DONOR -> {
                count = donationRepository.countByDonor(u);
                label = count + " donation" + (count != 1 ? "s" : "");
            }
            case RECIPIENT -> {
                count = donationRepository.countByClaimedBy(u);
                label = count + " claim" + (count != 1 ? "s" : "");
            }
            default -> {
                count = 0;
                label = "Monitoring";
            }
        }

        return AdminStatsDTO.UserSummary.builder()
                .username(u.getUsername())
                .fullName(u.getFullName())
                .role(u.getRole().name().toLowerCase())
                .activityCount(count)
                .activityLabel(label)
                .build();
    }
}
