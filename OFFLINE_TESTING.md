# Offline & PWA Testing Guide

This document provides instructions on how to test the Progressive Web App (PWA) features of this application, including offline functionality and Background Sync.

## New Architecture Overview

The codebase has been refactored into a modular structure under `src/modules`. Each business domain (POS, Inventory, etc.) has its own module. The SvelteKit routes in `src/routes` are now thin wrappers that import their UI and logic from these modules. This separation of concerns makes the codebase easier to maintain and scale.

## Testing PWA Installation

1.  Build and preview the application:
    ```bash
    npm run build
    npm run preview
    ```
2.  Open the application in a Chromium-based browser (like Chrome or Edge).
3.  In the address bar, an "Install" icon should appear.
4.  Click the icon to install the application to your desktop. The app should now be runnable from its own window.

## Testing Offline Functionality

1.  Run the application and navigate to the POS cashier view.
2.  Open the browser's developer tools (F12).
3.  Go to the "Network" tab and check the "Offline" checkbox to simulate being offline.
4.  Refresh the page. The application should still load and be functional, served by the service worker.
5.  Try performing actions like adding items to the cart, saving a customer tab, etc. These actions should work while offline.

## Testing Background Sync (Placeholder)

The service worker is set up to handle Background Sync, but the full logic is not yet implemented. To test the current placeholder:

1.  With the application running, go to the developer tools.
2.  Go to the "Application" tab, then "Service Workers".
3.  Find the section for "Sync" and enter `sync-transactions` as the tag.
4.  Click the "Sync" button.
5.  Check the "Console" tab. You should see log messages from the service worker indicating that the sync event was received and processed.

This guide provides a solid starting point for testing the application's PWA capabilities.
