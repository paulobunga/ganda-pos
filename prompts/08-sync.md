# Prompt 8: Sync & Background Services

Develop the **sync and background services**.

## Requirements:
- Queue-based sync using Background Sync API.
- Retry logic with exponential backoff.
- Conflict resolution strategy:
  - Server wins for stock updates.
  - Merge logs for sales and tabs.
- Status indicators for sync state.
- Export/import local database for manual backups.

## Deliverables:
- Sync service module.
- UI for sync status and manual trigger.
- Backup/restore workflow using File System Access API.
- Integration tests for offline/online transitions.
