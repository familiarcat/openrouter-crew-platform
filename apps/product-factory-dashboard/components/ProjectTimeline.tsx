"use client";

import { useState, useRef, useEffect } from "react";

export interface Milestone {
  id: string;
  name: string;
  date: string; // ISO date
  status: "completed" | "in-progress" | "planned" | "at-risk" | "blocked";
  description: string;
  progress: number; // 0-100
  assignees?: string[];
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  status: "completed" | "in-progress" | "planned";
  progress: number;
  startDate?: string;
  endDate?: string;
}

export interface ProjectTimelineProps {
  projectName: string;
  projectProgress: number;
  milestones: Milestone[];
  mode?: "compact" | "detailed";
  zoomLevel?: "1m" | "3m" | "6m" | "all";
  onMilestoneClick?: (milestone: Milestone) => void;
  onMilestoneDrag?: (milestone: Milestone, newDate: string) => void;
  interactive?: boolean;
  className?: string;
}

const STATUS_COLORS = {
  completed: "#28d99a",
  "in-progress": "#5ae6ff",
  planned: "#b9c0e5",
  "at-risk": "#ffd166",
  blocked: "#ff5c93",
};

const STATUS_ICONS = {
  completed: "✅",
  "in-progress": "⚡",
  planned: "📅",
  "at-risk": "⚠️",
  blocked: "🚫",
};

export function ProjectTimeline({
  projectName,
  projectProgress,
  milestones,
  mode = "compact",
  zoomLevel = "all",
  onMilestoneClick,
  onMilestoneDrag,
  interactive = true,
  className = "",
}: ProjectTimelineProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate timeline range based on milestones
  const dates = milestones.map((m) => new Date(m.date).getTime());
  const minDate = dates.length > 0 ? Math.min(...dates) : Date.now();
  const maxDate = dates.length > 0 ? Math.max(...dates) : Date.now() + 90 * 24 * 60 * 60 * 1000;

  // Apply zoom level
  const now = Date.now();
  let startDate = minDate;
  let endDate = maxDate;

  if (zoomLevel === "1m") {
    startDate = now - 15 * 24 * 60 * 60 * 1000; // 15 days before
    endDate = now + 45 * 24 * 60 * 60 * 1000; // 45 days after
  } else if (zoomLevel === "3m") {
    startDate = now - 45 * 24 * 60 * 60 * 1000;
    endDate = now + 135 * 24 * 60 * 60 * 1000;
  } else if (zoomLevel === "6m") {
    startDate = now - 90 * 24 * 60 * 60 * 1000;
    endDate = now + 270 * 24 * 60 * 60 * 1000;
  }

  const timeRange = endDate - startDate;

  // Calculate milestone positions (0-100%)
  const getMilestonePosition = (date: string) => {
    const timestamp = new Date(date).getTime();
    return ((timestamp - startDate) / timeRange) * 100;
  };

  // Format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Generate month markers
  const getMonthMarkers = () => {
    const markers: { position: number; label: string }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const position = getMilestonePosition(current.toISOString());
      if (position >= 0 && position <= 100) {
        markers.push({
          position,
          label: current.toLocaleDateString("en-US", {
            month: "short",
            year: current.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
          }),
        });
      }
      current.setMonth(current.getMonth() + 1);
    }
    return markers;
  };

  const monthMarkers = getMonthMarkers();

  const handleMilestoneClick = (milestone: Milestone) => {
    if (!interactive) return;
    setSelectedMilestone(selectedMilestone === milestone.id ? null : milestone.id);
    onMilestoneClick?.(milestone);
  };

  return (
    <div className={`project-timeline ${mode} ${className}`}>
      {/* Header */}
      <div className="timeline-header">
        <div className="timeline-title">
          <h3>{projectName}</h3>
          <span className="progress-badge">{projectProgress}% Complete</span>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="timeline-container" ref={timelineRef}>
        {/* Month Markers */}
        <div className="month-markers">
          {monthMarkers.map((marker, i) => (
            <div
              key={i}
              className="month-marker"
              style={{ left: `${marker.position}%` }}
            >
              <span className="month-label">{marker.label}</span>
              <div className="month-line" />
            </div>
          ))}
        </div>

        {/* Timeline Line */}
        <div className="timeline-line">
          <div
            className="timeline-progress"
            style={{ width: `${projectProgress}%` }}
          />
        </div>

        {/* Milestones */}
        <div className="milestones">
          {milestones.map((milestone) => {
            const position = getMilestonePosition(milestone.date);
            const isSelected = selectedMilestone === milestone.id;
            const isHovered = hoveredMilestone === milestone.id;

            return (
              <div
                key={milestone.id}
                className={`milestone ${milestone.status} ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
                style={{ left: `${position}%` }}
                onClick={() => handleMilestoneClick(milestone)}
                onMouseEnter={() => setHoveredMilestone(milestone.id)}
                onMouseLeave={() => setHoveredMilestone(null)}
              >
                {/* Milestone Marker */}
                <div
                  className="milestone-marker"
                  style={{ backgroundColor: STATUS_COLORS[milestone.status] }}
                >
                  <span className="milestone-icon">{STATUS_ICONS[milestone.status]}</span>
                </div>

                {/* Milestone Label */}
                <div className="milestone-label">
                  <span className="milestone-name">{milestone.name}</span>
                  <span className="milestone-date">{formatDate(milestone.date)}</span>
                </div>

                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="milestone-tooltip">
                    <div className="tooltip-header">
                      <strong>{milestone.name}</strong>
                      <span className="tooltip-status">{milestone.status}</span>
                    </div>
                    <div className="tooltip-date">{formatDate(milestone.date)}</div>
                    {milestone.description && (
                      <div className="tooltip-description">{milestone.description}</div>
                    )}
                    {milestone.assignees && milestone.assignees.length > 0 && (
                      <div className="tooltip-assignees">
                        Crew: {milestone.assignees.join(", ")}
                      </div>
                    )}
                    <div className="tooltip-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${milestone.progress}%`,
                            backgroundColor: STATUS_COLORS[milestone.status],
                          }}
                        />
                      </div>
                      <span className="progress-text">{milestone.progress}%</span>
                    </div>
                  </div>
                )}

                {/* Expanded Details (Detailed Mode) */}
                {mode === "detailed" && isSelected && milestone.tasks && (
                  <div className="milestone-details">
                    <div className="tasks-swimlane">
                      <div className="swimlane-header">Tasks</div>
                      {milestone.tasks.map((task) => (
                        <div key={task.id} className={`task-row ${task.status}`}>
                          <span className="task-name">{task.name}</span>
                          <div className="task-progress">
                            <div
                              className="task-progress-bar"
                              style={{ width: `${task.progress}%` }}
                            />
                            <span className="task-progress-text">{task.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="overall-progress">
        <div className="progress-label">Overall Progress</div>
        <div className="progress-bar-large">
          <div
            className="progress-fill-large"
            style={{ width: `${projectProgress}%` }}
          />
        </div>
        <div className="progress-percentage">{projectProgress}%</div>
      </div>

      {/* Next Milestone (Compact Mode) */}
      {mode === "compact" && (
        <div className="next-milestone">
          {(() => {
            const upcoming = milestones.find(
              (m) =>
                m.status === "in-progress" ||
                (m.status === "planned" && new Date(m.date) > new Date())
            );
            if (upcoming) {
              return (
                <>
                  <span className="next-label">Next:</span>
                  <span className="next-name">{upcoming.name}</span>
                  <span className="next-date">({formatDate(upcoming.date)})</span>
                </>
              );
            }
            return <span className="next-label">All milestones completed!</span>;
          })()}
        </div>
      )}

      <style jsx>{`
        .project-timeline {
          background: var(--panel, #0d1022);
          border: 1px solid var(--line, rgba(255, 255, 255, 0.13));
          border-radius: 12px;
          padding: 20px;
          color: var(--text, #eef1ff);
        }

        .timeline-header {
          margin-bottom: 24px;
        }

        .timeline-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .timeline-title h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .progress-badge {
          font-size: 13px;
          color: var(--muted, #b9c0e5);
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 12px;
          border-radius: 12px;
        }

        .timeline-container {
          position: relative;
          min-height: 120px;
          margin: 24px 0;
        }

        .month-markers {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          display: flex;
        }

        .month-marker {
          position: absolute;
          transform: translateX(-50%);
        }

        .month-label {
          font-size: 11px;
          color: var(--muted, #b9c0e5);
          white-space: nowrap;
        }

        .month-line {
          width: 1px;
          height: 100px;
          background: rgba(255, 255, 255, 0.08);
          margin-top: 4px;
        }

        .timeline-line {
          position: absolute;
          top: 60px;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .timeline-progress {
          height: 100%;
          background: linear-gradient(90deg, #28d99a 0%, #5ae6ff 100%);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .milestones {
          position: relative;
          height: 120px;
        }

        .milestone {
          position: absolute;
          top: 40px;
          transform: translateX(-50%);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .milestone:hover {
          z-index: 10;
        }

        .milestone-marker {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--panel, #0d1022);
          transition: all 0.2s ease;
        }

        .milestone:hover .milestone-marker,
        .milestone.selected .milestone-marker {
          transform: scale(1.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .milestone-icon {
          font-size: 12px;
        }

        .milestone-label {
          position: absolute;
          top: 32px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          white-space: nowrap;
          font-size: 11px;
        }

        .milestone-name {
          display: block;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .milestone-date {
          display: block;
          font-size: 10px;
          color: var(--muted, #b9c0e5);
        }

        .milestone-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: var(--panel2, #0b0f1d);
          border: 1px solid var(--line, rgba(255, 255, 255, 0.13));
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
          margin-bottom: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          z-index: 100;
          font-size: 12px;
        }

        .milestone-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: var(--panel2, #0b0f1d);
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .tooltip-status {
          font-size: 10px;
          text-transform: capitalize;
          padding: 2px 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
        }

        .tooltip-date {
          color: var(--muted, #b9c0e5);
          margin-bottom: 8px;
        }

        .tooltip-description {
          margin-bottom: 8px;
          font-size: 11px;
          line-height: 1.4;
        }

        .tooltip-assignees {
          font-size: 11px;
          color: var(--muted, #b9c0e5);
          margin-bottom: 8px;
        }

        .tooltip-progress {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 11px;
          min-width: 32px;
          text-align: right;
        }

        .milestone-details {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--panel2, #0b0f1d);
          border: 1px solid var(--line, rgba(255, 255, 255, 0.13));
          border-radius: 8px;
          padding: 12px;
          min-width: 300px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .tasks-swimlane {
          font-size: 12px;
        }

        .swimlane-header {
          font-weight: 600;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.13));
        }

        .task-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          margin-bottom: 4px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }

        .task-row.completed {
          opacity: 0.6;
        }

        .task-name {
          flex: 1;
          margin-right: 12px;
        }

        .task-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
        }

        .task-progress-bar {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .task-progress-bar > div {
          height: 100%;
          background: #5ae6ff;
        }

        .task-progress-text {
          font-size: 10px;
          min-width: 32px;
          text-align: right;
          color: var(--muted, #b9c0e5);
        }

        .overall-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--line, rgba(255, 255, 255, 0.13));
        }

        .progress-label {
          font-size: 13px;
          color: var(--muted, #b9c0e5);
          min-width: 120px;
        }

        .progress-bar-large {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill-large {
          height: 100%;
          background: linear-gradient(90deg, #28d99a 0%, #5ae6ff 100%);
          transition: width 0.3s ease;
        }

        .progress-percentage {
          font-size: 14px;
          font-weight: 600;
          min-width: 48px;
          text-align: right;
        }

        .next-milestone {
          margin-top: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .next-label {
          color: var(--muted, #b9c0e5);
        }

        .next-name {
          font-weight: 500;
        }

        .next-date {
          color: var(--muted, #b9c0e5);
        }

        /* Compact Mode Adjustments */
        .project-timeline.compact {
          padding: 16px;
        }

        .project-timeline.compact .timeline-container {
          min-height: 100px;
        }

        .project-timeline.compact .milestone-label {
          font-size: 10px;
        }

        .project-timeline.compact .milestone-marker {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
}
