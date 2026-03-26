package backend.auth;

import org.springframework.stereotype.Service;

//this service willl handle the verification by sending emails with link to users.
@Service
public class VerificationService {


    public String generateCode() {
        // Generate a random verification code
        return "123456";
    }

    public void sendVerificationCode(String email, String code) {
        // Send the verification code to the user's email
        System.out.println("Sending verification code " + code + " to " + email);
    }


    public boolean verifyCode(String email, String code) {
        // Verify the code for the given email
        // Check this against a database or cache
        return "123456".equals(code);
    }

    public void validateSchoolEmail(String email) {
        if (!email.endsWith("@slu.edu")) {
            throw new RuntimeException("Email must be a SLU email address");
        }
    }
}
