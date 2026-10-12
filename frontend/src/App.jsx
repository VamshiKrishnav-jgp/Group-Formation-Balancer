import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080/api";

function App() {
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);

  const [studentForm, setStudentForm] = useState({
    name: "",
    rollNumber: "",
    marks: "",
    skills: "",
    preference: "",
  });

  const [projectForm, setProjectForm] = useState({
    name: "",
    teams: "",
    studentsPerTeam: "",
  });

  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchProjects();
    fetchTeams();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API}/students`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API}/projects`);
      const data = await response.json();

      setProjects(data);

      if (data.length > 0) {
        setSelectedProject(data[data.length - 1]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API}/teams`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStudentChange = (e) => {
    setStudentForm({
      ...studentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleProjectChange = (e) => {
    setProjectForm({
      ...projectForm,
      [e.target.name]: e.target.value,
    });
  };

  const addStudent = async (e) => {
    e.preventDefault();

    if (
      !studentForm.name ||
      !studentForm.rollNumber ||
      !studentForm.marks ||
      !studentForm.skills ||
      !studentForm.preference
    ) {
      setMessage("Please fill all student fields.");
      return;
    }

    try {
      const response = await fetch(`${API}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: studentForm.name,
          rollNumber: studentForm.rollNumber,
          marks: Number(studentForm.marks),
          skills: studentForm.skills,
          preference: studentForm.preference,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add student");
      }

      setStudentForm({
        name: "",
        rollNumber: "",
        marks: "",
        skills: "",
        preference: "",
      });

      setMessage("Student added successfully.");

      fetchStudents();
    } catch (error) {
      console.error(error);
      setMessage("Failed to add student.");
    }
  };

  const createProject = async (e) => {
    e.preventDefault();

    if (
      !projectForm.name ||
      !projectForm.teams ||
      !projectForm.studentsPerTeam
    ) {
      setMessage("Please fill all project fields.");
      return;
    }

    try {
      const response = await fetch(`${API}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectForm.name,
          teams: Number(projectForm.teams),
          studentsPerTeam: Number(
            projectForm.studentsPerTeam
          ),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();

      setSelectedProject(project);

      setProjectForm({
        name: "",
        teams: "",
        studentsPerTeam: "",
      });

      setMessage("Project created successfully.");

      fetchProjects();
    } catch (error) {
      console.error(error);
      setMessage("Failed to create project.");
    }
  };

  const generateTeams = async () => {
    if (!selectedProject) {
      setMessage("Please create a project first.");
      return;
    }

    const requiredStudents =
      selectedProject.teams *
      selectedProject.studentsPerTeam;

    if (students.length !== requiredStudents) {
      setMessage(
        `This project requires exactly ${requiredStudents} students. Currently registered: ${students.length}.`
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/teams/generate?projectId=${selectedProject.id}&numberOfTeams=${selectedProject.teams}`,
        {
          method: "POST",
        }
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text);
      }

      const data = JSON.parse(text);

      setTeams(data);
      setMessage("Balanced teams generated successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error.message || "Failed to generate teams."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "HIGHLY BALANCED") {
      return "high";
    }

    if (status === "WELL BALANCED") {
      return "good";
    }

    if (status === "MODERATELY BALANCED") {
      return "medium";
    }

    return "review";
  };

  const averageBalance =
    teams.length > 0
      ? (
          teams.reduce(
            (sum, team) =>
              sum + Number(team.balanceScore || 0),
            0
          ) / teams.length
        ).toFixed(1)
      : "—";

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="brand">

          <div className="brand-logo">
            GB
          </div>

          <div>
            <h2>GroupBalancer</h2>
            <span>
              Intelligent Team Formation
            </span>
          </div>

        </div>

        <div className="nav-right">

          <div className="nav-status">
            <span className="status-dot"></span>
            System Operational
          </div>

          <div className="royal-mark">
            GB
          </div>

        </div>

      </nav>

      <main className="container">

        {/* HERO */}

        <section className="hero">

          <div className="hero-content">

            <div className="eyebrow">
              <span>◆</span>
              ACADEMIC TEAM MANAGEMENT
            </div>

            <h1>
              Build Balanced Teams.
              <br />
              <span>
                Enable Better Collaboration.
              </span>
            </h1>

            <p>
              Create structured project teams using
              academic performance, technical
              competencies, and student preferences.
            </p>

          </div>

          <div className="hero-project">

            <div className="project-crown">
              ◆
            </div>

            <div>

              <span>
                CURRENT WORKSPACE
              </span>

              <strong>
                {selectedProject
                  ? selectedProject.name
                  : "No project configured"}
              </strong>

              <small>
                {selectedProject
                  ? `${selectedProject.teams} teams · ${selectedProject.studentsPerTeam} students per team`
                  : "Configure a project to begin"}
              </small>

            </div>

          </div>

        </section>

        {/* STATISTICS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">
              ◉
            </div>

            <div>
              <span>
                REGISTERED STUDENTS
              </span>

              <strong>
                {students.length}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ▣
            </div>

            <div>
              <span>
                ACTIVE PROJECTS
              </span>

              <strong>
                {projects.length}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ◎
            </div>

            <div>
              <span>
                TEAMS FORMED
              </span>

              <strong>
                {teams.length}
              </strong>
            </div>

          </div>

          <div className="stat-card gold-stat">

            <div className="stat-icon">
              ◆
            </div>

            <div>
              <span>
                AVERAGE BALANCE
              </span>

              <strong>
                {averageBalance}
                {teams.length > 0 && "%"}
              </strong>
            </div>

          </div>

        </section>

        {/* SETUP */}

        <section className="workspace-grid">

          {/* STUDENT */}

          <div className="panel">

            <div className="step-heading">

              <div className="step-number">
                01
              </div>

              <div>

                <div className="panel-label">
                  STUDENT DATA
                </div>

                <h2>
                  Student Information
                </h2>

                <p>
                  Add and manage student profiles
                  used for team formation.
                </p>

              </div>

            </div>

            <form onSubmit={addStudent}>

              <div className="two-inputs">

                <div className="input-group">

                  <label>
                    STUDENT NAME
                  </label>

                  <input
                    name="name"
                    value={studentForm.name}
                    onChange={handleStudentChange}
                    placeholder="Enter full name"
                  />

                </div>

                <div className="input-group">

                  <label>
                    ROLL NUMBER
                  </label>

                  <input
                    name="rollNumber"
                    value={studentForm.rollNumber}
                    onChange={handleStudentChange}
                    placeholder="Enter roll number"
                  />

                </div>

              </div>

              <div className="input-group">

                <label>
                  ACADEMIC SCORE
                </label>

                <input
                  name="marks"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={studentForm.marks}
                  onChange={handleStudentChange}
                  placeholder="Enter CGPA"
                />

              </div>

              <div className="input-group">

                <label>
                  TECHNICAL SKILLS
                </label>

                <input
                  name="skills"
                  value={studentForm.skills}
                  onChange={handleStudentChange}
                  placeholder="Java, React, SQL"
                />

              </div>

              <div className="input-group">

                <label>
                  PROJECT PREFERENCE
                </label>

                <input
                  name="preference"
                  value={studentForm.preference}
                  onChange={handleStudentChange}
                  placeholder="Web Development"
                />

              </div>

              <button
                className="primary-button"
                type="submit"
              >
                Add Student Profile
                <span>→</span>
              </button>

            </form>

          </div>

          {/* PROJECT */}

          <div className="panel">

            <div className="step-heading">

              <div className="step-number">
                02
              </div>

              <div>

                <div className="panel-label">
                  PROJECT CONFIGURATION
                </div>

                <h2>
                  Define Project Structure
                </h2>

                <p>
                  Configure project requirements
                  and team capacity.
                </p>

              </div>

            </div>

            <form onSubmit={createProject}>

              <div className="input-group">

                <label>
                  PROJECT NAME
                </label>

                <input
                  name="name"
                  value={projectForm.name}
                  onChange={handleProjectChange}
                  placeholder="Enter project name"
                />

              </div>

              <div className="two-inputs">

                <div className="input-group">

                  <label>
                    NUMBER OF TEAMS
                  </label>

                  <input
                    name="teams"
                    type="number"
                    min="1"
                    value={projectForm.teams}
                    onChange={handleProjectChange}
                    placeholder="2"
                  />

                </div>

                <div className="input-group">

                  <label>
                    STUDENTS PER TEAM
                  </label>

                  <input
                    name="studentsPerTeam"
                    type="number"
                    min="1"
                    value={projectForm.studentsPerTeam}
                    onChange={handleProjectChange}
                    placeholder="3"
                  />

                </div>

              </div>

              <div className="setup-preview">

                <div>

                  <span>
                    REQUIRED STUDENTS
                  </span>

                  <strong>
                    {projectForm.teams &&
                    projectForm.studentsPerTeam
                      ? Number(projectForm.teams) *
                        Number(
                          projectForm.studentsPerTeam
                        )
                      : 0}{" "}
                    students
                  </strong>

                </div>

                <div className="preview-icon">
                  ◆
                </div>

              </div>

              <button
                className="secondary-button"
                type="submit"
              >
                + Create Project Configuration
              </button>

            </form>

          </div>

        </section>

        {/* MESSAGE */}

        {message && (
          <div className="message-box">
            {message}
          </div>
        )}

        {/* STUDENTS */}

        <section className="student-section">

          <div className="section-heading">

            <div>

              <div className="panel-label">
                STUDENT DIRECTORY
              </div>

              <h2>
                Registered Students
              </h2>

              <p>
                Review academic performance,
                technical competencies, and
                project preferences.
              </p>

            </div>

            <div className="section-count">
              {students.length} REGISTERED
            </div>

          </div>

          {students.length === 0 ? (

            <div className="empty-state">

              <div>◉</div>

              <h3>
                No Student Profiles
              </h3>

              <p>
                Add students using the student
                information panel above.
              </p>

            </div>

          ) : (

            <div className="student-grid">

              {students.map((student) => (

                <div
                  className="student-card"
                  key={student.id}
                >

                  <div className="student-card-top">

                    <div className="student-avatar">
                      {student.name
                        ? student.name
                            .substring(0, 2)
                            .toUpperCase()
                        : "ST"}
                    </div>

                    <div className="student-name">

                      <h3>
                        {student.name}
                      </h3>

                      <span>
                        {student.rollNumber}
                      </span>

                    </div>

                    <div className="cgpa">

                      <small>
                        CGPA
                      </small>

                      {Number(
                        student.marks
                      ).toFixed(1)}

                    </div>

                  </div>

                  <div className="tags">

                    {student.skills
                      ?.split(",")
                      .map((skill, index) => (

                        <span key={index}>
                          {skill.trim()}
                        </span>

                      ))}

                  </div>

                  <div className="preference">

                    <span>
                      PROJECT PREFERENCE
                    </span>

                    <strong>
                      {student.preference}
                    </strong>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* TEAM RESULTS */}

        <section className="teams-section">

          <div className="section-heading">

            <div>

              <div className="panel-label">
                TEAM FORMATION RESULTS
              </div>

              <h2>
                Optimized Team Allocation
              </h2>

              <p>
                Teams are generated using academic
                performance, skill diversity, and
                project preferences.
              </p>

            </div>

            <button
              className="generate-button"
              onClick={generateTeams}
              disabled={loading}
            >
              ◆{" "}
              {loading
                ? "Generating..."
                : "Generate Balanced Teams"}
            </button>

          </div>

          {teams.length === 0 ? (

            <div className="empty-state">

              <div>◎</div>

              <h3>
                No Team Allocation Available
              </h3>

              <p>
                Configure the project structure
                and generate teams to view the
                optimized allocation.
              </p>

            </div>

          ) : (

            <div className="team-grid">

              {teams.map((team, index) => (

                <div
                  className="team-card"
                  key={team.id || index}
                >

                  {/* HEADER */}

                  <div className="team-header">

                    <div className="team-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="team-title">

                      <span>
                        FORMATION GROUP
                      </span>

                      <h3>
                        {team.teamName}
                      </h3>

                    </div>

                    <div className="team-score">
                      {Number(
                        team.balanceScore || 0
                      ).toFixed(1)}
                      %
                    </div>

                  </div>

                  {/* BASIC METRICS */}

                  <div className="team-metrics">

                    <div>
                      <span>
                        AVERAGE CGPA
                      </span>

                      <strong>
                        {Number(
                          team.averageMarks || 0
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        SKILL COVERAGE
                      </span>

                      <strong>
                        {team.skillCount || 0}
                      </strong>
                    </div>

                    <div>
                      <span>
                        TEAM MEMBERS
                      </span>

                      <strong>
                        {team.members
                          ? team.members
                              .split(",")
                              .length
                          : 0}
                      </strong>
                    </div>

                  </div>

                  {/* QUALITY */}

                  <div className="quality-analysis">

                    <div className="quality-heading">

                      <span>
                        TEAM QUALITY ANALYSIS
                      </span>

                      <strong
                        className={getStatusClass(
                          team.qualityStatus
                        )}
                      >
                        {team.qualityStatus}
                      </strong>

                    </div>

                    {/* ACADEMIC */}

                    <div className="score-row">

                      <div className="score-label">

                        <span>
                          Academic Balance
                        </span>

                        <strong>
                          {Number(
                            team.academicScore || 0
                          ).toFixed(1)}
                          %
                        </strong>

                      </div>

                      <div className="score-bar">

                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Number(
                                team.academicScore || 0
                              )
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* SKILLS */}

                    <div className="score-row">

                      <div className="score-label">

                        <span>
                          Skill Coverage
                        </span>

                        <strong>
                          {Number(
                            team.skillScore || 0
                          ).toFixed(1)}
                          %
                        </strong>

                      </div>

                      <div className="score-bar">

                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Number(
                                team.skillScore || 0
                              )
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* PREFERENCE */}

                    <div className="score-row">

                      <div className="score-label">

                        <span>
                          Preference Match
                        </span>

                        <strong>
                          {Number(
                            team.preferenceScore || 0
                          ).toFixed(1)}
                          %
                        </strong>

                      </div>

                      <div className="score-bar">

                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Number(
                                team.preferenceScore || 0
                              )
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>

                  {/* OVERALL */}

                  <div className="overall-score">

                    <div className="overall-top">

                      <div>

                        <span>
                          OVERALL TEAM QUALITY
                        </span>

                        <strong>
                          {Number(
                            team.balanceScore || 0
                          ).toFixed(1)}
                          %
                        </strong>

                      </div>

                      <span
                        className={getStatusClass(
                          team.qualityStatus
                        )}
                      >
                        {team.qualityStatus}
                      </span>

                    </div>

                    <div className="overall-bar">

                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Number(
                              team.balanceScore || 0
                            )
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* MEMBERS */}

                  <div className="members">

                    <span>
                      TEAM MEMBERS
                    </span>

                    <p>
                      {team.members}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default App;