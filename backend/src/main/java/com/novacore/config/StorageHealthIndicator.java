package com.novacore.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Component("storage")
public class StorageHealthIndicator implements HealthIndicator {

    private final S3Client s3Client;
    private final StorageProperties storageProperties;

    public StorageHealthIndicator(S3Client s3Client, StorageProperties storageProperties) {
        this.s3Client = s3Client;
        this.storageProperties = storageProperties;
    }

    @Override
    public Health health() {
        String bucket = storageProperties.getBucket();

        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            return Health.up()
                    .withDetail("bucket", bucket)
                    .withDetail("endpoint", storageProperties.getEndpoint())
                    .build();
        } catch (NoSuchBucketException ex) {
            return Health.down(ex)
                    .withDetail("bucket", bucket)
                    .withDetail("reason", "Bucket does not exist")
                    .build();
        } catch (S3Exception ex) {
            return Health.down(ex)
                    .withDetail("bucket", bucket)
                    .withDetail("statusCode", ex.statusCode())
                    .build();
        } catch (Exception ex) {
            return Health.down(ex)
                    .withDetail("bucket", bucket)
                    .build();
        }
    }
}
