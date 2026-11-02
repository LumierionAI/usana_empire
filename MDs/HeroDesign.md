# USANA WEB SUITE
## Desktop UX/UI Design Specification
**Version 1.0 | Planning and Design Foundation**

---

## 1. Project Vision

Create a premium, immersive, science-led digital experience that introduces visitors to human biology, cellular nutrition, nutritional support, and the USANA difference.

The website should educate before it promotes.

Rather than immediately presenting a conventional supplement store, the landing page should guide visitors through an engaging scientific narrative. By the time visitors encounter USANA products, they should understand the broader context of nutrition and why product quality, formulation, and scientific credibility matter.

### Primary objectives

1. Capture visitor interest through a compelling opening experience.
2. Explain relevant biological and nutritional concepts in an accessible manner.
3. Establish scientific credibility through verifiable evidence.
4. Introduce USANA through research, formulation, manufacturing, and quality assurance.
5. Convert visitor interest into product exploration, purchasing, or guided product discovery.

### Core design principle

**Don't make visitors read everything. Let them discover the information they want, when they want it.**

The experience should communicate primarily through visual storytelling, supported by concise text and purposeful interactions.

---

## 2. Brand and Visual Identity

### Overall direction

A hybrid of cinematic scientific visualization and premium editorial design.

The website should establish an independent visual identity rather than closely reproducing USANA's official website or branding. USANA branding should be integrated naturally as the narrative progresses.

### Visual characteristics

- Premium and sophisticated.
- Scientific and technologically advanced.
- Immersive and cinematic.
- Modern, clean, and editorial.
- Biologically inspired without sacrificing scientific accuracy.

### Color system

| Color family | Intended purpose |
|---|---|
| Deep navy / near-black | Primary backgrounds and immersive environments |
| Scientific blue | Technology, structures, and scientific information |
| Teal | Biological activity, interaction, and active processes |
| Muted organic tones | Cells, tissues, organs, and biological elements |
| Champagne gold | Premium accents and important emphasis |

Teal and gold should remain restrained. Neither should compete with the primary visual environment.

### Typography

A hybrid editorial and technological typography system:

- Editorial typeface: conceptual headlines and major storytelling moments.
- Geometric sans-serif: explanations, navigation, interface elements, and chapter titles.
- Technical typography: scientific labels, measurements, annotations, and numerical data.

Readability, hierarchy, contrast, and spacing take priority over decorative typography.

---

## 3. Hero Experience

### Primary message

**Are you giving your body what it really needs to thrive?**

### Supporting scientific statement

**Better health begins at the cellular level.**

### Experience design

- Full-viewport composition, approximately 100vh.
- Immersive scientific environment.
- Cinematic motion and carefully controlled scientific animations.
- Scientific accuracy blended with artistic interpretation.
- Minimal text and a clear visual hierarchy.

The hero should immediately establish curiosity without suggesting that visitors are unhealthy or nutritionally deficient.

The transition into the scientific narrative should feel natural and continuous.

---

## 4. Scientific Storytelling Architecture

### Overall structure

The landing page will contain seven major chapters.

| Chapter | Title | Narrative purpose |
|---|---|---|
| 01 | The Question | Introduce the central question and establish curiosity. |
| 02 | The Cellular World | Explore cells and the microscopic foundations of human biology. |
| 03 | The Biological Processes | Explain how biological systems and processes work together. |
| 04 | The Role of Nutrition | Establish the relationship between nutrition and biological functions. |
| 05 | The Importance of Nutritional Support | Explain nutritional needs and the role of nutritional support. |
| 06 | The USANA Difference | Introduce research, formulation, manufacturing, quality, and independent validation. |
| 07 | Explore the Products | Transition into product discovery and conversion. |

### Narrative philosophy

Each chapter should introduce one major concept.

The experience should progressively connect:

Human biology → Cellular activity → Biological processes → Nutrition → Nutritional support → Product quality → Product discovery.

The sequence must feel educational rather than promotional.

### Scroll behavior

Each major chapter should occupy approximately one viewport.

The intended experience uses scroll-driven, chapter-based progression with seamless transitions.

However, scrolling must not become restrictive. Users should retain natural control over navigation, including keyboard, touch, trackpad, and browser scrolling.

Scroll snapping should be implemented with accessibility and graceful fallback behavior.

---

## 5. Chapter Navigation

### Placement

Horizontal navigation bar at the top of the scientific storytelling environment.

This is separate from the primary website navigation at the bottom.

### Default appearance

- All chapter icons remain visible.
- A connecting progress line indicates narrative progression.
- Completed chapters are visually distinguishable.
- The active chapter expands to reveal its title and a short description.
- Upcoming chapters remain visible but subdued.

### Interactive expansion

When activated, the chapter bar expands into a complete chapter index.

The expanded view should provide:

- All chapter titles.
- Short descriptions.
- Chapter icons.
- Current progress.
- Direct navigation to any chapter.

Visitors must be able to navigate backward and forward, including directly from the final scientific chapter to the beginning.

---

## 6. Transitions and Motion Design

### Primary transition philosophy

Continuous camera movement and layered parallax.

The environment should feel like one continuous scientific world rather than seven disconnected screens.

### Motion characteristics

- Foreground, background, scientific elements, and typography move at different speeds.
- Camera movement establishes continuity between chapters.
- Transitions adapt to the subject matter.
- Scientific visual elements may change scale, perspective, and context as the narrative progresses.

### Content-sensitive transitions

Examples:

- Human biology to cellular biology: camera moves inward toward microscopic structures.
- Cellular structures to biological processes: individual elements become connected through animated interactions.
- Biological processes to nutrition: the visual narrative introduces relevant nutrients and biological functions.
- Nutrition to nutritional support: the environment gradually shifts toward a more structured scientific presentation.
- USANA introduction: scientific visualizations transition into research, manufacturing, and quality environments.

Avoid repetitive transitions that make every chapter feel mechanically identical.

### Technical considerations

Prioritize GPU-friendly transformations, opacity transitions, optimized 3D assets, and reduced-motion alternatives.

---

## 7. Scientific Visual Environment

### Visual direction

A hybrid biological universe combining three visual environments.

**Human biology**
- Human body and anatomical systems.
- Organs and interconnected biological functions.
- Carefully selected anatomical visualizations.

**Microscopic biology**
- Cells and cellular structures.
- Molecules and biological components.
- Relevant cellular processes.

**Abstract scientific visualization**
- Data-driven representations.
- Interconnected systems.
- Artistic visual interpretations of complex biological concepts.

All three environments must maintain a consistent visual language, lighting system, color palette, and animation style.

Scientific accuracy takes priority over spectacle. Artistic interpretations must not be presented as literal scientific representations when they are not.

---

## 8. Text and Visual Composition

The website should use adaptive composition rather than repeating the same layout across every chapter.

### Composition principles

- Cellular structures: integrated spatial compositions, 3D elements, and concise scientific labels.
- Nutritional concepts: editorial explanations supported by relevant visualizations.
- Biological processes: animation-led communication.
- Scientific evidence: structured data, concise explanations, and references.
- Product introduction: premium product photography and concise descriptions.

The amount of text should depend on the complexity of the concept.

Avoid unnecessary paragraphs, decorative labels, and redundant explanations.

---

## 9. Interaction Philosophy

### Landing page

Primarily scroll-driven, with contextual interactions that improve understanding.

Examples:

- Clickable scientific structures.
- Expandable scientific explanations.
- Interactive chapter navigation.
- Optional research details.
- Purposeful prompts inviting visitors to explore.

Interactions should be meaningful. Avoid adding controls simply to make the website appear interactive.

### Product discovery page

This is a separate destination with a deeper information architecture.

Product information should support interactive exploration of:

- Intended nutritional benefits and functions.
- Ingredients and quantities.
- Ingredient roles and formulation information.
- Label-directed serving and usage instructions.
- Allergens and relevant warnings.
- Contraindications and suitability considerations.
- Supporting research and formulation information.

Product information must reflect the actual product label and applicable local-market documentation.

---

## 10. Scientific Evidence and Credibility

### Evidence presentation

Use a layered scientific evidence system.

**Layer 1: Visual storytelling**

Concise scientific insights supported by compelling visualizations.

**Layer 2: Evidence highlights**

Selected statistics, charts, study findings, and scientific facts.

**Layer 3: Interactive research explorer**

Detailed explanations, supporting research, study references, methodologies, and source material.

Visitors should control how deeply they explore the evidence.

### Evidence classification

Clearly distinguish:

1. Established scientific knowledge.
2. Findings from individual research studies.
3. Evidence specifically related to USANA formulations or products.

Do not imply that a general scientific finding establishes the effectiveness of a particular supplement.

All scientific claims should be verifiable, appropriately qualified, and supported by credible references.

---

## 11. USANA Brand Introduction

### Presentation strategy

Integrated credibility experience, supported by independent validation.

The USANA introduction should feel like the logical continuation of the educational narrative, not a sudden advertisement.

### Five credibility dimensions

**1. Research and scientific expertise**
- Research informing product development.
- Scientific personnel and expertise.
- Relevant scientific resources.

**2. Formulation philosophy**
- Nutritional considerations.
- Ingredient selection.
- Formulation decisions and rationale.

**3. Manufacturing standards**
- Production facilities and processes.
- Manufacturing standards.
- Quality systems and production controls.

**4. Quality assurance**
- Testing and verification.
- Product consistency.
- Relevant safety and quality controls.

**5. Independent validation**
- Third-party certifications.
- External testing.
- Relevant awards and recognized evaluations.

Independent validation should reinforce the other credibility dimensions.

Every certification, award, ranking, and validation must have a verifiable source, accurate scope, and current status.

Awards must not be presented as scientific proof. Certifications must not be described as validating products or claims beyond their actual scope.

---

## 12. Final Chapter and Conversion Strategy

### Chapter 07: Explore the Products

The final chapter transitions visitors from scientific education into product discovery.

It should provide three distinct pathways.

**Explore Products**
- Opens the dedicated product discovery page.
- Allows visitors to browse the full product range.
- Provides access to detailed product information.

**Buy Now**
- Directs visitors to `https://empires.usana.com`.
- Provides a direct purchasing pathway for customers ready to buy.

**Get Product Guidance**
- Helps visitors navigate products based on their nutritional interests and circumstances.
- Explains relevant nutritional functions and available product information.
- Provides access to ingredients, quantities, usage instructions, and precautions.

### Medical-condition-related guidance

Visitors may want to explore nutritional considerations associated with particular medical conditions.

The guidance experience must remain informational, not diagnostic or prescriptive.

It must not:
- Diagnose medical conditions.
- Recommend supplements as treatments or cures.
- Guarantee health outcomes.
- Imply that a supplement is automatically appropriate for someone with a particular condition.

It should:
- Explain relevant nutritional information.
- Present product-specific warnings and contraindications.
- Encourage consultation with qualified healthcare professionals, especially for diagnosed conditions, medication use, pregnancy, or other special circumstances.

---

## 13. Primary Website Navigation

### Placement

Floating navigation at the bottom of the desktop viewport.

It is separate from the top chapter navigation.

### Behavior

Hybrid adaptive navigation:

- Transparent appearance over the hero.
- Context-aware styling across different chapters.
- More defined appearance when necessary for readability.
- Hides during downward scrolling.
- Reappears during upward scrolling or user interaction.
- Maintains convenient access to important website destinations.

Products and Buy Now must remain easy to reach.

The navigation should complement the scientific experience rather than compete with it.

---

## 14. Performance, Accessibility, and Bandwidth

### Guiding principle

The website should remain impressive on capable devices without becoming unusable on less capable ones or slower internet connections.

### Adaptive rendering

**High-performance devices**
- Full cinematic 3D.
- Richer animations.
- Layered parallax.
- High-quality scientific visualizations.

**Mid-range devices**
- Optimized 3D assets.
- Reduced particle effects.
- Simplified transitions.
- Compressed media.

**Low-end devices**
- Lightweight animations.
- Static visual alternatives.
- Reduced GPU-intensive effects.
- Graceful fallbacks when WebGL is unavailable.

### Low-bandwidth optimization

- Responsive image delivery.
- Modern image formats such as WebP and AVIF.
- Compressed assets.
- Deferred and lazy loading.
- Minimal unnecessary autoplay media.
- Efficient JavaScript and dependency management.
- Avoid unnecessary downloads before visitors reach relevant content.
- Preserve core functionality when external media fails.

### Accessibility

- Reduced-motion support.
- Keyboard navigation.
- Screen-reader compatibility.
- Sufficient contrast.
- Readable typography.
- Touch-friendly controls.
- Accessible labels and interaction states.
- Graceful alternatives for advanced visual effects.

Performance should be considered part of the design itself, not merely a final optimization step.

---

## 15. Desktop Design Constraints

The following principles must remain consistent throughout development:

1. The landing page is educational first, promotional second.
2. Product catalogs belong on the separate product discovery page.
3. Products and Buy Now remain accessible through primary navigation.
4. Scientific accuracy takes priority over visual spectacle.
5. All scientific and product claims require appropriate evidence.
6. Visitors control how much information they explore.
7. Interactions must have a clear purpose.
8. Motion must not compromise usability.
9. Low-end devices and low-bandwidth users must retain access to the experience.
10. The desktop and mobile experiences must be designed separately.

---

## 16. Next Design Phase

The high-level desktop architecture is established. The next phase should translate this specification into detailed section-by-section UX/UI designs.

Recommended sequence:

1. Define the exact desktop navigation structure.
2. Detail the hero composition and visual hierarchy.
3. Design the seven chapters individually.
4. Map the chapter transitions.
5. Define interactive scientific elements and evidence panels.
6. Design the USANA credibility experience.
7. Design the final conversion section.
8. Establish typography, spacing, component, and animation systems.
9. Review the complete desktop experience for consistency.
10. Plan the separate mobile experience.

**Status:** High-level desktop direction established. Detailed UX/UI design and technical implementation remain pending.