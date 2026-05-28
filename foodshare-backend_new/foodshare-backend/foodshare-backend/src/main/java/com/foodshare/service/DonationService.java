package com.foodshare.service;

import com.foodshare.dto.DonationDTOs;
import com.foodshare.entity.Donation;
import com.foodshare.entity.User;
import com.foodshare.repository.DonationRepository;
import com.foodshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final FreshnessService freshnessService;
    private final NotificationService notificationService;

    // ── Create ─────────────────────────────────────────────────────────────

    @Transactional
    public DonationDTOs.DonationResponse createDonation(DonationDTOs.CreateRequest request,
                                                         String donorUsername) {
        User donor = findUser(donorUsername);

        int score    = freshnessService.calculateScore(request.getCategory(), request.getStorage());
        Donation.RiskLevel risk = freshnessService.riskLevel(score);

        Donation donation = Donation.builder()
                .foodName(request.getFoodName().trim())
                .category(request.getCategory())
                .quantity(request.getQuantity())
                .storage(request.getStorage())
                .address(request.getAddress().trim())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .notes(request.getNotes())
                .prepTime(request.getPrepTime())
                .pickupUntil(request.getPickupUntil())
                .freshnessDuration(request.getFreshnessDuration())
                .freshnessScore(score)
                .riskLevel(risk)
                .status(Donation.DonationStatus.ACTIVE)
                .donor(donor)
                .build();

        Donation savedDonation = donationRepository.save(donation);
        notificationService.notifyRole(User.Role.RECIPIENT, "New food listed: " + savedDonation.getFoodName());

        return toResponse(savedDonation);
    }

    // ── Read ───────────────────────────────────────────────────────────────

    public List<DonationDTOs.DonationResponse> getActiveListings() {
        return donationRepository
                .findByStatusOrderByCreatedAtDesc(Donation.DonationStatus.ACTIVE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DonationDTOs.DonationResponse getById(Long id) {
        return toResponse(findDonation(id));
    }

    public List<DonationDTOs.DonationResponse> getMyDonations(String donorUsername) {
        User donor = findUser(donorUsername);
        return donationRepository.findByDonorOrderByCreatedAtDesc(donor)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DonationDTOs.DonationResponse> getMyClaims(String recipientUsername) {
        User recipient = findUser(recipientUsername);
        return donationRepository.findByClaimedByOrderByClaimedAtDesc(recipient)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Claim ──────────────────────────────────────────────────────────────

    @Transactional
    public DonationDTOs.DonationResponse claimDonation(Long donationId,
                                                        String recipientUsername) {
        Donation donation = findDonation(donationId);
        User recipient    = findUser(recipientUsername);

        if (donation.getStatus() != Donation.DonationStatus.ACTIVE) {
            throw new IllegalStateException("This donation has already been claimed");
        }
        if (donation.getDonor().getUsername().equals(recipientUsername)) {
            throw new AccessDeniedException("Donors cannot claim their own donations");
        }

        donation.setStatus(Donation.DonationStatus.CLAIMED);
        donation.setClaimedBy(recipient);
        donation.setClaimedAt(LocalDateTime.now());

        Donation savedDonation = donationRepository.save(donation);
        notificationService.notifyUser(donation.getDonor(), "Your donation '" + donation.getFoodName() + "' was claimed by " + recipient.getFullName());

        return toResponse(savedDonation);
    }

    // ── Admin & Scheduled ───────────────────────────────────────────────────

    public List<DonationDTOs.DonationResponse> getAllDonations() {
        return donationRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteDonation(Long id) {
        if (donationRepository.existsById(id)) {
            donationRepository.deleteById(id);
        } else {
            throw new RuntimeException("Donation not found: " + id);
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *") // Runs every hour
    @Transactional
    public void cleanUpExpiredDonations() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<Donation> expiredDonations = donationRepository.findAll().stream()
                .filter(d -> d.getCreatedAt().isBefore(threshold) && d.getStatus() == Donation.DonationStatus.ACTIVE)
                .collect(Collectors.toList());
        donationRepository.deleteAll(expiredDonations);
    }

    // ── Mapper ─────────────────────────────────────────────────────────────

    private DonationDTOs.DonationResponse toResponse(Donation d) {
        Donation.RiskLevel risk = d.getRiskLevel();

        return DonationDTOs.DonationResponse.builder()
                .id(d.getId())
                .foodName(d.getFoodName())
                .category(d.getCategory().toDisplayName())
                .quantity(d.getQuantity())
                .storage(d.getStorage().name())
                .address(d.getAddress())
                .latitude(d.getLatitude())
                .longitude(d.getLongitude())
                .notes(d.getNotes())
                .prepTime(d.getPrepTime())
                .pickupUntil(d.getPickupUntil())
                .freshnessDuration(d.getFreshnessDuration())
                .freshnessScore(d.getFreshnessScore())
                .riskLevel(risk != null ? risk.name().toLowerCase() : null)
                .riskLabel(risk != null ? freshnessService.riskLabel(risk) : null)
                .riskHours(risk != null ? freshnessService.safeWindow(risk) : null)
                .riskRecommendation(risk != null ? freshnessService.recommendation(risk) : null)
                .status(d.getStatus().name())
                .donorUsername(d.getDonor().getUsername())
                .donorFullName(d.getDonor().getFullName())
                .donorPhoneNumber(d.getDonor().getPhoneNumber())
                .claimedByUsername(d.getClaimedBy() != null
                        ? d.getClaimedBy().getUsername() : null)
                .createdAt(d.getCreatedAt())
                .claimedAt(d.getClaimedAt())
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private Donation findDonation(Long id) {
        return donationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found: " + id));
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }
}
