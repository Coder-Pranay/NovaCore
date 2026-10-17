package com.novacore.storage;

import com.novacore.config.StorageProperties;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.InputStream;

@Service
public class ObjectStorageService {

    private final S3Client s3Client;
    private final StorageProperties storageProperties;

    public ObjectStorageService(S3Client s3Client, StorageProperties storageProperties) {
        this.s3Client = s3Client;
        this.storageProperties = storageProperties;
    }

    public void upload(String storageKey, InputStream inputStream, long contentLength, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(storageProperties.getBucket())
                .key(storageKey)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(inputStream, contentLength));
    }

    public StoredObject download(String storageKey) {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(storageProperties.getBucket())
                    .key(storageKey)
                    .build();

            ResponseInputStream<GetObjectResponse> response = s3Client.getObject(request);
            GetObjectResponse metadata = response.response();
            String contentType = metadata.contentType() != null
                    ? metadata.contentType()
                    : "application/octet-stream";
            Long contentLength = metadata.contentLength() >= 0 ? metadata.contentLength() : null;
            return new StoredObject(response, contentType, contentLength);
        } catch (NoSuchKeyException ex) {
            throw new StorageObjectNotFoundException("Stored file not found", ex);
        } catch (S3Exception ex) {
            if (ex.statusCode() == 404) {
                throw new StorageObjectNotFoundException("Stored file not found", ex);
            }
            throw ex;
        }
    }
}
