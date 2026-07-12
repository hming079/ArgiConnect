package com.agriconnect.common;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

public final class PageUtils {

    private PageUtils() {
    }

    public static <T> Page<T> toPage(List<T> items, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(safePage, safeSize);
        int start = (int) Math.min(pageable.getOffset(), items.size());
        int end = Math.min(start + safeSize, items.size());
        return new PageImpl<>(items.subList(start, end), pageable, items.size());
    }
}
