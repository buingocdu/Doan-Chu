package com.gameword.repository;

import com.gameword.model.RoomMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomMatchRepository extends JpaRepository<RoomMatch, Long> {
}
