# Lumio Banking App

A modern banking web application built with React, TypeScript, and Vite. Migrated from Lovable to Replit.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS, shadcn/ui components
- **State/Data**: TanStack Query, React Hook Form, Zod
- **Animations**: Framer Motion
- **Charts**: Recharts

## Project Structure

- `src/pages/` - Page components (Index, Login, Dashboard, Transfer, History, Profile)
- `src/components/` - Reusable UI components including shadcn/ui
- `src/context/` - App context providers
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions

## Running the App

The app runs on port 5000 via `npm run dev`. The workflow "Start application" handles this automatically.

## Notes

- Removed `lovable-tagger` (Lovable-specific dev dependency) from vite config
- Vite configured to bind to `0.0.0.0` with `allowedHosts: true` for Replit's proxy
- Pure frontend SPA — no backend server required
