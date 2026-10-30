package com.gameword.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

// relation: NONE / FRIEND / INCOMING (ho moi minh) / OUTGOING (minh da moi)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearchResult {
    private Long userId;
    private String username;
    private String relation;
}
