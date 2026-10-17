package com.novacore.mail;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory email capture for integration tests (no SMTP required).
 */
@Service
@Primary
@Profile("test")
public class CapturingEmailService implements EmailService {

    private final List<SentMail> sent = new CopyOnWriteArrayList<>();

    @Override
    public void send(String to, String subject, String textBody) {
        sent.add(new SentMail(to, subject, textBody));
    }

    public List<SentMail> getSent() {
        return Collections.unmodifiableList(new ArrayList<>(sent));
    }

    public void clear() {
        sent.clear();
    }

    public record SentMail(String to, String subject, String textBody) {
    }
}
