package com.novacore.mail;

public interface EmailService {

    void send(String to, String subject, String textBody);
}
