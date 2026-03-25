package backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "campus_users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// `nullable = false` makes name required
	@Column(nullable = false)
	private String name;

	// Email is required, must be unique
	@Column(nullable = false, unique = true)
	private String email;

	// Password is required so the account can be authenticated later.
	@Column(nullable = false)
	private String password;

	// Store whether the account has completed email verification.
	@Column(nullable = false)
	private boolean isVerified = false;

	protected User() {
	}

	public User(String name, String email) {
		this.name = name;
		this.email = email;
		this.isVerified = false;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public boolean isVerified() {
		return isVerified;
	}

	public void setVerified(boolean verified) {
		isVerified = verified;
	}
}
