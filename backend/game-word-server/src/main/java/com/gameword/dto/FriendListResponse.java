package com.gameword.dto;

import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendListResponse {
    private List<FriendDto> friends;
    private List<FriendDto> incoming;
    private List<FriendDto> outgoing;
}
