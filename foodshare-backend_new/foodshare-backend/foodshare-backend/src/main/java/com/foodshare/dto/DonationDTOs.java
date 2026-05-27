package com.foodshare.dto;

import com.foodshare.entity.Donation;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

public class DonationDTOs {

    @Getter @Setter
    public static class CreateRequest {
        @NotBlank(message = "Food name is required")
        private String foodName;

        @NotNull(message = "Category is required")
        private Donation.FoodCategory category;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        @NotNull(message = "Storage condition is required")
        private Donation.StorageCondition storage;

        @NotBlank(message = "Address is required")
        private String address;
        
        private Double latitude;
        private Double longitude;

        private String notes;
        private String prepTime;
        private String pickupUntil;
        private String freshnessDuration;
    }

    @Getter @Setter @Builder
    public static class DonationResponse {
        private Long id;
        private String foodName;
        private String category;
        private Integer quantity;
        private String storage;
        private String address;
        private Double latitude;
        private Double longitude;
        private String notes;
        private String prepTime;
        private String pickupUntil;
        private String freshnessDuration;
        private Integer freshnessScore;
        private String riskLevel;
        private String riskLabel;
        private String riskHours;
        private String riskRecommendation;
        private String status;
        private String donorUsername;
        private String donorFullName;
        private String donorPhoneNumber;
        private String claimedByUsername;
        private LocalDateTime createdAt;
        private LocalDateTime claimedAt;
    }
}
