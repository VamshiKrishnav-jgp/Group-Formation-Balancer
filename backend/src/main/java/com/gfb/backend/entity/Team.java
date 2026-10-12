package com.gfb.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String teamName;
    private Long projectId;
    private String members;

    private double averageMarks;
    private int skillCount;
    private double balanceScore;

    private double academicScore;
    private double skillScore;
    private double preferenceScore;

    private String qualityStatus;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getMembers() {
        return members;
    }

    public void setMembers(String members) {
        this.members = members;
    }

    public double getAverageMarks() {
        return averageMarks;
    }

    public void setAverageMarks(double averageMarks) {
        this.averageMarks = averageMarks;
    }

    public int getSkillCount() {
        return skillCount;
    }

    public void setSkillCount(int skillCount) {
        this.skillCount = skillCount;
    }

    public double getBalanceScore() {
        return balanceScore;
    }

    public void setBalanceScore(double balanceScore) {
        this.balanceScore = balanceScore;
    }

    public double getAcademicScore() {
        return academicScore;
    }

    public void setAcademicScore(double academicScore) {
        this.academicScore = academicScore;
    }

    public double getSkillScore() {
        return skillScore;
    }

    public void setSkillScore(double skillScore) {
        this.skillScore = skillScore;
    }

    public double getPreferenceScore() {
        return preferenceScore;
    }

    public void setPreferenceScore(double preferenceScore) {
        this.preferenceScore = preferenceScore;
    }

    public String getQualityStatus() {
        return qualityStatus;
    }

    public void setQualityStatus(String qualityStatus) {
        this.qualityStatus = qualityStatus;
    }
}