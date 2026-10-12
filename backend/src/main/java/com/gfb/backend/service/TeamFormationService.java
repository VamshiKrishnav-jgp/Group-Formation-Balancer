package com.gfb.backend.service;

import com.gfb.backend.entity.Project;
import com.gfb.backend.entity.Student;
import com.gfb.backend.entity.Team;
import com.gfb.backend.repository.ProjectRepository;
import com.gfb.backend.repository.StudentRepository;
import com.gfb.backend.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TeamFormationService {

    private final StudentRepository studentRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;

    public TeamFormationService(
            StudentRepository studentRepository,
            TeamRepository teamRepository,
            ProjectRepository projectRepository) {

        this.studentRepository = studentRepository;
        this.teamRepository = teamRepository;
        this.projectRepository = projectRepository;
    }

    public List<Team> generateTeams(
            Long projectId,
            int numberOfTeams) {

        List<Student> students = studentRepository.findAll();

        if (students.isEmpty()) {
            return new ArrayList<>();
        }

        if (numberOfTeams <= 0) {
            throw new IllegalArgumentException(
                    "Number of teams must be greater than 0."
            );
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Project not found with ID: " + projectId
                        )
                );

        int studentsPerTeam =
                project.getStudentsPerTeam();

        if (studentsPerTeam <= 0) {
            throw new IllegalArgumentException(
                    "Students per team must be greater than 0."
            );
        }

        int requiredStudents =
                numberOfTeams * studentsPerTeam;

        if (students.size() != requiredStudents) {
            throw new IllegalArgumentException(
                    "This project requires exactly "
                            + requiredStudents
                            + " students. Current students: "
                            + students.size()
            );
        }

        teamRepository.deleteByProjectId(projectId);

        students.sort(
                Comparator.comparingDouble(Student::getMarks)
                        .reversed()
        );

        List<Team> teams = new ArrayList<>();

        for (int i = 0; i < numberOfTeams; i++) {

            Team team = new Team();

            team.setTeamName("Team " + (i + 1));
            team.setProjectId(projectId);
            team.setMembers("");
            team.setAverageMarks(0);
            team.setSkillCount(0);
            team.setBalanceScore(0);
            team.setAcademicScore(0);
            team.setSkillScore(0);
            team.setPreferenceScore(0);
            team.setQualityStatus("PENDING");

            teams.add(team);
        }

        teams = teamRepository.saveAll(teams);

        List<List<Student>> teamStudents = new ArrayList<>();

        for (int i = 0; i < numberOfTeams; i++) {
            teamStudents.add(new ArrayList<>());
        }

        /*
         * ==========================================
         * TEAM FORMATION
         * ==========================================
         */

        for (Student student : students) {

            int bestTeamIndex = findBestTeam(
                    student,
                    teamStudents,
                    studentsPerTeam
            );

            if (bestTeamIndex == -1) {
                throw new IllegalStateException(
                        "Unable to assign student to a team."
                );
            }

            teamStudents
                    .get(bestTeamIndex)
                    .add(student);

            student.setTeamId(
                    teams.get(bestTeamIndex).getId()
            );
        }

        studentRepository.saveAll(students);

        /*
         * ==========================================
         * OVERALL ACADEMIC AVERAGE
         * ==========================================
         */

        double overallAverage = students
                .stream()
                .mapToDouble(Student::getMarks)
                .average()
                .orElse(0);

        /*
         * ==========================================
         * FIND MAX ACADEMIC DIFFERENCE
         * ==========================================
         */

        double maxDifference = 0;

        for (List<Student> team : teamStudents) {

            double teamAverage = team
                    .stream()
                    .mapToDouble(Student::getMarks)
                    .average()
                    .orElse(0);

            double difference =
                    Math.abs(
                            teamAverage - overallAverage
                    );

            maxDifference =
                    Math.max(
                            maxDifference,
                            difference
                    );
        }

        /*
         * ==========================================
         * CALCULATE TEAM QUALITY
         * ==========================================
         */

        for (int i = 0; i < numberOfTeams; i++) {

            List<Student> currentTeam =
                    teamStudents.get(i);

            Team team = teams.get(i);

            /*
             * MEMBERS
             */

            String members = currentTeam
                    .stream()
                    .map(Student::getName)
                    .collect(Collectors.joining(", "));

            team.setMembers(members);

            /*
             * AVERAGE MARKS
             */

            double averageMarks = currentTeam
                    .stream()
                    .mapToDouble(Student::getMarks)
                    .average()
                    .orElse(0);

            averageMarks =
                    Math.round(
                            averageMarks * 100.0
                    ) / 100.0;

            team.setAverageMarks(averageMarks);

            /*
             * SKILLS
             */

            Set<String> uniqueSkills =
                    getUniqueSkills(currentTeam);

            team.setSkillCount(
                    uniqueSkills.size()
            );

            /*
             * PREFERENCES
             */

            Set<String> uniquePreferences =
                    getUniquePreferences(currentTeam);

            /*
             * ======================================
             * ACADEMIC SCORE
             * ======================================
             *
             * Maximum score = 100
             *
             * The closer the team average is
             * to the overall class average,
             * the higher the score.
             */

            double academicScore;

            if (maxDifference == 0) {

                academicScore = 100;

            } else {

                double difference =
                        Math.abs(
                                averageMarks - overallAverage
                        );

                academicScore =
                        100 -
                        (
                                difference /
                                maxDifference
                        ) * 20;
            }

            academicScore =
                    Math.max(
                            0,
                            Math.min(
                                    100,
                                    academicScore
                            )
                    );

            academicScore =
                    round(academicScore);

            /*
             * ======================================
             * SKILL SCORE
             * ======================================
             *
             * More unique skills = better coverage.
             */

            int totalSkillEntries = 0;

            for (Student student : currentTeam) {

                if (student.getSkills() != null) {

                    String[] skills =
                            student.getSkills()
                                    .split(",");

                    for (String skill : skills) {

                        if (!skill.trim().isEmpty()) {
                            totalSkillEntries++;
                        }
                    }
                }
            }

            double skillScore = 0;

            if (totalSkillEntries > 0) {

                skillScore =
                        (
                                (double)
                                uniqueSkills.size()
                                /
                                totalSkillEntries
                        ) * 100;
            }

            skillScore =
                    Math.max(
                            0,
                            Math.min(
                                    100,
                                    skillScore
                            )
                    );

            skillScore =
                    round(skillScore);

            /*
             * ======================================
             * PREFERENCE SCORE
             * ======================================
             *
             * Different preferences inside
             * a team improve diversity.
             */

            int totalPreferenceEntries = 0;

            for (Student student : currentTeam) {

                if (student.getPreference() != null
                        && !student.getPreference()
                        .trim()
                        .isEmpty()) {

                    totalPreferenceEntries++;
                }
            }

            double preferenceScore = 0;

            if (totalPreferenceEntries > 0) {

                preferenceScore =
                        (
                                (double)
                                uniquePreferences.size()
                                /
                                totalPreferenceEntries
                        ) * 100;
            } else {

                preferenceScore = 100;
            }

            preferenceScore =
                    Math.max(
                            0,
                            Math.min(
                                    100,
                                    preferenceScore
                            )
                    );

            preferenceScore =
                    round(preferenceScore);

            /*
             * ======================================
             * OVERALL BALANCE SCORE
             * ======================================
             *
             * Academic performance has the
             * highest importance.
             *
             * Academic = 50%
             * Skills    = 30%
             * Preference = 20%
             */

            double overallScore =
                    (
                            academicScore * 0.50
                    )
                    +
                    (
                            skillScore * 0.30
                    )
                    +
                    (
                            preferenceScore * 0.20
                    );

            overallScore =
                    round(overallScore);

            team.setAcademicScore(
                    academicScore
            );

            team.setSkillScore(
                    skillScore
            );

            team.setPreferenceScore(
                    preferenceScore
            );

            team.setBalanceScore(
                    overallScore
            );

            /*
             * ======================================
             * QUALITY STATUS
             * ======================================
             */

            String qualityStatus;

            if (overallScore >= 90) {

                qualityStatus =
                        "HIGHLY BALANCED";

            } else if (overallScore >= 80) {

                qualityStatus =
                        "WELL BALANCED";

            } else if (overallScore >= 65) {

                qualityStatus =
                        "MODERATELY BALANCED";

            } else {

                qualityStatus =
                        "REQUIRES REVIEW";
            }

            team.setQualityStatus(
                    qualityStatus
            );
        }

        return teamRepository.saveAll(teams);
    }

    /*
     * ==========================================
     * FIND BEST TEAM
     * ==========================================
     */

    private int findBestTeam(
            Student student,
            List<List<Student>> teamStudents,
            int studentsPerTeam) {

        int bestTeamIndex = -1;

        double bestScore =
                Double.MAX_VALUE;

        for (int i = 0;
             i < teamStudents.size();
             i++) {

            List<Student> currentTeam =
                    teamStudents.get(i);

            if (currentTeam.size()
                    >= studentsPerTeam) {

                continue;
            }

            double score =
                    calculateTeamScore(
                            student,
                            currentTeam
                    );

            if (score < bestScore) {

                bestScore = score;
                bestTeamIndex = i;
            }
        }

        return bestTeamIndex;
    }

    /*
     * ==========================================
     * TEAM FORMATION SCORE
     * ==========================================
     */

    private double calculateTeamScore(
            Student student,
            List<Student> currentTeam) {

        if (currentTeam.isEmpty()) {
            return 0;
        }

        /*
         * ACADEMIC FACTOR
         */

        double currentTotalMarks =
                currentTeam
                        .stream()
                        .mapToDouble(Student::getMarks)
                        .sum();

        double marksScore =
                currentTotalMarks * 100.0;

        /*
         * SKILL FACTOR
         */

        Set<String> existingSkills =
                getUniqueSkills(currentTeam);

        int newSkills = 0;

        if (student.getSkills() != null) {

            String[] studentSkills =
                    student.getSkills()
                            .split(",");

            for (String skill : studentSkills) {

                String cleanedSkill =
                        skill.trim()
                                .toLowerCase();

                if (!cleanedSkill.isEmpty()
                        && !existingSkills.contains(
                        cleanedSkill)) {

                    newSkills++;
                }
            }
        }

        double skillBonus =
                newSkills * 0.1;

        /*
         * PREFERENCE FACTOR
         */

        Set<String> existingPreferences =
                getUniquePreferences(currentTeam);

        double preferenceBonus = 0;

        if (student.getPreference() != null) {

            String preference =
                    student.getPreference()
                            .trim()
                            .toLowerCase();

            if (!preference.isEmpty()
                    && !existingPreferences.contains(
                    preference)) {

                preferenceBonus = 0.15;
            }
        }

        /*
         * LOWER SCORE = BETTER TEAM
         */

        return marksScore
                - skillBonus
                - preferenceBonus;
    }

    /*
     * ==========================================
     * UNIQUE SKILLS
     * ==========================================
     */

    private Set<String> getUniqueSkills(
            List<Student> students) {

        Set<String> skills =
                new HashSet<>();

        for (Student student : students) {

            if (student.getSkills() == null) {
                continue;
            }

            String[] studentSkills =
                    student.getSkills()
                            .split(",");

            for (String skill : studentSkills) {

                String cleanedSkill =
                        skill.trim()
                                .toLowerCase();

                if (!cleanedSkill.isEmpty()) {

                    skills.add(cleanedSkill);
                }
            }
        }

        return skills;
    }

    /*
     * ==========================================
     * UNIQUE PREFERENCES
     * ==========================================
     */

    private Set<String> getUniquePreferences(
            List<Student> students) {

        Set<String> preferences =
                new HashSet<>();

        for (Student student : students) {

            if (student.getPreference() == null) {
                continue;
            }

            String preference =
                    student.getPreference()
                            .trim()
                            .toLowerCase();

            if (!preference.isEmpty()) {

                preferences.add(preference);
            }
        }

        return preferences;
    }

    /*
     * ==========================================
     * ROUND VALUE
     * ==========================================
     */

    private double round(double value) {

        return Math.round(
                value * 100.0
        ) / 100.0;
    }
}