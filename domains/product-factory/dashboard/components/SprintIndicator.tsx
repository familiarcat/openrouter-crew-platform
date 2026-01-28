"use client";

import { useEffect, useState } from "react";

interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: "planning" | "active" | "in_review" | "completed";
  committedPoints: number;
  completedPoints: number;
  stories: Array<{
    id: string;
    status: string;
    title: string;
  }>;
}

interface SprintIndicatorProps {
  projectId: string;
  compact?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
}

export function SprintIndicator({
  projectId,
  compact = false,
  showProgress = true,
  onClick,
}: SprintIndicatorProps) {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSprint();
  }, [projectId]);

  async function loadActiveSprint() {
    try {
      const res = await fetch(`/api/sprints?project_id=${projectId}`);
      const data = await res.json();
      // Find active or planning sprint
      const activeSprint = data.sprints?.find(
        (s: Sprint) => s.status === "active" || s.status === "planning"
      );
      setSprint(activeSprint || null);
    } catch (error) {
      console.error("Failed to load sprint:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return compact ? null : (
      <span style={{ fontSize: 11, color: "var(--muted)" }}>...</span>
    );
  }

  if (!sprint) {
    return compact ? null : (
      <span
        style={{
          fontSize: 11,
          color: "var(--muted)",
          padding: "2px 8px",
          background: "var(--surface)",
          borderRadius: 4,
        }}
      >
        No active sprint
      </span>
    );
  }

  const statusConfig = getStatusConfig(sprint.status);
  const progress =
    sprint.committedPoints > 0
      ? Math.round((sprint.completedPoints / sprint.committedPoints) * 100)
      : 0;

  const storyStats = getStoryStats(sprint.stories);

  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 10px",
          background: `${statusConfig.color}20`,
          border: `1px solid ${statusConfig.color}40`,
          borderRadius: 12,
          cursor: onClick ? "pointer" : "default",
        }}
        title={`${sprint.name}: ${sprint.goal}`}
      >
        <span style={{ fontSize: 12 }}>{statusConfig.icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: statusConfig.color,
          }}
        >
          {sprint.name}
        </span>
        {storyStats.blocked > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 4px",
              background: "#ef4444",
              color: "white",
              borderRadius: 4,
            }}
            title={`${storyStats.blocked} blocked - human review needed`}
          >
            🚫 {storyStats.blocked}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        background: `linear-gradient(135deg, ${statusConfig.color}10 0%, ${statusConfig.color}05 100%)`,
        border: `1px solid ${statusConfig.color}30`,
        borderRadius: 8,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>{statusConfig.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{sprint.name}</span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                background: statusConfig.color,
                color: "white",
                borderRadius: 10,
                textTransform: "uppercase",
              }}
            >
              {sprint.status}
            </span>
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "var(--muted)",
              maxWidth: 300,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sprint.goal}
          </p>
        </div>
        {showProgress && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: statusConfig.color,
              }}
            >
              {progress}%
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>
              {sprint.completedPoints}/{sprint.committedPoints} pts
            </div>
          </div>
        )}
      </div>

      {/* Story Status Summary */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        <StatusPill
          label="Backlog"
          count={storyStats.backlog}
          color="#6b7280"
        />
        <StatusPill label="To Do" count={storyStats.todo} color="#3b82f6" />
        <StatusPill
          label="In Progress"
          count={storyStats.inProgress}
          color="#f59e0b"
        />
        <StatusPill label="In Review" count={storyStats.inReview} color="#8b5cf6" />
        <StatusPill label="Completed" count={storyStats.completed} color="#10b981" />
        {storyStats.blocked > 0 && (
          <StatusPill
            label="Blocked"
            count={storyStats.blocked}
            color="#ef4444"
            highlight
          />
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div
          style={{
            marginTop: 8,
            height: 4,
            background: "var(--surface)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: statusConfig.color,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

function StatusPill({
  label,
  count,
  color,
  highlight = false,
}: {
  label: string;
  count: number;
  color: string;
  highlight?: boolean;
}) {
  if (count === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        background: highlight ? color : `${color}20`,
        borderRadius: 10,
        fontSize: 10,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: highlight ? "white" : color,
        }}
      />
      <span style={{ color: highlight ? "white" : color, fontWeight: 500 }}>
        {count} {label}
      </span>
    </div>
  );
}

function getStatusConfig(status: Sprint["status"]) {
  switch (status) {
    case "planning":
      return { icon: "📋", color: "#3b82f6", label: "Planning" };
    case "active":
      return { icon: "🏃", color: "#10b981", label: "Active" };
    case "in_review":
      return { icon: "👀", color: "#8b5cf6", label: "In Review" };
    case "completed":
      return { icon: "✅", color: "#6b7280", label: "Completed" };
  }
}

function getStoryStats(stories: Array<{ status: string }>) {
  return {
    backlog: stories.filter((s) => s.status === "backlog").length,
    todo: stories.filter((s) => s.status === "todo").length,
    inProgress: stories.filter((s) => s.status === "in_progress").length,
    inReview: stories.filter((s) => s.status === "in_review").length,
    completed: stories.filter((s) => s.status === "completed").length,
    blocked: stories.filter((s) => s.status === "blocked").length,
  };
}

// Mini version for project cards
export function SprintBadge({ projectId }: { projectId: string }) {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSprint();
  }, [projectId]);

  async function loadActiveSprint() {
    try {
      const res = await fetch(`/api/sprints?project_id=${projectId}`);
      const data = await res.json();
      const activeSprint = data.sprints?.find(
        (s: Sprint) => s.status === "active" || s.status === "planning"
      );
      setSprint(activeSprint || null);
    } catch {
      // Ignore errors for badge
    } finally {
      setLoading(false);
    }
  }

  if (loading || !sprint) return null;

  const statusConfig = getStatusConfig(sprint.status);
  const blocked = sprint.stories.filter((s) => s.status === "blocked").length;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 10,
          padding: "2px 6px",
          background: `${statusConfig.color}20`,
          color: statusConfig.color,
          borderRadius: 4,
          fontWeight: 600,
        }}
      >
        {statusConfig.icon} {sprint.name}
      </span>
      {blocked > 0 && (
        <span
          style={{
            fontSize: 9,
            padding: "2px 4px",
            background: "#ef4444",
            color: "white",
            borderRadius: 4,
          }}
          title={`${blocked} stories blocked - needs human review`}
        >
          🚫 {blocked}
        </span>
      )}
    </div>
  );
}


