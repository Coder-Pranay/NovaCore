package com.novacore.assets;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.assets.dto.ImageGenStatusResponse;
import com.novacore.assets.exception.ImageGenerationException;
import com.novacore.config.ImageGenProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

@Component
@EnableConfigurationProperties(ImageGenProperties.class)
public class ImageGenerationClient {

    private final RestClient restClient;
    private final RestClient healthClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;

    public ImageGenerationClient(ImageGenProperties properties, ObjectMapper objectMapper) {
        this.baseUrl = trimSlash(properties.getUrl());
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(properties.getConnectTimeoutMs()));
        factory.setReadTimeout(Duration.ofMillis(properties.getReadTimeoutMs()));
        this.restClient = RestClient.builder()
                .baseUrl(this.baseUrl)
                .requestFactory(factory)
                .build();
        SimpleClientHttpRequestFactory healthFactory = new SimpleClientHttpRequestFactory();
        healthFactory.setConnectTimeout(Duration.ofSeconds(2));
        healthFactory.setReadTimeout(Duration.ofSeconds(4));
        this.healthClient = RestClient.builder()
                .baseUrl(this.baseUrl)
                .requestFactory(healthFactory)
                .build();
        this.objectMapper = objectMapper;
    }

    public ImageGenStatusResponse status() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = healthClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(Map.class);
            if (body == null) {
                return unavailable("Image generator returned an empty health response");
            }
            boolean ready = Boolean.TRUE.equals(body.get("ready"));
            boolean busy = Boolean.TRUE.equals(body.get("busy"));
            int step = intValue(body.get("step"));
            int steps = intValue(body.get("steps"));
            int percent = intValue(body.get("percent"));
            Integer etaSeconds = integerOrNull(
                    body.get("etaSeconds") != null ? body.get("etaSeconds") : body.get("eta_seconds"));
            String provider = stringValue(body.get("provider"));
            String message;
            if (ready && busy) {
                String eta = etaSeconds != null && etaSeconds > 0
                        ? " About " + Math.max(1, (int) Math.ceil(etaSeconds / 60.0)) + " min left."
                        : "";
                message = "Generating " + percent + "% (" + step + "/" + steps + ")." + eta
                        + " Keep this tab open.";
            } else if (ready && "sd-cpu".equals(provider)) {
                message = "Photorealistic CPU generator is ready (no NVIDIA). Same prompt produces the same image. A detailed photo can take several minutes.";
            } else if (ready) {
                message = "Moss photographic LoRA is ready on your NVIDIA GPU.";
            } else {
                String error = stringValue(body.get("error"));
                message = error != null && !error.isBlank()
                        ? error
                        : "Worker is up. First generate will download and load the model.";
            }
            return new ImageGenStatusResponse(
                    true,
                    ready,
                    busy,
                    step,
                    steps,
                    percent,
                    etaSeconds,
                    stringValue(body.get("device")),
                    stringValue(body.get("model")),
                    stringValue(body.get("lora")),
                    message);
        } catch (ResourceAccessException ex) {
            return unavailable(
                    "Image generator is not running. Start image-gen on " + baseUrl);
        } catch (RuntimeException ex) {
            return unavailable("Image generator is unreachable: " + ex.getMessage());
        }
    }

    public byte[] generate(String prompt, boolean adultConfirmed, MultipartFile referenceImage) {
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("prompt", prompt);
        form.add("adult_confirmed", adultConfirmed ? "true" : "false");
        form.add("steps", "30");
        form.add("guidance", "3.0");
        form.add("width", "1024");
        form.add("height", "1024");

        if (referenceImage != null && !referenceImage.isEmpty()) {
            try {
                String filename = referenceImage.getOriginalFilename();
                if (filename == null || filename.isBlank()) {
                    filename = "reference.jpg";
                }
                form.add("image", new NamedByteArrayResource(referenceImage.getBytes(), filename));
            } catch (IOException ex) {
                throw new ImageGenerationException("Failed to read reference photo", HttpStatus.BAD_REQUEST, ex);
            }
        }

        try {
            byte[] png = restClient.post()
                    .uri("/v1/generate")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .body(byte[].class);
            if (png == null || png.length == 0) {
                throw new ImageGenerationException("Generator returned an empty image", HttpStatus.BAD_GATEWAY);
            }
            return png;
        } catch (ResourceAccessException ex) {
            throw new ImageGenerationException(
                    "Image generator is not running. Start image-gen on " + baseUrl,
                    HttpStatus.SERVICE_UNAVAILABLE,
                    ex);
        } catch (RestClientResponseException ex) {
            throw new ImageGenerationException(
                    extractDetail(ex),
                    HttpStatus.resolve(ex.getStatusCode().value()) != null
                            ? HttpStatus.valueOf(ex.getStatusCode().value())
                            : HttpStatus.BAD_GATEWAY);
        }
    }

    private ImageGenStatusResponse unavailable(String message) {
        return new ImageGenStatusResponse(false, false, false, 0, 0, 0, null, "unknown", null, null, message);
    }

    private String extractDetail(RestClientResponseException ex) {
        String raw = ex.getResponseBodyAsString();
        try {
            JsonNode node = objectMapper.readTree(raw);
            JsonNode detail = node.path("detail");
            if (detail.isTextual() && !detail.asText().isBlank()) {
                return detail.asText();
            }
        } catch (Exception ignored) {
            // fall through
        }
        if (raw != null && !raw.isBlank() && raw.length() < 400) {
            return raw;
        }
        return "Image generation failed";
    }

    private static String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static int intValue(Object value) {
        Integer parsed = integerOrNull(value);
        return parsed == null ? 0 : parsed;
    }

    private static Integer integerOrNull(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String trimSlash(String url) {
        if (url == null || url.isBlank()) {
            return "http://127.0.0.1:8090";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private static final class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        private NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
