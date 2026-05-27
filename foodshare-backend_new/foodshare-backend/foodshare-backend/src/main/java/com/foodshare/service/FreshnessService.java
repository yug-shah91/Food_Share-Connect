package com.foodshare.service;

import com.foodshare.entity.Donation;
import org.springframework.stereotype.Service;

import java.util.Random;

/**
 * Mirrors the calcFreshnessScore() logic from app.js, server-side.
 * Category base scores + storage bonuses + small random variance.
 */
@Service
public class FreshnessService {

    private final Random random = new Random();

    public int calculateScore(Donation.FoodCategory category,
                              Donation.StorageCondition storage) {
        int base = switch (category) {
            case COOKED_MEALS      -> 68;
            case BAKERY_ITEMS      -> 84;
            case VEGETABLES_FRUITS -> 76;
            case DAIRY_PRODUCTS    -> 58;
            case PACKAGED_FOOD     -> 94;
        };

        int bonus = switch (storage) {
            case REFRIGERATED      -> 12;
            case FROZEN            -> 18;
            case ROOM_TEMPERATURE  -> 0;
        };

        int variance = random.nextInt(7) - 3;   // -3 … +3
        return Math.min(99, Math.max(20, base + bonus + variance));
    }

    public Donation.RiskLevel riskLevel(int score) {
        if (score >= 75) return Donation.RiskLevel.LOW;
        if (score >= 50) return Donation.RiskLevel.MED;
        return Donation.RiskLevel.HIGH;
    }

    public String riskLabel(Donation.RiskLevel risk) {
        return switch (risk) {
            case LOW  -> "Low Risk";
            case MED  -> "Medium Risk";
            case HIGH -> "High Risk";
        };
    }

    public String safeWindow(Donation.RiskLevel risk) {
        return switch (risk) {
            case LOW  -> "~6–8 hours";
            case MED  -> "~2–4 hours";
            case HIGH -> "< 2 hours";
        };
    }

    public String recommendation(Donation.RiskLevel risk) {
        return switch (risk) {
            case LOW  -> "Pickup within 4h";
            case MED  -> "Pickup ASAP";
            case HIGH -> "Urgent pickup needed";
        };
    }
}
