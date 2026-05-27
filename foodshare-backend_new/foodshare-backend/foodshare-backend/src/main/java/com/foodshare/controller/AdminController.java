package com.foodshare.controller;

import com.foodshare.dto.AdminStatsDTO;
import com.foodshare.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminStatsDTO> dashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }
}
