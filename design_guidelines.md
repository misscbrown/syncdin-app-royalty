# Design Guidelines

## Design Approach

**Selected Approach**: Hybrid - Modern SaaS aesthetic drawing inspiration from Linear's clean typography and spatial rhythm, combined with Notion's approachable interface patterns. This creates a professional yet accessible experience suitable for various web applications.

**Core Principles**:
- Clean, spacious layouts with purposeful whitespace
- Strong typographic hierarchy
- Component consistency throughout the application
- Efficient information architecture

---

## Typography System

**Font Families** (via Google Fonts CDN):
- **Primary**: Inter (headings, UI elements, body)
- **Monospace**: JetBrains Mono (code, data displays)

**Type Scale**:
- **Hero/Display**: text-5xl to text-6xl, font-semibold (48-60px)
- **Page Headings**: text-3xl to text-4xl, font-semibold (30-36px)
- **Section Headings**: text-2xl, font-semibold (24px)
- **Subheadings**: text-xl, font-medium (20px)
- **Body**: text-base, font-normal (16px)
- **Small/Meta**: text-sm, font-normal (14px)
- **Micro**: text-xs (12px)

---

## Layout System

**Spacing Units**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24** for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20, py-24
- Element gaps: gap-2, gap-4, gap-6, gap-8

**Container Strategy**:
- Max-width containers: max-w-7xl for main content areas
- Full-width sections with inner containers
- Consistent horizontal padding: px-4 md:px-6 lg:px-8

**Grid Patterns**:
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Feature sections: grid-cols-1 lg:grid-cols-2
- Data tables: Full-width responsive

---

## Component Library

### Navigation
**Top Navigation Bar**:
- Fixed or sticky positioning
- Height: h-16
- Logo left, navigation center/right, user actions far right
- Subtle border-b for separation
- Includes: search, notifications, user avatar

**Sidebar Navigation** (if applicable):
- Width: w-64
- Collapsible to icon-only on mobile
- Group navigation items with section labels
- Active state with subtle background

### Cards & Containers
**Standard Card**:
- Border radius: rounded-lg (8px)
- Border: border with subtle treatment
- Padding: p-6
- Shadow: shadow-sm with hover:shadow-md transition

**Section Containers**:
- Clear visual separation with spacing
- Optional subtle borders or backgrounds

### Forms
**Input Fields**:
- Height: h-10 to h-12
- Border radius: rounded-md
- Border with focus ring
- Placeholder text styling
- Consistent spacing: space-y-4 for form groups

**Buttons**:
- Primary: Solid fill, font-medium, px-4 py-2, rounded-md
- Secondary: Border style with transparent background
- Sizes: text-sm (small), text-base (default), text-lg (large)
- All buttons include proper hover and active states

### Data Display
**Tables**:
- Zebra striping for row separation
- Sticky headers for long tables
- Hover states on rows
- Responsive: stack on mobile or horizontal scroll

**Lists**:
- Consistent spacing: space-y-2 to space-y-4
- Clear visual hierarchy
- Icons aligned with text

### Overlays
**Modals**:
- Centered positioning with backdrop
- Max-width: max-w-md to max-w-2xl based on content
- Padding: p-6
- Close button top-right

**Tooltips/Popovers**:
- Small text-sm
- Subtle background with border
- Arrow pointer to anchor element

---

## Page Layouts

### Landing/Marketing Pages
**Hero Section**:
- Height: min-h-screen or 80vh
- Large hero image as background (full-bleed)
- Centered content with heading + subheading + CTA
- CTA buttons with blurred background (backdrop-blur-sm bg-white/10)

**Features Section**:
- 3-column grid on desktop (grid-cols-1 md:grid-cols-3)
- Icon + heading + description cards
- Spacing: py-20

**Social Proof/Testimonials**:
- 2-3 column grid
- Customer photo + quote + name/title
- Spacing: py-16

**CTA Section**:
- Full-width with background treatment
- Centered heading + supporting text + button
- Generous padding: py-24

**Footer**:
- Multi-column layout (grid-cols-2 md:grid-cols-4)
- Logo, navigation links, social media, newsletter signup
- Copyright info
- Padding: py-12

### Application Pages
**Dashboard Layout**:
- Top navigation (h-16)
- Optional sidebar (w-64)
- Main content area with padding
- Card-based metric displays
- Chart/graph sections

**List/Table Views**:
- Search and filters at top
- Action buttons (Add New, Export, etc.)
- Paginated data tables
- Empty states with helpful guidance

**Detail Views**:
- Breadcrumb navigation
- Main content area max-w-4xl
- Sidebar for metadata/actions
- Related items section

---

## Animations

**Minimal Animation Strategy**:
- Page transitions: Simple fade-in
- Hover states: Subtle scale or shadow changes
- Loading states: Spinner or skeleton screens
- NO scroll-triggered animations unless essential
- Transition duration: 150-200ms for interactions

---

## Images

**Hero Image**:
- Large, high-quality background image covering full hero section
- Subject: Modern workspace, abstract technology, or relevant product imagery
- Treatment: Subtle overlay gradient for text readability

**Feature Section Images** (if used):
- Product screenshots or illustrative graphics
- Placement: Alternating left/right with text content
- Aspect ratio: 16:9 or square based on content

**Avatars/Profile Images**:
- Circular, consistent sizes (h-8, h-10, h-12)
- Fallback to initials with background

---

## Icons

**Icon Library**: Heroicons (via CDN)
- Outline style for navigation and subtle elements
- Solid style for active states and emphasis
- Consistent sizing: h-5 w-5 for inline, h-6 w-6 for standalone

---

## Accessibility

- Maintain WCAG 2.1 AA contrast ratios minimum
- All interactive elements keyboard accessible
- Focus states clearly visible with ring utilities
- Semantic HTML structure throughout
- ARIA labels for icon-only buttons
- Form labels always present (visible or sr-only)