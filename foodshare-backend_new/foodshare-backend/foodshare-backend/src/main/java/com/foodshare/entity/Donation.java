package com.foodshare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Food info ──────────────────────────────────────────
    @Column(nullable = false)
    private String foodName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FoodCategory category;

    @Column(nullable = false)
    private Integer quantity;   // servings

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StorageCondition storage;

    private String address;
    private Double latitude;
    private Double longitude;
    private String notes;
    private String prepTime;      // "HH:mm"
    private String pickupUntil;   // "HH:mm"
    private String freshnessDuration; // e.g. "2 hours"

    // ── AI / freshness ─────────────────────────────────────
    private Integer freshnessScore;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    // ── Status ─────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DonationStatus status;

    // ── Relationships ──────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimed_by_id")
    private User claimedBy;

    // ── Timestamps ─────────────────────────────────────────
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime claimedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = DonationStatus.ACTIVE;
    }

    // ── Enums ──────────────────────────────────────────────
    public enum FoodCategory {
        COOKED_MEALS, BAKERY_ITEMS, VEGETABLES_FRUITS, DAIRY_PRODUCTS, PACKAGED_FOOD;

        public String toDisplayName() {
            return switch (this) {
                case COOKED_MEALS      -> "Cooked Meals";
                case BAKERY_ITEMS      -> "Bakery Items";
                case VEGETABLES_FRUITS -> "Vegetables & Fruits";
                case DAIRY_PRODUCTS    -> "Dairy Products";
                case PACKAGED_FOOD     -> "Packaged Food";
            };
        }
    }

    public enum StorageCondition {
        ROOM_TEMPERATURE, REFRIGERATED, FROZEN
    }

    public enum RiskLevel {
        LOW, MED, HIGH
    }

    public enum DonationStatus {
        ACTIVE, CLAIMED
    }
}
