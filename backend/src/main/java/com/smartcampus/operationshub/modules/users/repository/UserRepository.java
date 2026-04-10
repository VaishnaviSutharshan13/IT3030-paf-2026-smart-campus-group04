package com.smartcampus.operationshub.modules.users.repository;

import com.smartcampus.operationshub.modules.users.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findTop5ByOrderByIdDesc();

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByOauthProviderAndOauthSubject(String oauthProvider, String oauthSubject);

        @Query("""
                select distinct u.id
                from User u
                join u.roles r
                where upper(r.code) = upper(:roleCode)
                    and u.active = true
        """)
        List<Long> findActiveUserIdsByRoleCode(@Param("roleCode") String roleCode);

        @Query("""
                select case when count(u) > 0 then true else false end
                from User u
                join u.roles r
                where u.id = :userId
                    and upper(r.code) = upper(:roleCode)
        """)
        boolean existsByIdAndRoleCode(@Param("userId") Long userId, @Param("roleCode") String roleCode);
}
