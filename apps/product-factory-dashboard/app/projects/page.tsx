"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ProjectSummary,
  getScoreColor,
  getStatusColor,
  getStatusIcon,
  DomainScores,
} from "../../lib/projects";
import { categories } from "../../lib/categories";
import { SprintBadge } from "../../components/SprintIndicator";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects =
    filter === "all" ? projects : projects.filter((p) => p.status === filter);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const draftCount = projects.filter((p) => p.status === "draft").length;

  function getCategoryName(slug: string): string {
    const cat = categories.find((c) => c.slug === slug);
    return cat?.name || slug || "Uncategorized";
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function ScoreBar({ label, value }: { label: string; value: number }) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}
      >
        <span style={{ width: 24, color: "var(--muted)" }}>{label}</span>
        <div
          style={{
            flex: 1,
            height: 6,
            background: "var(--surface)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${value * 10}%`,
              height: "100%",
              background: getScoreColor(value),
              borderRadius: 3,
            }}
          />
        </div>
        <span style={{ width: 16, textAlign: "right", color: "var(--muted)" }}>
          {value}
        </span>
      </div>
    );
  }

  function ProjectCard({ project }: { project: ProjectSummary }) {
    return (
      <Link
        href={`/projects/${project.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div
          className="card"
          style={{
            cursor: "pointer",
            transition: "all 0.2s",
            borderLeft: `3px solid ${getStatusColor(project.status)}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {getStatusIcon(project.status)} {project.name}
              </h3>
              <p
                className="small"
                style={{ margin: "4px 0 0", color: "var(--muted)" }}
              >
                {project.tagline}
              </p>
              {/* Sprint Badge */}
              <div style={{ marginTop: 8 }}>
                <SprintBadge projectId={project.id} />
              </div>
            </div>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                background: `${getStatusColor(project.status)}20`,
                color: getStatusColor(project.status),
                textTransform: "capitalize",
              }}
            >
              {project.status}
            </span>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              <span style={{ color: "var(--muted)" }}>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div
              style={{
                height: 4,
                background: "var(--surface)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${project.progress}%`,
                  height: "100%",
                  background: "var(--accent)",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          {/* Scorecard Mini */}
          <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
            <ScoreBar label="D" value={project.scores.demand} />
            <ScoreBar label="M" value={project.scores.monetization} />
            <ScoreBar label="Δ" value={project.scores.differentiation} />
          </div>

          {/* Domain Count Strip */}
          {project.domainCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                🏗️ {project.domainCount} domain
                {project.domainCount !== 1 ? "s" : ""}
              </span>
              {/* Mini domain bar */}
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "var(--surface)",
                  borderRadius: 3,
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: `${project.progress}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${getStatusColor(
                      project.status
                    )}, var(--accent))`,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--muted)",
              borderTop: "1px solid var(--border)",
              paddingTop: 8,
              marginTop: 8,
            }}
          >
            <span>
              {getCategoryName(project.primaryCategory).split(" ")[0]}
            </span>
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        className="card"
        style={{
          background:
            "linear-gradient(135deg, var(--surface) 0%, rgba(59, 130, 246, 0.1) 100%)",
          border: "1px solid var(--accent)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              📦 Projects
              <span
                style={{
                  fontSize: 14,
                  fontWeight: "normal",
                  padding: "4px 12px",
                  background: "var(--accent)",
                  borderRadius: 12,
                }}
              >
                {projects.length}
              </span>
            </h1>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              Projects managed by the Product Factory
            </p>
          </div>
          <Link href="/create">
            <button
              style={{
                padding: "12px 24px",
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                color: "white",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ➕ New Project
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "flex", gap: 12 }}>
        <div
          className="card"
          style={{ flex: 1, textAlign: "center", padding: 16 }}
        >
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#10b981" }}>
            {activeCount}
          </div>
          <div className="small" style={{ color: "var(--muted)" }}>
            Active
          </div>
        </div>
        <div
          className="card"
          style={{ flex: 1, textAlign: "center", padding: 16 }}
        >
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#6b7280" }}>
            {draftCount}
          </div>
          <div className="small" style={{ color: "var(--muted)" }}>
            Drafts
          </div>
        </div>
        <div
          className="card"
          style={{ flex: 1, textAlign: "center", padding: 16 }}
        >
          <div
            style={{ fontSize: 28, fontWeight: "bold", color: "var(--accent)" }}
          >
            {projects.length}
          </div>
          <div className="small" style={{ color: "var(--muted)" }}>
            Total
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8 }}>
        {["all", "active", "draft", "paused", "completed", "archived"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: 6,
                background:
                  filter === status ? "var(--accent)" : "var(--surface)",
                color: filter === status ? "white" : "var(--muted)",
                cursor: "pointer",
                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <p style={{ color: "var(--muted)" }}>Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏭</div>
          <h2 style={{ margin: "0 0 8px" }}>No Projects Yet</h2>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>
            The factory is ready to generate your first project.
          </p>
          <Link href="/create">
            <button
              style={{
                padding: "12px 24px",
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                color: "white",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              🚀 Create Your First Project
            </button>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Factory Self-Reference */}
      <div
        className="card"
        style={{
          background:
            "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--surface) 100%)",
          borderLeft: "3px solid #10b981",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ fontSize: 32 }}>🏭</div>
          <div>
            <h3 style={{ margin: 0 }}>Factory Self-Reference</h3>
            <p
              className="small"
              style={{ margin: "8px 0 0", color: "var(--muted)" }}
            >
              The Product Factory itself is managed as a project. Each generated
              project inherits the same dashboard structure, enabling recursive
              self-improvement and consistent architecture across the portfolio.
            </p>
            <p className="small" style={{ margin: "8px 0 0", opacity: 0.7 }}>
              💭{" "}
              <em>
                &quot;The factory that builds factories, building itself.&quot;
                — Captain Picard
              </em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




