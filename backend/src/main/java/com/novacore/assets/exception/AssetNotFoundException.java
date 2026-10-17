package com.novacore.assets.exception;

/**
 * Raised when an asset cannot be found for the authenticated owner.
 */
public class AssetNotFoundException extends RuntimeException {

    public AssetNotFoundException() {
        super("Asset not found");
    }

    public AssetNotFoundException(String message) {
        super(message);
    }
}
