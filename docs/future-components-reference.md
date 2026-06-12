# Future Components Reference

This document captures the complete list of shadcn/ui components as potential future enhancements to our component standard. Components are categorized by priority and use case to guide strategic expansion.

## Component Categories

### 🚀 High Priority (Core UI Patterns)
Components that address fundamental UI needs and are likely to be requested early.

| Component | Description | Potential Use Cases | Integration Notes |
| --- | --- | --- | --- |
| **Toggle** | Accessible switch component | Settings, preferences, feature flags | Already planned in standard |
| **Modal** | Layered dialog with focus trapping | Confirmations, forms, focused interactions | Already planned in standard |
| **Select** | Dropdown selection | Form inputs, filtering, navigation | High demand for forms |
| **Checkbox** | Multi-select input | Forms, settings, bulk actions | Essential for forms |
| **Radio Group** | Single-select input | Forms, preferences, choices | Essential for forms |
| **Label** | Form field labels | Accessibility, form structure | Needed for form completeness |
| **Textarea** | Multi-line text input | Forms, comments, descriptions | Complements existing Input |

### 📈 Medium Priority (Common Patterns)
Components that are frequently needed but not as fundamental as core UI elements.

| Component | Description | Potential Use Cases | Integration Notes |
| --- | --- | --- | --- |
| **Alert** | Prominent messages for users | Notifications, warnings, success messages | Important for user feedback |
| **Badge** | Small status indicators | Tags, counts, status display | Lightweight and versatile |
| **Avatar** | User profile images or initials | User profiles, comments, team displays | Common in modern UIs |
| **Tabs** | Tabbed interface | Content organization, settings, navigation | Good for complex interfaces |
| **Tooltip** | Hover information popup | Help text, additional context | Improves UX and accessibility |
| **Progress** | Progress indicator | Loading states, multi-step processes | Provides user feedback |
| **Separator** | Visual divider | Content grouping, visual hierarchy | Simple but useful |
| **Skeleton** | Loading placeholder | Loading states, content placeholders | Improves perceived performance |

### 🔧 Utility Components (Specialized Use)
Components that solve specific problems but may not be needed immediately.

| Component | Description | Potential Use Cases | Integration Notes |
| --- | --- | --- | --- |
| **Accordion** | Collapsible sections with headers | FAQs, content organization, settings | Good for content-heavy pages |
| **Dialog** | Modal overlay | Custom modals, confirmations | Similar to planned Modal |
| **Popover** | Overlay triggered by click/hover | Additional info, actions, menus | Flexible overlay component |
| **Dropdown Menu** | Menu triggered by button | Actions, settings, navigation | Common interaction pattern |
| **Switch** | Toggle switch | Settings, preferences, feature flags | Similar to planned Toggle |
| **Slider** | Range selection input | Settings, filters, ranges | Specialized input type |
| **Toast** | Notification messages | System notifications, feedback | Non-intrusive notifications |

### 📊 Data & Display Components
Components focused on data presentation and complex interactions.

| Component | Description | Potential Use Cases | Integration Notes |
| --- | --- | --- | --- |
| **Table** | Data table component | Data display, reports, lists | Complex component, high value |
| **Data Table** | Advanced table with sorting/filtering | Complex data management | Enhanced version of Table |
| **Pagination** | Page navigation controls | Large datasets, search results | Essential for data-heavy apps |
| **Breadcrumb** | Navigation path indicator | Site navigation, user orientation | Good for complex sites |
| **Calendar** | Date selection interface | Date inputs, scheduling | Specialized but useful |
| **Date Picker** | Date selection input | Forms, scheduling, filtering | Common form component |

### 🎨 Layout & Structural Components
Components that help with page layout and structure.

| Component | Description | Potential Use Cases | Integration Notes |
| --- | --- | --- | --- |
| **Card** | Container with surface background | Content grouping, dashboards | Already in standard |
| **Aspect Ratio** | Container with specific aspect ratio | Images, videos, embedded content | Useful for media |
| **Resizable** | Resizable panels | Dashboards, editors, layouts | Advanced layout component |
| **Scroll-area** | Custom scrollable area | Custom scrolling, overflow control | Styling and UX improvement |
| **Sheet** | Slide-out overlay | Drawers, side panels, mobile menus | Mobile-friendly pattern |

### 🚀 Advanced & Specialized Components
Components that solve more complex or specialized problems.

| Component | Description | Potential Use Cases | Integration Notes |
| --- | --- | --- | --- |
| **Command** | Command palette interface | Power user features, quick actions | Advanced UX pattern |
| **Combobox** | Select with search functionality | Large datasets, filtering | Enhanced selection component |
| **Navigation Menu** | Site navigation | Main navigation, mega menus | Important for sites |
| **Menubar** | Horizontal menu bar | Application menus, toolbars | Desktop application pattern |
| **Context Menu** | Right-click menu | Advanced interactions, power users | Specialized interaction |
| **Hover Card** | Card shown on hover | Previews, additional information | Enhanced UX pattern |
| **Collapsible** | Expandable/collapsible content | Content organization, progressive disclosure | Utility component |

### 📈 Charts & Visualization
Components for data visualization and reporting.

| Component | Description | Potential Use Cases | Integration Notes |
| --- | --- | --- | --- |
| **Chart** | Data visualization components | Dashboards, reports, analytics | May require additional dependencies |
| **Carousel** | Scrolling content gallery | Image galleries, featured content | Common marketing component |

### 🎯 Experimental & Niche Components
Components that are more specialized or may have limited use cases.

| Component | Description | Potential Use Cases | Integration Notes |
| --- | --- | --- | --- |
| **Alert Dialog** | Modal dialogs for critical actions | Confirmations, destructive actions | Specialized dialog variant |
| **Drawer** | Slide-out panel | Mobile navigation, side panels | Similar to Sheet |
| **Input OTP** | One-time password input | Authentication, verification | Very specialized use case |
| **Sidebar** | Side navigation panel | App navigation, dashboards | Layout component |
| **Typography** | Text styling components | Content styling, consistency | May overlap with CSS approach |
| **Toggle Group** | Group of toggle buttons | Toolbars, option groups | Specialized toggle variant |
| **Sonner** | Toast notification system | Advanced notifications | Alternative to Toast |

## Integration Strategy

### Phase 1: Core Foundation (Current + Planned)
- ✅ ThemeProvider, Button, Input, Card
- 🔄 Toggle, Modal (already planned)
- 📋 Add: Select, Checkbox, Radio Group, Label, Textarea

### Phase 2: Common Patterns
- 📋 Alert, Badge, Avatar, Tabs, Tooltip, Progress, Separator, Skeleton

### Phase 3: Data & Display
- 📋 Table, Pagination, Breadcrumb, Calendar, Date Picker

### Phase 4: Advanced Components
- 📋 Command, Combobox, Navigation Menu, Dialog, Popover, Dropdown Menu

### Phase 5: Specialized & Experimental
- 📋 Chart, Carousel, and other niche components based on demand

## Selection Criteria

When considering new components for integration, evaluate based on:

1. **Demand**: How frequently is this component requested?
2. **Uniqueness**: Does it solve a problem not addressed by existing components?
3. **Complexity**: Can it be implemented well with our vanilla React + CSS approach?
4. **Performance**: Will it significantly impact bundle size or runtime performance?
5. **Accessibility**: Can it meet our WCAG 2.1 AA standards?
6. **Maintainability**: Can we maintain this component long-term?
7. **Extensibility**: Can it be extended for future needs?

## Implementation Notes

- Each component must follow our existing component standard structure
- All components must use design tokens for styling
- Comprehensive Storybook stories and Vitest tests are required
- Components should be implemented with progressive enhancement in mind
- Consider mobile-first responsive design for all new components

---

*This document should be reviewed and updated periodically as new components are integrated or as shadcn/ui evolves. Last updated: 2025-09-26*
