package com.smartcampus.operationshub.security.oauth2;

import com.smartcampus.operationshub.modules.auth.service.OAuth2UserProvisioningService;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.security.jwt.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final OAuth2UserProvisioningService provisioningService;
    private final JwtService jwtService;
    private final String frontendSuccessUrl;

    public OAuth2AuthenticationSuccessHandler(
            OAuth2UserProvisioningService provisioningService,
            JwtService jwtService,
            @Value("${app.oauth2.frontend-success-url}") String frontendSuccessUrl
    ) {
        this.provisioningService = provisioningService;
        this.jwtService = jwtService;
        this.frontendSuccessUrl = frontendSuccessUrl;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        User user = provisioningService.provisionGoogleUser(oauth2User.getAttributes());

        AppUserPrincipal principal = new AppUserPrincipal(user);
        String token = jwtService.generateToken(principal);
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);

        response.sendRedirect(frontendSuccessUrl + "?token=" + encodedToken);
    }
}
