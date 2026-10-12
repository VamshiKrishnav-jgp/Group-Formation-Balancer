package com.gfb.backend.controller;

import com.gfb.backend.entity.Team;
import com.gfb.backend.repository.TeamRepository;
import com.gfb.backend.service.TeamFormationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "http://localhost:5173")
public class TeamController {

    private final TeamRepository teamRepository;
    private final TeamFormationService teamFormationService;

    public TeamController(
            TeamRepository teamRepository,
            TeamFormationService teamFormationService) {

        this.teamRepository = teamRepository;
        this.teamFormationService = teamFormationService;
    }

    @GetMapping
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    @PostMapping
    public Team addTeam(@RequestBody Team team) {
        return teamRepository.save(team);
    }

    @PostMapping("/generate")
    public List<Team> generateTeams(
            @RequestParam Long projectId,
            @RequestParam int numberOfTeams) {

        return teamFormationService.generateTeams(
                projectId,
                numberOfTeams
        );
    }
}