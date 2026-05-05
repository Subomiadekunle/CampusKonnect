package backend.auth;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Validates {@code Authorization: Bearer &lt;jwt&gt;} for protected routes.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final String BEARER_PREFIX = "Bearer ";

	private final JwtService jwtService;

	public JwtAuthenticationFilter(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
		String path = request.getRequestURI();
		String method = request.getMethod();
		boolean isApiRoute = path.startsWith("/api/");
		boolean isPublicListingsRead = "GET".equalsIgnoreCase(method) && "/api/listings".equals(path);
		return !isApiRoute || isPublicListingsRead;
	}

	@Override
	protected void doFilterInternal(
		@NonNull HttpServletRequest request,
		@NonNull HttpServletResponse response,
		@NonNull FilterChain filterChain
	) throws ServletException, IOException {
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			filterChain.doFilter(request, response);
			return;
		}

		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header == null || !header.startsWith(BEARER_PREFIX)) {
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
			return;
		}

		String token = header.substring(BEARER_PREFIX.length()).trim();
		try {
			String email = jwtService.extractEmail(token);
			UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
				email,
				null,
				List.of(new SimpleGrantedAuthority("ROLE_USER"))
			);
			SecurityContextHolder.getContext().setAuthentication(auth);
			filterChain.doFilter(request, response);
		} catch (Exception e) {
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
		}
	}
}
