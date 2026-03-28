"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SprintBadge } from "./SprintIndicator";

interface Domain {
  slug: string;
  name: string;
  status: string;
  progress: number;
  scores: {
    demand: number;
    effort: number;
    monetization: number;
    differentiation: number;
    risk: number;
  };
}

interface Project {
  id: string;
  name: string;
  tagline: string;
  status: string;
  progress: number;
  updatedAt: string;
  domains: Domain[];
  scores: {
    demand: number;
    effort: number;
    monetization: number;
    differentiation: number;
    risk: number;
  };
}

const statusColors: Record<string, string> = {
  active: "#10b981",
  draft: "#6b7280",
  paused: "#f59e0b",
  completed: "#3b82f6",
  archived: "#6b7280",
};

const statusIcons: Record<string, string> = {
  active: "🚀",
  draft: "📝",
  paused: "⏸️",
  completed: "✅",
  archived: "📦",
};

const domainStatusColors: Record<string, string> = {
  completed: "#10b981",
  "in-progress": "#3b82f6",
  planned: "#6b7280",
};

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DomainPill({ domain }: { domain: Domain }) {
  const color = domainStatusColors[domain.status] || "#6b7280";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: 12,
        fontSize: 11,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
        }}
      />
      <span style={{ color: "var(--text)", opacity: 0.9 }}>{domain.name}</span>
      <span style={{ color: "var(--muted)", fontSize: 10 }}>
        {domain.progress}%
      </span>
    </div>
  );
}

function ProjectPreview({
  project,
  theme,
}: {
  project: Project;
  theme: { accent: string };
}) {
  const statusColor = statusColors[project.status] || "#6b7280";
  const statusIcon = statusIcons[project.status] || "📦";
  const domains = project.domains || [];
  const activeDomains = domains.filter(
    (d) => d.status === "in-progress" || d.status === "completed"
  );

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
          borderLeft: `3px solid ${statusColor}`,
          background: `linear-gradient(180deg, rgba(13,16,34,.95), rgba(11,15,29,.85)), radial-gradient(ellipse 300px 200px at 0% 0%, ${theme.accent}20 0%, transparent 60%)`,
          height: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 8px 24px ${theme.accent}20`;
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
            marginBottom: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{statusIcon}</span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {project.name}
              </span>
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project.tagline}
            </p>
            {/* Sprint Badge */}
            <div style={{ marginTop: 6 }}>
              <SprintBadge projectId={project.id} />
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              color: "var(--muted)",
              whiteSpace: "nowrap",
              marginLeft: 8,
            }}
          >
            {formatRelativeDate(project.updatedAt)}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 12 }}>
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
                background: `linear-gradient(90deg, ${statusColor}, ${theme.accent})`,
                borderRadius: 2,
                transition: "width 0.3s",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
              fontSize: 10,
              color: "var(--muted)",
            }}
          >
            <span>{project.progress}% complete</span>
            <span>{domains.length} domains</span>
          </div>
        </div>

        {/* DDD Domains */}
        {domains.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {domains.slice(0, 4).map((domain) => (
              <DomainPill key={domain.slug} domain={domain} />
            ))}
            {domains.length > 4 && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  alignSelf: "center",
                }}
              >
                +{domains.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Score Mini-bars */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          {[
            { label: "D", value: project.scores.demand, color: "#10b981" },
            {
              label: "M",
              value: project.scores.monetization,
              color: "#3b82f6",
            },
            {
              label: "Δ",
              value: project.scores.differentiation,
              color: "#f59e0b",
            },
          ].map((score) => (
            <div key={score.label} style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 9,
                  color: "var(--muted)",
                  marginBottom: 2,
                }}
              >
                <span>{score.label}</span>
                <span>{score.value}</span>
              </div>
              <div
                style={{
                  height: 3,
                  background: "var(--surface)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${score.value * 10}%`,
                    height: "100%",
                    background: score.color,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function RecentProjects({
  theme,
  limit = 4,
}: {
  theme: { accent: string };
  limit?: number;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      // Sort by updatedAt descending and filter out test projects
      const sorted = (data.projects || [])
        .filter((p: Project) => !p.name.toLowerCase().includes("test"))
        .sort(
          (a: Project, b: Project) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, limit);
      setProjects(sorted);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="card"
            style={{
              height: 180,
              background: "var(--surface)",
              animation: "pulse 1.5s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏭</div>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          No projects yet. Start creating!
        </p>
        <Link
          href="/create"
          style={{ color: theme.accent, marginTop: 8, display: "inline-block" }}
        >
          Create your first project →
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
      }}
    >
      {projects.map((project) => (
        <ProjectPreview key={project.id} project={project} theme={theme} />
      ))}
    </div>
  );
}

export function ProjectStats({ theme }: { theme: { accent: string } }) {
  const [stats, setStats] = useState({ total: 0, active: 0, domains: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      const projects = data.projects || [];
      const active = projects.filter(
        (p: Project) => p.status === "active"
      ).length;
      const domains = projects.reduce(
        (sum: number, p: Project) => sum + (p.domains?.length || 0),
        0
      );
      setStats({ total: projects.length, active, domains });
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 60,
              background: "var(--surface)",
              borderRadius: 8,
              animation: "pulse 1.5s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          padding: "12px 8px",
          background: `${theme.accent}10`,
          borderRadius: 8,
          border: `1px solid ${theme.accent}30`,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: "bold", color: theme.accent }}>
          {stats.total}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>Projects</div>
      </div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          padding: "12px 8px",
          background: "#10b98110",
          borderRadius: 8,
          border: "1px solid #10b98130",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: "bold", color: "#10b981" }}>
          {stats.active}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>Active</div>
      </div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          padding: "12px 8px",
          background: "#3b82f610",
          borderRadius: 8,
          border: "1px solid #3b82f630",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: "bold", color: "#3b82f6" }}>
          {stats.domains}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>Domains</div>
      </div>
    </div>
  );
}


