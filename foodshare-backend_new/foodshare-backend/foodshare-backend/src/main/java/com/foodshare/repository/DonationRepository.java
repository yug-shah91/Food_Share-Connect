package com.foodshare.repository;

import com.foodshare.entity.Donation;
import com.foodshare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {

    List<Donation> findByDonorOrderByCreatedAtDesc(User donor);

    List<Donation> findByClaimedByOrderByClaimedAtDesc(User claimedBy);

    List<Donation> findByStatusOrderByCreatedAtDesc(Donation.DonationStatus status);

    long countByStatus(Donation.DonationStatus status);

    long countByDonor(User donor);

    long countByClaimedBy(User claimedBy);

    @Query("SELECT COALESCE(SUM(d.quantity), 0) FROM Donation d")
    long sumAllQuantities();

    @Query("SELECT COALESCE(SUM(d.quantity), 0) FROM Donation d WHERE d.donor = :donor")
    long sumQuantitiesByDonor(User donor);

    @Query("SELECT COALESCE(SUM(d.quantity), 0) FROM Donation d WHERE d.claimedBy = :recipient")
    long sumQuantitiesByRecipient(User recipient);
}
