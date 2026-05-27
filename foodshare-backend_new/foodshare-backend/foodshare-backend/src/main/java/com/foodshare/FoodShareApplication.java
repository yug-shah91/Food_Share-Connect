package com.foodshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FoodShareApplication {
    public static void main(String[] args) {
        SpringApplication.run(FoodShareApplication.class, args);
    }
}
