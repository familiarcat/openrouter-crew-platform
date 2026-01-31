"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sprint,
  Story,
  StoryStatus,
  SprintMetrics,
  getStoryStatusColor,
  getPriorityColor,
  getStoryTypeIcon,
  getPriorityValue,
} from "@/types/sprint";

interface SprintBoardProps {
  projectId: string;
  theme: { accent: string };
}

const statusColumns: { status: StoryStatus; label: string; icon: string }[] = [
  { status: "backlog", label: "Backlog", icon: "📋" },
  { status: "todo", label: "To Do", icon: "📝" },
  { status: "in_progress", label: "In Progress", icon: "🚀" },
  { status: "review", label: "Review", icon: "👀" },
  { status: "done", label: "Done", icon: "✅" },
  { status: "blocked", label: "Blocked", icon: "🚫" },
];

interface PlanningSession {
  summary: string;
  crewAnalysis: Array<{
    crewMember: string;
    perspective: string;
    storiesSuggested: number;
  }>;
  deliberation: { consensus: string; adjustmentsMade: number };
  totalStories: number;
  totalPoints: number;
  totalBudget: number;
  crewInvolved: number;
  estimatedROI: number;
  quarkAnalysis?: string;
  rikerPlan?: string;
}

export function SprintBoard({ projectId, theme }: SprintBoardProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [metrics, setMetrics] = useState<SprintMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [planningResult, setPlanningResult] = useState<PlanningSession | null>(
    null
  );
  const [showNewSprintModal, setShowNewSprintModal] = useState(false);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [blockedStoryId, setBlockedStoryId] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  useEffect(() => {
    loadSprints();
  }, [projectId]);

  async function loadSprints() {
    try {
      const res = await fetch(`/api/sprints?project_id=${projectId}`);
      const data = await res.json();
      setSprints(data.sprints || []);

      // Set active sprint
      const active = data.sprints?.find(
        (s: Sprint) => s.status === "active" || s.status === "planning"
      );
      if (active) {
        setActiveSprint(active);
        loadMetrics(active.id);
      }
    } catch (error) {
      console.error("Failed to load sprints:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMetrics(sprintId: string) {
    try {
      const res = await fetch(`/api/sprints?id=${sprintId}&metrics=true`);
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  }

  async function updateStoryStatus(storyId: string, newStatus: StoryStatus) {
    if (!activeSprint) return;

    try {
      await fetch("/api/sprints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSprint.id,
          action: "update-story",
          storyId,
          updates: { status: newStatus },
        }),
      });
      await loadSprints();
    } catch (error) {
      console.error("Failed to update story:", error);
    }
  }

  async function createSprint(name: string, goal: string, duration: number) {
    try {
      // Calculate dates from duration (in days)
      const now = new Date();
      const start_date = now.toISOString().split('T')[0];
      const end_date = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get sprint number (auto-increment from existing sprints)
      const sprint_number = (sprints.length > 0 ? Math.max(...sprints.map(s => s.sprint_number || 0)) : 0) + 1;
      
      await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          name,
          sprint_number,
          start_date,
          end_date,
          goals: goal ? [goal] : [],
          velocity_target: 0,
        }),
      });
      setShowNewSprintModal(false);
      await loadSprints();
    } catch (error) {
      console.error("Failed to create sprint:", error);
    }
  }

  async function createStory(storyData: Partial<Story>) {
    if (!activeSprint) return;

    try {
      await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storyData,
          sprint_id: activeSprint.id,
          project_id: projectId,
        }),
      });
      setShowNewStoryModal(false);
      await loadSprints();
    } catch (error) {
      console.error("Failed to create story:", error);
    }
  }

  async function assignCrew(storyId: string) {
    if (!activeSprint) return;

    try {
      const res = await fetch("/api/sprints/coordinate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-crew",
          sprintId: activeSprint.id,
          storyId,
          teamSize: 3,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadSprints();
        alert(data.rikerNotes);
      }
    } catch (error) {
      console.error("Failed to assign crew:", error);
    }
  }

  async function conveneCrew() {
    if (!activeSprint) return;

    setPlanning(true);
    setPlanningResult(null);

    try {
      const res = await fetch("/api/sprints/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "full-planning",
          sprintId: activeSprint.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPlanningResult({
          summary: data.planningSession?.summary || "",
          crewAnalysis: data.crewAnalysis || [],
          deliberation: data.deliberation || {
            consensus: "",
            adjustmentsMade: 0,
          },
          totalStories: data.summary?.totalStories || 0,
          totalPoints: data.summary?.totalPoints || 0,
          totalBudget: data.summary?.totalBudget || 0,
          crewInvolved: data.summary?.crewInvolved || 0,
          estimatedROI: data.summary?.estimatedROI || 0,
          quarkAnalysis: data.planningSession?.quarkAnalysis,
          rikerPlan: data.planningSession?.rikerPlan,
        });
        setShowPlanningModal(true);
        await loadSprints();
      }
    } catch (error) {
      console.error("Failed to convene crew:", error);
    } finally {
      setPlanning(false);
    }
  }

  async function startSprint() {
    if (!activeSprint) return;

    setExecuting(true);
    setExecutionLog(["🚀 Starting sprint..."]);

    try {
      const res = await fetch("/api/sprints/auto-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start-sprint",
          sprintId: activeSprint.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setExecutionLog((prev) => [
          ...prev,
          `✅ Sprint activated! ${data.storiesActivated} stories moved to TODO`,
        ]);
        await loadSprints();
      }
    } catch (error) {
      setExecutionLog((prev) => [...prev, `❌ Error: ${error}`]);
    } finally {
      setExecuting(false);
    }
  }

  async function runAutomationCycle() {
    if (!activeSprint) return;

    setExecuting(true);
    setExecutionLog((prev) => [...prev, "🔄 Running automation cycle..."]);

    try {
      const res = await fetch("/api/sprints/auto-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run-cycle",
          sprintId: activeSprint.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Log each story's progress
        for (const result of data.cycleResults || []) {
          setExecutionLog((prev) => [
            ...prev,
            `${result.newStatus === "done" ? "✅" : "🔄"} ${result.title}: ${
              result.action
            }`,
          ]);
        }
        setExecutionLog((prev) => [
          ...prev,
          `📊 Cycle complete: ${data.summary.done}/${data.summary.total} done`,
        ]);
        if (data.sprintComplete) {
          setExecutionLog((prev) => [
            ...prev,
            "🎉 SPRINT COMPLETE! All stories done.",
          ]);
        }
        await loadSprints();
      }
    } catch (error) {
      setExecutionLog((prev) => [...prev, `❌ Error: ${error}`]);
    } finally {
      setExecuting(false);
    }
  }

  function openUnblockModal(storyId: string) {
    setBlockedStoryId(storyId);
    setShowUnblockModal(true);
  }

  async function unblockStory(
    resolution: string,
    moveToStatus: "backlog" | "todo" | "in_progress"
  ) {
    if (!activeSprint || !blockedStoryId) return;

    setExecuting(true);
    setExecutionLog((prev) => [
      ...prev,
      `🔓 Unblocking story with human review...`,
    ]);

    try {
      const res = await fetch("/api/sprints/auto-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unblock",
          sprintId: activeSprint.id,
          storyId: blockedStoryId,
          resolution,
          moveToStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setExecutionLog((prev) => [
          ...prev,
          `✅ Story unblocked: ${data.message}`,
        ]);
        setShowUnblockModal(false);
        setBlockedStoryId(null);
        await loadSprints();
      } else {
        setExecutionLog((prev) => [...prev, `❌ Failed: ${data.error}`]);
      }
    } catch (error) {
      setExecutionLog((prev) => [...prev, `❌ Error: ${error}`]);
    } finally {
      setExecuting(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <p style={{ color: "var(--muted)" }}>Loading sprint board...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sprint Header */}
      <div
        className="card"
        style={{
          background: `linear-gradient(135deg, var(--surface) 0%, ${theme.accent}15 100%)`,
          border: `1px solid ${theme.accent}40`,
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
            <h2
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              🏃 Sprint Board
              {activeSprint && (
                <span
                  style={{
                    fontSize: 14,
                    padding: "4px 12px",
                    background: theme.accent,
                    borderRadius: 12,
                  }}
                >
                  {activeSprint.name}
                </span>
              )}
            </h2>
            {activeSprint && (
              <p
                style={{
                  margin: "8px 0 0",
                  color: "var(--muted)",
                  fontSize: 13,
                }}
              >
                {activeSprint.goals || "No sprint goal set"}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {activeSprint && (activeSprint.stories?.length ?? 0) === 0 && (
              <button
                onClick={conveneCrew}
                disabled={planning}
                style={{
                  padding: "8px 16px",
                  background: planning
                    ? "var(--surface)"
                    : "linear-gradient(135deg, #f59e0b, #ef4444)",
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  cursor: planning ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {planning ? "🔄 Planning..." : "🖖 Convene Crew"}
              </button>
            )}
            {activeSprint && (activeSprint.stories?.length ?? 0) > 0 && (
              <button
                onClick={() => setShowPlanningModal(true)}
                style={{
                  padding: "8px 16px",
                  background: "var(--surface)",
                  border: `1px solid ${theme.accent}40`,
                  borderRadius: 8,
                  color: theme.accent,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                📋 View Plan
              </button>
            )}
            {activeSprint &&
              activeSprint.status === "planning" &&
              (activeSprint.stories?.length ?? 0) > 0 && (
                <button
                  onClick={startSprint}
                  disabled={executing}
                  style={{
                    padding: "8px 16px",
                    background: executing
                      ? "var(--surface)"
                      : "linear-gradient(135deg, #10b981, #059669)",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    cursor: executing ? "wait" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {executing ? "🔄 Starting..." : "▶️ Start Sprint"}
                </button>
              )}
            {activeSprint && activeSprint.status === "active" && (
              <button
                onClick={runAutomationCycle}
                disabled={executing}
                style={{
                  padding: "8px 16px",
                  background: executing
                    ? "var(--surface)"
                    : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  cursor: executing ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {executing ? "🔄 Running..." : "⚡ Run Cycle"}
              </button>
            )}
            {activeSprint && (
              <button
                onClick={() => setShowNewStoryModal(true)}
                style={{
                  padding: "8px 16px",
                  background: theme.accent,
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ➕ Add Story
              </button>
            )}
            <button
              onClick={() => setShowNewSprintModal(true)}
              style={{
                padding: "8px 16px",
                background: "var(--surface)",
                border: `1px solid ${theme.accent}40`,
                borderRadius: 8,
                color: theme.accent,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              🆕 New Sprint
            </button>
          </div>
        </div>
      </div>

      {/* Sprint Selector */}
      {sprints.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sprints.slice(0, 5).map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => {
                setActiveSprint(sprint);
                loadMetrics(sprint.id);
              }}
              style={{
                padding: "6px 12px",
                background:
                  activeSprint?.id === sprint.id
                    ? theme.accent
                    : "var(--surface)",
                border: `1px solid ${theme.accent}40`,
                borderRadius: 6,
                color: activeSprint?.id === sprint.id ? "white" : "var(--text)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {sprint.name}
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                {sprint.completedPoints}/{sprint.committedPoints} pts
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Metrics Row */}
      {activeSprint && (
        <div style={{ display: "flex", gap: 12 }}>
          <MetricCard
            label="Committed"
            value={activeSprint.committedPoints ?? 0}
            unit="points"
            color={theme.accent}
          />
          <MetricCard
            label="Completed"
            value={activeSprint.completedPoints ?? 0}
            unit="points"
            color="#10b981"
          />
          <MetricCard
            label="Budget"
            value={`$${(activeSprint.budgetedCost || 0).toLocaleString()}`}
            unit=""
            color="#f59e0b"
          />
          <MetricCard
            label="ROI"
            value={`${(activeSprint.projectedROI || 0).toFixed(0)}%`}
            unit=""
            color={(activeSprint.projectedROI ?? 0) > 50 ? "#10b981" : "#ef4444"}
          />
          {metrics && (
            <MetricCard
              label="Velocity"
              value={metrics.averageVelocity.toFixed(0)}
              unit="pts/sprint"
              color="#8b5cf6"
            />
          )}
        </div>
      )}

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div
          className="card"
          style={{
            background: "#0d1117",
            border: "1px solid #30363d",
            fontFamily: "monospace",
            fontSize: 12,
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ color: "#8b949e" }}>🤖 Crew Activity Log</span>
            <button
              onClick={() => setExecutionLog([])}
              style={{
                background: "transparent",
                border: "none",
                color: "#8b949e",
                cursor: "pointer",
                fontSize: 10,
              }}
            >
              Clear
            </button>
          </div>
          {executionLog.map((log, i) => (
            <div key={i} style={{ color: "#c9d1d9", padding: "2px 0" }}>
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      {activeSprint ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${statusColumns.length}, 1fr)`,
            gap: 12,
            minHeight: 400,
          }}
        >
          {statusColumns.map((column) => (
            <KanbanColumn
              key={column.status}
              column={column}
              stories={(activeSprint.stories || []).filter(
                (s) => s.status === column.status
              )}
              theme={theme}
              onStatusChange={updateStoryStatus}
              onAssignCrew={assignCrew}
              onUnblock={openUnblockModal}
            />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏃</div>
          <h3>No Active Sprint</h3>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>
            Create a sprint to start tracking stories and managing your team.
          </p>
          <button
            onClick={() => setShowNewSprintModal(true)}
            style={{
              padding: "12px 24px",
              background: theme.accent,
              border: "none",
              borderRadius: 8,
              color: "white",
              cursor: "pointer",
            }}
          >
            🚀 Create First Sprint
          </button>
        </div>
      )}

      {/* Burndown Chart Preview */}
      {metrics && activeSprint && (activeSprint.dailyProgress?.length ?? 0) > 0 && (
        <BurndownChart sprint={activeSprint} metrics={metrics} theme={theme} />
      )}

      {/* Modals */}
      {showNewSprintModal && (
        <NewSprintModal
          onClose={() => setShowNewSprintModal(false)}
          onCreate={createSprint}
          theme={theme}
        />
      )}
      {showNewStoryModal && activeSprint && (
        <NewStoryModal
          onClose={() => setShowNewStoryModal(false)}
          onCreate={createStory}
          theme={theme}
        />
      )}
      {showPlanningModal && (
        <PlanningSessionModal
          onClose={() => setShowPlanningModal(false)}
          planningResult={planningResult}
          sprint={activeSprint}
          theme={theme}
        />
      )}
      {showUnblockModal && blockedStoryId && activeSprint && (
        <UnblockModal
          onClose={() => {
            setShowUnblockModal(false);
            setBlockedStoryId(null);
          }}
          story={activeSprint.stories?.find((s) => s.id === blockedStoryId)}
          onUnblock={unblockStory}
          executing={executing}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <div
      className="card"
      style={{
        flex: 1,
        textAlign: "center",
        padding: 12,
        background: `${color}10`,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: "bold", color }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>
        {label} {unit && <span style={{ opacity: 0.7 }}>{unit}</span>}
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  stories,
  theme,
  onStatusChange,
  onAssignCrew,
  onUnblock,
}: {
  column: { status: StoryStatus; label: string; icon: string };
  stories: Story[];
  theme: { accent: string };
  onStatusChange: (storyId: string, status: StoryStatus) => void;
  onAssignCrew: (storyId: string) => void;
  onUnblock: (storyId: string) => void;
}) {
  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 8,
        padding: 12,
        border: `1px solid ${getStoryStatusColor(column.status)}30`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: `2px solid ${getStoryStatusColor(column.status)}`,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {column.icon} {column.label}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            background: `${getStoryStatusColor(column.status)}20`,
            borderRadius: 10,
            color: getStoryStatusColor(column.status),
          }}
        >
          {stories.length} ({totalPoints} pts)
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            theme={theme}
            onStatusChange={onStatusChange}
            onAssignCrew={onAssignCrew}
            onUnblock={onUnblock}
          />
        ))}
      </div>
    </div>
  );
}

function StoryCard({
  story,
  theme,
  onStatusChange,
  onAssignCrew,
  onUnblock,
}: {
  story: Story;
  theme: { accent: string };
  onStatusChange: (storyId: string, status: StoryStatus) => void;
  onAssignCrew: (storyId: string) => void;
  onUnblock: (storyId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card"
      style={{
        padding: 10,
        cursor: "pointer",
        borderLeft: `3px solid ${getPriorityColor(story.priority)}`,
        fontSize: 12,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {getStoryTypeIcon(story.type ?? 'feature')} {story.title}
        </span>
        <span
          style={{
            padding: "2px 6px",
            background: theme.accent,
            borderRadius: 4,
            fontSize: 10,
            color: "white",
          }}
        >
          {story.storyPoints} pts
        </span>
      </div>

      {/* Tags */}
      <div
        style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}
      >
        <span
          style={{
            padding: "1px 6px",
            background: `${getPriorityColor(story.priority)}20`,
            borderRadius: 4,
            fontSize: 9,
            color: getPriorityColor(story.priority),
          }}
        >
          {story.priority}
        </span>
        {(story.estimatedCost ?? 0) > 0 && (
          <span
            style={{
              padding: "1px 6px",
              background: "#f59e0b20",
              borderRadius: 4,
              fontSize: 9,
              color: "#f59e0b",
            }}
          >
            ${story.estimatedCost}
          </span>
        )}
      </div>

      {/* Crew */}
      {(story.assignedCrew?.length ?? 0) > 0 ? (
        <div style={{ display: "flex", gap: 4 }}>
          {(story.assignedCrew ?? []).slice(0, 3).map((crew, i) => (
            <span
              key={i}
              style={{
                padding: "2px 6px",
                background: "var(--surface)",
                borderRadius: 4,
                fontSize: 9,
              }}
            >
              {crew.memberId?.split("_").pop() || "Crew"}
            </span>
          ))}
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssignCrew(story.id);
          }}
          style={{
            padding: "4px 8px",
            background: "var(--surface)",
            border: `1px dashed ${theme.accent}`,
            borderRadius: 4,
            color: theme.accent,
            cursor: "pointer",
            fontSize: 10,
          }}
        >
          ⚡ Assign Crew (Riker)
        </button>
      )}

      {/* Blocked Indicator */}
      {story.status === "blocked" && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: "#ef444420",
            border: "1px solid #ef4444",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 14 }}>🚫</span>
            <span style={{ fontWeight: 600, color: "#ef4444", fontSize: 11 }}>
              Blocked - Human Review Required
            </span>
          </div>
          <p
            style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 8px 0" }}
          >
            {(story as Story & { blockedReason?: string }).blockedReason ||
              "Crew unable to reach consensus. Please review and provide resolution."}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnblock(story.id);
            }}
            style={{
              padding: "6px 12px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: 4,
              color: "white",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              width: "100%",
            }}
          >
            🔓 Review & Unblock
          </button>
        </div>
      )}

      {/* Progress */}
      {(story.tasks?.length ?? 0) > 0 && (
        <div style={{ marginTop: 8 }}>
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
                width: `${story.progress}%`,
                height: "100%",
                background: theme.accent,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--muted)",
              marginTop: 2,
              textAlign: "right",
            }}
          >
            {(story.tasks ?? []).filter((t) => t.status === "completed").length}/
            {(story.tasks?.length ?? 0)} tasks
          </div>
        </div>
      )}

      {/* Expanded Actions */}
      {expanded && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 4,
          }}
        >
          {statusColumns.map((col) => (
            <button
              key={col.status}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(story.id, col.status);
              }}
              disabled={col.status === story.status}
              style={{
                flex: 1,
                padding: "4px",
                background:
                  col.status === story.status
                    ? getStoryStatusColor(col.status)
                    : "var(--surface)",
                border: `1px solid ${getStoryStatusColor(col.status)}40`,
                borderRadius: 4,
                color: col.status === story.status ? "white" : "var(--muted)",
                cursor: col.status === story.status ? "default" : "pointer",
                fontSize: 10,
              }}
            >
              {col.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BurndownChart({
  sprint,
  metrics,
  theme,
}: {
  sprint: Sprint;
  metrics: SprintMetrics;
  theme: { accent: string };
}) {
  const maxPoints = Math.max(
    ...metrics.idealBurndown,
    ...metrics.actualBurndown,
    1
  );

  return (
    <div className="card">
      <h3 style={{ margin: "0 0 16px", color: theme.accent }}>
        📊 Burndown Chart
      </h3>
      <svg viewBox="0 0 400 200" style={{ width: "100%", height: 200 }}>
        {/* Grid */}
        <line x1="40" y1="20" x2="40" y2="170" stroke="var(--border)" />
        <line x1="40" y1="170" x2="380" y2="170" stroke="var(--border)" />

        {/* Ideal line */}
        <polyline
          points={metrics.idealBurndown
            .map(
              (p, i) =>
                `${40 + (i * 340) / (metrics.idealBurndown.length - 1)},${
                  20 + (1 - p / maxPoints) * 150
                }`
            )
            .join(" ")}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Actual line */}
        {metrics.actualBurndown.length > 0 && (
          <polyline
            points={metrics.actualBurndown
              .map(
                (p, i) =>
                  `${40 + (i * 340) / (metrics.idealBurndown.length - 1)},${
                    20 + (1 - p / maxPoints) * 150
                  }`
              )
              .join(" ")}
            fill="none"
            stroke={theme.accent}
            strokeWidth="2"
          />
        )}

        {/* Labels */}
        <text x="20" y="30" fontSize="10" fill="var(--muted)">
          {maxPoints}
        </text>
        <text x="20" y="175" fontSize="10" fill="var(--muted)">
          0
        </text>
        <text x="40" y="190" fontSize="10" fill="var(--muted)">
          Day 1
        </text>
        <text x="360" y="190" fontSize="10" fill="var(--muted)">
          Day {sprint.duration}
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          fontSize: 11,
          color: "var(--muted)",
        }}
      >
        <span>--- Ideal</span>
        <span style={{ color: theme.accent }}>━ Actual</span>
      </div>
    </div>
  );
}

function NewSprintModal({
  onClose,
  onCreate,
  theme,
}: {
  onClose: () => void;
  onCreate: (name: string, goal: string, duration: number) => void;
  theme: { accent: string };
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(14);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 400, maxWidth: "90vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", color: theme.accent }}>
          🆕 Create New Sprint
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Sprint name (e.g., Sprint 1)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
            }}
          />
          <textarea
            placeholder="Sprint goal..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            style={{
              padding: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              resize: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ color: "var(--muted)", fontSize: 13 }}>
              Duration:
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{
                padding: 8,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
              }}
            >
              <option value={7}>1 week</option>
              <option value={14}>2 weeks</option>
              <option value={21}>3 weeks</option>
              <option value={28}>4 weeks</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: 12,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onCreate(name || "New Sprint", goal, duration)}
              style={{
                flex: 1,
                padding: 12,
                background: theme.accent,
                border: "none",
                borderRadius: 8,
                color: "white",
                cursor: "pointer",
              }}
            >
              Create Sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnblockModal({
  onClose,
  story,
  onUnblock,
  executing,
}: {
  onClose: () => void;
  story?: Story;
  onUnblock: (
    resolution: string,
    moveToStatus: "backlog" | "todo" | "in_progress"
  ) => void;
  executing: boolean;
}) {
  const [resolution, setResolution] = useState("");
  const [moveToStatus, setMoveToStatus] = useState<
    "backlog" | "todo" | "in_progress"
  >("todo");

  if (!story) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 500,
          maxHeight: "80vh",
          overflow: "auto",
          background: "var(--bg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>🔓</span>
            <h2 style={{ margin: 0, fontSize: 18 }}>Human Review Required</h2>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            The crew was unable to reach consensus on this story. Please review
            and provide your resolution.
          </p>
        </div>

        {/* Story Info */}
        <div
          style={{
            padding: 12,
            background: "#ef444410",
            border: "1px solid #ef444440",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{story.title}</div>
          <p
            style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px 0" }}
          >
            {story.description}
          </p>
          <div style={{ fontSize: 11, color: "#ef4444" }}>
            {(story as Story & { blockedReason?: string }).blockedReason ||
              "Crew unable to reach consensus after multiple review attempts."}
          </div>
        </div>

        {/* Resolution Input */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              marginBottom: 4,
              color: "var(--muted)",
            }}
          >
            Resolution / Guidance for Crew
          </label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Explain how to proceed, clarify requirements, or provide additional context..."
            style={{
              width: "100%",
              padding: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "inherit",
              fontSize: 13,
              minHeight: 100,
              resize: "vertical",
            }}
          />
        </div>

        {/* Move To Status */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              marginBottom: 8,
              color: "var(--muted)",
            }}
          >
            Move Story To
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["backlog", "todo", "in_progress"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setMoveToStatus(status)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background:
                    moveToStatus === status ? "#10b981" : "var(--surface)",
                  border: `1px solid ${
                    moveToStatus === status ? "#10b981" : "var(--border)"
                  }`,
                  borderRadius: 6,
                  color: moveToStatus === status ? "white" : "var(--muted)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {status === "backlog" && "📋 Backlog"}
                {status === "todo" && "📝 To Do"}
                {status === "in_progress" && "🚀 In Progress"}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {moveToStatus === "backlog" &&
              "Story needs more planning before work begins."}
            {moveToStatus === "todo" &&
              "Story is ready for the crew to pick up."}
            {moveToStatus === "in_progress" &&
              "Story should continue where it left off."}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onUnblock(resolution, moveToStatus)}
            disabled={!resolution.trim() || executing}
            style={{
              flex: 1,
              padding: "10px 16px",
              background:
                !resolution.trim() || executing
                  ? "var(--surface)"
                  : "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: 8,
              color: "white",
              cursor:
                !resolution.trim() || executing ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {executing ? "Unblocking..." : "✅ Unblock Story"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewStoryModal({
  onClose,
  onCreate,
  theme,
}: {
  onClose: () => void;
  onCreate: (story: Partial<Story>) => void;
  theme: { accent: string };
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [storyPoints, setStoryPoints] = useState(3);
  const [type, setType] = useState<Story["type"]>("feature");
  const [priority, setPriority] = useState<Story["priority"]>("medium");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 450, maxWidth: "90vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", color: theme.accent }}>
          ➕ Add Story
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Story title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
            }}
          />
          <textarea
            placeholder="Description / acceptance criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              padding: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              resize: "none",
            }}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>
                Points
              </label>
              <select
                value={storyPoints}
                onChange={(e) => setStoryPoints(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                }}
              >
                {[1, 2, 3, 5, 8, 13, 21].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Story["type"])}
                style={{
                  width: "100%",
                  padding: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                }}
              >
                <option value="feature">✨ Feature</option>
                <option value="bug">🐛 Bug</option>
                <option value="tech_debt">🔧 Tech Debt</option>
                <option value="spike">🔬 Spike</option>
                <option value="documentation">📚 Docs</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Story["priority"])
                }
                style={{
                  width: "100%",
                  padding: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                }}
              >
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: 12,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onCreate({
                  title: title || "New Story",
                  description,
                  storyPoints: storyPoints as Story["storyPoints"],
                  type,
                  priority: getPriorityValue(priority),
                  estimated_hours: storyPoints * 4,
                })
              }
              style={{
                flex: 1,
                padding: 12,
                background: theme.accent,
                border: "none",
                borderRadius: 8,
                color: "white",
                cursor: "pointer",
              }}
            >
              Add Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanningSessionModal({
  onClose,
  planningResult,
  sprint,
  theme,
}: {
  onClose: () => void;
  planningResult: PlanningSession | null;
  sprint: Sprint | null;
  theme: { accent: string };
}) {
  if (!planningResult && !sprint) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: 700,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflow: "auto",
          background: `linear-gradient(180deg, var(--card) 0%, rgba(13,16,34,.98) 100%)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: `2px solid ${theme.accent}`,
          }}
        >
          <h2
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            🖖 Crew Planning Session
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            ×
          </button>
        </div>

        {planningResult ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              <StatBox
                label="Stories"
                value={planningResult.totalStories}
                icon="📋"
                color="#3b82f6"
              />
              <StatBox
                label="Points"
                value={planningResult.totalPoints}
                icon="🎯"
                color="#10b981"
              />
              <StatBox
                label="Budget"
                value={`$${planningResult.totalBudget.toLocaleString()}`}
                icon="💰"
                color="#f59e0b"
              />
              <StatBox
                label="Est. ROI"
                value={`${planningResult.estimatedROI}%`}
                icon="📈"
                color={planningResult.estimatedROI > 50 ? "#10b981" : "#ef4444"}
              />
            </div>

            {/* Crew Analysis */}
            <div className="card" style={{ background: "var(--surface)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>
                👥 Crew Perspectives
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {planningResult.crewAnalysis.map((crew, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 8,
                      background: "var(--card)",
                      borderRadius: 6,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{crew.crewMember}</span>
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        {crew.perspective}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "2px 8px",
                        background: theme.accent,
                        borderRadius: 4,
                        fontSize: 11,
                        color: "white",
                      }}
                    >
                      {crew.storiesSuggested} stories
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliberation */}
            <div className="card" style={{ background: "var(--surface)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>
                ⚖️ Deliberation Results
              </h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                {planningResult.deliberation.consensus}
              </p>
              {planningResult.deliberation.adjustmentsMade > 0 && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 12,
                    color: "#f59e0b",
                  }}
                >
                  📝 {planningResult.deliberation.adjustmentsMade} adjustments
                  made based on crew feedback
                </p>
              )}
            </div>

            {/* Quark & Riker Analysis */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {planningResult.quarkAnalysis && (
                <div
                  className="card"
                  style={{
                    background:
                      "linear-gradient(135deg, #f59e0b10 0%, transparent 100%)",
                    border: "1px solid #f59e0b40",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13,
                      color: "#f59e0b",
                    }}
                  >
                    💰 Quark&apos;s Analysis
                  </h4>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--muted)",
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                    }}
                  >
                    {planningResult.quarkAnalysis}
                  </pre>
                </div>
              )}
              {planningResult.rikerPlan && (
                <div
                  className="card"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f610 0%, transparent 100%)",
                    border: "1px solid #3b82f640",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13,
                      color: "#3b82f6",
                    }}
                  >
                    ⚡ Riker&apos;s Plan
                  </h4>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--muted)",
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                    }}
                  >
                    {planningResult.rikerPlan}
                  </pre>
                </div>
              )}
            </div>

            {/* Session Summary */}
            <div
              style={{
                padding: 12,
                background: `${theme.accent}15`,
                borderRadius: 8,
                border: `1px solid ${theme.accent}30`,
              }}
            >
              <p style={{ margin: 0, fontSize: 13 }}>
                {planningResult.summary}
              </p>
            </div>
          </div>
        ) : sprint ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <p style={{ color: "var(--muted)" }}>
              Sprint &quot;{sprint.name}&quot; has {sprint.stories?.length ?? 0}{" "}
              stories committed.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>
              Total: {sprint.committedPoints ?? 0} points | Budget: $
              {(sprint.budgetedCost ?? 0).toLocaleString()}
            </p>
          </div>
        ) : null}

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 32px",
              background: theme.accent,
              border: "none",
              borderRadius: 8,
              color: "white",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Start Sprint →
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: 12,
        background: `${color}15`,
        borderRadius: 8,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: "bold", color }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
