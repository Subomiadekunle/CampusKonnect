package backend;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Routes browser navigations to the bundled frontend app while keeping API paths separate.
 */
@Controller
public class FrontendController {

	@GetMapping({
		"/",
		"/login",
		"/signup",
		"/verify",
		"/account",
		"/messages",
		"/search",
		"/create",
		"/preferences",
		"/modal"
	})
	public String index() {
		return "forward:/index.html";
	}
}
