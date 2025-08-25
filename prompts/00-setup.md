# Prompt 0: Setup & Architecture

You are an expert SvelteKit and Chrome PWA developer.

Set up a **clean, modular codebase** for a Bar Business Management System with POS.

## Requirements:
- Framework: **SvelteKit**
- Persistent offline storage: **IndexedDB with persistent mode**
- Sync mechanism: **Background Sync API** with UUID-based transactions
- Installable **PWA with manifest** and custom splash screens
- Clear directory structure for:
  - `modules/pos`
  - `modules/inventory`
  - `modules/customers`
  - `modules/staff`
  - `modules/reporting`
  - `modules/accounting`
  - `modules/sync`
- Include Tailwind CSS for styling.

## Deliverables:
- Base SvelteKit app scaffold.
- IndexedDB service module with CRUD helpers.
- PWA manifest, service worker, and installable app configuration.
- Documentation on how to run the project and test the offline behavior.
