package com.foodshare.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

public class NotificationDTOs {

    @Getter @Setter @Builder
    public static class NotificationResponse {
        private Long id;
        private String message;
        private boolean isRead;
        private LocalDateTime createdAt;
    }
}
