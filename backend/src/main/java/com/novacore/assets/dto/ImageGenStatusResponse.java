package com.novacore.assets.dto;

public record ImageGenStatusResponse(
        boolean available,
        boolean ready,
        boolean busy,
        int step,
        int steps,
        int percent,
        Integer etaSeconds,
        String device,
        String model,
        String lora,
        String message
) {
}
