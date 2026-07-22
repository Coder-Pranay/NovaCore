package com.novacore.dashboard.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StorageSizeFormatterTest {

    @Test
    void formatBytes_formatsCommonUnits() {
        assertThat(StorageSizeFormatter.formatBytes(0)).isEqualTo("0 B");
        assertThat(StorageSizeFormatter.formatBytes(512)).isEqualTo("512 B");
        assertThat(StorageSizeFormatter.formatBytes(1024)).isEqualTo("1.00 KB");
        assertThat(StorageSizeFormatter.formatBytes(1536)).isEqualTo("1.50 KB");
        assertThat(StorageSizeFormatter.formatBytes(5_242_880)).isEqualTo("5.00 MB");
    }
}
