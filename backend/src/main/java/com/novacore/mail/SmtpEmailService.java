package com.novacore.mail;

import com.novacore.auth.AuthProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Profile("!test")
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;
    private final AuthProperties authProperties;

    public SmtpEmailService(JavaMailSender mailSender, AuthProperties authProperties) {
        this.mailSender = mailSender;
        this.authProperties = authProperties;
    }

    @Override
    public void send(String to, String subject, String textBody) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(authProperties.getMailFrom());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(textBody);
        mailSender.send(message);
        log.info("Sent email subject='{}' to={}", subject, to);
    }
}
