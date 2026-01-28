/**
 * All Active Sprints Page
 *
 * Global view of all active sprints across all projects.
 * Shows horizontal timeline with filtering and real-time updates.
 */

import HorizontalSprintTimeline from '@/components/HorizontalSprintTimeline';
import styles from './sprints.module.css';

export const metadata = {
  title: 'All Active Sprints | Alex AI',
  description: 'View and manage all active sprints across your projects'
};

export default function SprintsPage() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>
              🚀 All Active Sprints
            </h1>
            <p className={styles.subtitle}>
              View and manage sprints across all your projects
            </p>
          </div>

          <a
            href="/api/sprints?status=active&include_stories=true"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.apiLink}
          >
            View API Data
          </a>
        </div>
      </div>

      {/* Sprint Timeline - Show All Sprints */}
      <div className={styles.content}>
        <HorizontalSprintTimeline showAllSprints={true} />
      </div>
    </div>
  );
}
