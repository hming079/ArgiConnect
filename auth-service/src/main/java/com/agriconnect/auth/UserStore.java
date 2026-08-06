package com.agriconnect.auth;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserStore {
    private final JdbcClient db;

    public UserStore(JdbcClient db) {
        this.db = db;
    }

    private UserRecord map(ResultSet r, int n) throws SQLException {
        return new UserRecord(r.getLong("id"), r.getString("full_name"), r.getString("email"),
                r.getString("password_hash"), r.getString("phone"), r.getString("role"), r.getString("status"));
    }

    public Optional<UserRecord> byEmail(String email) {
        return db.sql("select * from users where lower(email)=lower(:email)").param("email", email).query(this::map)
                .optional();
    }

    public Optional<UserRecord> byId(long id) {
        return db.sql("select * from users where id=:id").param("id", id).query(this::map).optional();
    }

    public List<UserRecord> all() {
        return db.sql("select * from users order by id").query(this::map).list();
    }

    public long create(String name, String email, String hash, String phone, String role) {
        return db.sql(
                "insert into users(full_name,email,password_hash,phone,role,status) values(:n,:e,:p,:ph,:r,'ACTIVE') returning id")
                .param("n", name).param("e", email).param("p", hash).param("ph", phone).param("r", role)
                .query(Long.class).single();
    }

    public void status(long id, String status) {
        db.sql("update users set status=:s,updated_at=current_timestamp where id=:id").param("s", status)
                .param("id", id).update();
    }

    public java.util.Map<Long, String> namesByIds(java.util.List<Long> ids) {
        if (ids == null || ids.isEmpty())
            return java.util.Map.of();
        return db.sql("select id,full_name from users where id in (:ids)").param("ids", ids)
                .query((r, n) -> java.util.Map.entry(r.getLong("id"), r.getString("full_name"))).list().stream()
                .collect(java.util.stream.Collectors.toMap(java.util.Map.Entry::getKey, java.util.Map.Entry::getValue));
    }
}
