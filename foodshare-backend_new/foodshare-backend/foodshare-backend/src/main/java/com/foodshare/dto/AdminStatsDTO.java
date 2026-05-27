package com.foodshare.dto;

import lombok.*;

import java.util.List;

@Getter @Setter @Builder
public class AdminStatsDTO {
    private long totalMeals;
    private double co2Saved;
    private long totalListings;
    private long completedListings;
    private long activeListings;
    private List<UserSummary> users;
    private List<DonationDTOs.DonationResponse> allDonations;

    @Getter @Setter @Builder
    public static class UserSummary {
        private String username;
        private String fullName;
        private String role;
        private long activityCount;
        private String activityLabel;
    }
}
