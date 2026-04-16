package backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		// Supabase: prefer IPv4 when IPv6 routes are broken (avoids hangs during SSL to the pooler).
		System.setProperty("java.net.preferIPv4Stack", "true");
		System.setProperty("java.net.preferIPv4Addresses", "true");
		SpringApplication.run(Application.class, args);
	}

}
