
# The Money Tree of Life — Lovable Migration & Enhancement Plan

## Overview
Migrate the existing Express.js + React codebase into Lovable's client-side React + Supabase Cloud architecture, then implement the 5 priority features.

---

## Phase 1: Codebase Import & Adaptation
- Extract the uploaded zip and migrate all client-side code (components, pages, stores, styles, assets) into the Lovable project structure
- Remove Express server dependency — replace with Supabase Edge Functions where needed
- Adapt Wouter routing to React Router (already in place)
- Preserve all 10 routes, 6 reading themes, Zustand stores, and Framer Motion animations
- Keep localStorage as fallback while setting up Supabase

## Phase 2: Supabase Cloud Setup
- Enable Lovable Cloud (database, auth, edge functions)
- Create database tables: `profiles`, `user_progress` (chapter completion, coins, achievements), `quiz_results`, `reading_sessions`
- Set up RLS policies so kids see only their own data and parents can view their children's data
- Create a `user_roles` table (parent vs. child roles)
- Migrate localStorage-backed storage to Supabase with read/write hooks via TanStack Query
- Add authentication (email/password signup for parents, child accounts linked to parents)

## Phase 3: AI Chat with Character Personas (Priority #1)
- Create a Supabase Edge Function (`chat`) using Lovable AI gateway
- Use the character personas from `ai/persona.ts` as system prompts — each companion (Liam, Emma, Mateo, Aisha) responds in character
- Build a chat UI panel accessible from the reader view
- Stream responses token-by-token with markdown rendering

## Phase 4: Mobile-Responsive Reader (Priority #2)
- Convert the ReaderShell sidebar into a slide-out drawer on screens < 768px
- Make chapter content, font size controls, and theme switcher touch-friendly
- Ensure all reading themes work well on mobile

## Phase 5: Parent Dashboard (Priority #4)
- New `/parent-dashboard` route (role-gated)
- Show child's reading progress: chapters completed, time spent, quiz scores, coins earned
- Simple charts/progress bars for at-a-glance tracking

## Phase 6: Visual Polish (Priority #5)
- Redesign the homepage hero with engaging illustrations and clear CTA
- Polish chapter cards with better imagery, progress indicators, and hover animations
- Ensure consistent use of the app's playful, kid-friendly design language

---

## Implementation Order
1. **Import & adapt codebase** (foundation for everything)
2. **Supabase Cloud setup** (database, auth, storage migration)
3. **AI Chat** (your top priority)
4. **Mobile-responsive reader**
5. **Parent dashboard**
6. **Visual polish**
