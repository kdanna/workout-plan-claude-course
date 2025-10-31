# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a workout plan application built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. The project is in early stages and currently contains only the default Next.js starter template.

## Development Commands

### Running the Development Server
```bash
npm run dev
```
Development server runs at http://localhost:3000. Pages auto-reload on file changes.

### Building for Production
```bash
npm run build
```
Creates an optimized production build in the `.next` directory.

### Starting Production Server
```bash
npm start
```
Runs the production build (must run `npm run build` first).

### Linting
```bash
npm run lint
```
Runs ESLint with Next.js configurations (core-web-vitals and TypeScript).

## Project Structure

This is a Next.js App Router application using the following architecture:

### Directory Structure
- `app/` - App Router directory containing pages and layouts
  - `page.tsx` - Home page component
  - `layout.tsx` - Root layout with font configuration (Geist Sans & Geist Mono)
  - `globals.css` - Global styles with Tailwind CSS v4 imports and CSS variables
- `public/` - Static assets (images, SVGs, etc.)

### Key Technologies

**Framework & Language:**
- Next.js 16.0.1 with App Router
- React 19.2.0
- TypeScript 5+ with strict mode enabled

**Styling:**
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Tailwind v4 uses inline `@theme` directive in CSS (see `app/globals.css`)
- CSS custom properties for theming (`--background`, `--foreground`)
- Dark mode support via `prefers-color-scheme`

**Fonts:**
- Geist Sans and Geist Mono from `next/font/google`
- Font variables configured in root layout

### TypeScript Configuration
- Path alias: `@/*` maps to project root
- Module resolution: bundler
- JSX: react-jsx (React 19 compatible)
- Strict mode enabled

## Styling Approach

This project uses Tailwind CSS v4, which has important differences from v3:
- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- Theme customization via `@theme inline` blocks in CSS
- CSS custom properties are integrated with Tailwind's theme system
- Utility classes work the same as v3

When adding new components, use Tailwind utility classes and reference existing CSS variables (`--background`, `--foreground`, `--font-sans`, `--font-mono`) for consistency.

## Next.js App Router Notes

- This uses the App Router (not Pages Router)
- Components in `app/` are Server Components by default
- Use `"use client"` directive for components needing interactivity, hooks, or browser APIs
- Route structure defined by directory names in `app/`
- Layouts cascade from parent to child routes
