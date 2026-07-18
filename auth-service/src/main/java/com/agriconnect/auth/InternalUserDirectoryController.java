package com.agriconnect.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
class InternalUserDirectoryController {
    private final UserStore users;
    private final byte[] internalKey;

    InternalUserDirectoryController(UserStore users, @Value("${internal.api-key}") String internalKey) {
        this.users = users;
        this.internalKey = internalKey.getBytes(StandardCharsets.UTF_8);
    }

    @PostMapping("/internal/users/names")
    Map<Long, String> names(@RequestHeader("X-Internal-Api-Key") String suppliedKey,
                            @RequestBody List<Long> userIds) {
        if (!MessageDigest.isEqual(internalKey, suppliedKey.getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid internal API key");
        }
        return users.namesByIds(userIds);
    }
}
