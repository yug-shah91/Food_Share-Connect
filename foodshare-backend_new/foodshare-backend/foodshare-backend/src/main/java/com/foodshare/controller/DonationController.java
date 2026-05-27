package com.foodshare.controller;

import com.foodshare.dto.DonationDTOs;
import com.foodshare.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @GetMapping
    public ResponseEntity<List<DonationDTOs.DonationResponse>> getActiveListings() {
        return ResponseEntity.ok(donationService.getActiveListings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonationDTOs.DonationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(donationService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<DonationDTOs.DonationResponse> create(
            @Valid @RequestBody DonationDTOs.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        DonationDTOs.DonationResponse response =
                donationService.createDonation(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<List<DonationDTOs.DonationResponse>> myDonations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(donationService.getMyDonations(userDetails.getUsername()));
    }


    @PostMapping("/{id}/claim")
    @PreAuthorize("hasRole('RECIPIENT')")
    public ResponseEntity<DonationDTOs.DonationResponse> claim(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                donationService.claimDonation(id, userDetails.getUsername()));
    }

    @GetMapping("/claimed")
    @PreAuthorize("hasRole('RECIPIENT')")
    public ResponseEntity<List<DonationDTOs.DonationResponse>> myClaims(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(donationService.getMyClaims(userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDonation(@PathVariable Long id) {
        donationService.deleteDonation(id);
        return ResponseEntity.noContent().build();
    }
}
