# Phase 5: System A Overhaul (Cinematic Public Web Suite)

## Objective
Re-engineer the public-facing USANA Empire pages (Landing, Product Portfolio, and Business Opportunity) into a highly engaging, gamified, and futuristic React SPA (Single Page Application). We will utilize `framer-motion` to deliver a cinematic, presentation-like experience that captivates prospects.

## 1. Architectural Strategy: The Cinematic Engine
System B uses Mantine for data density. System A will use React + Framer Motion for visual storytelling.
*   **Action:** Strip out the legacy vanilla JS scroll engines (`scroll-engine.js`, `progress-rail.js`).
*   **Action:** Build a React-based `ScrollSnapContainer` that leverages Framer Motion for PowerPoint-like smooth section transitions and parallax effects.
*   **Action:** Implement global page transitions (morphing routing) so navigating between the Landing, Product, and Business pages feels like an uninterrupted futuristic application rather than a traditional website.

## 2. The Unified `CinematicSection` Component
Instead of standard HTML blocks, we will build a highly interactive component to render the `sections.json` and `compensation.json` data.
*   **Morphing Elements:** Using Framer Motion's `layoutId`, images and text blocks will fluidly morph and scale into place as the user scrolls.
*   **Rich Media Integration:** Extend the JSON schema to accept `youtubeId`. We will build a sleek, custom video player overlay that feels native to the futuristic aesthetic, avoiding the clunky default YouTube iframe look.
*   **Gamified Interactions:** Hover states won't just change colors; they will trigger 3D tilts, glows, and micro-animations to make the interface feel alive and responsive.

## 3. Product Portfolio E-Commerce Upgrade (Visual Focus)
The Product page (`app/product/`) will use the same `products.json` but present it entirely differently than the Guidance tool.
*   **Action:** Build an immersive, full-screen cover-flow or interactive grid for the products.
*   **Action:** Clicking a product won't just open a modal; the product image will morph into the center of the screen while the scientific benefits animate in around it, similar to a high-end tech product showcase.

## 4. Brand & Compliance Alignment
*   **Action:** Map the global CSS tokens (`styles/tokens.css`) directly into the React components to maintain strict brand consistency (colors, typography) while allowing for heavy animation.
*   **Action:** Ensure the Independent Distributor disclaimers are elegantly integrated into the footer or a persistent, non-intrusive glassmorphism overlay.