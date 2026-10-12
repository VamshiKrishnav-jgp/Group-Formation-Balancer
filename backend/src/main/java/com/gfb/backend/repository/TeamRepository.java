package com.gfb.backend.repository;

import com.gfb.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    @Transactional
    void deleteByProjectId(Long projectId);
}