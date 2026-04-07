package com.smartcampus.operationshub.modules.users.repository;

import com.smartcampus.operationshub.modules.users.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByOauthProviderAndOauthSubject(String oauthProvider, String oauthSubject);
}
