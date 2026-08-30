# Frontend Design

## UI Library: CoreUI (Free Version)

The frontend utilizes the **CoreUI** library (free version) for its UI components and layout.

### Official Demo
You can view the CoreUI React free demo here:
https://coreui.io/demos/react/latest/free/?theme=light#/dashboard

### Key Features Used
- **Layout Components**: AppHeader, AppSidebar, AppFooter, AppContent
- **UI Components**: Buttons, forms, modals, tables, cards, etc.
- **Icons**: CoreUI free icon set (or any compatible icon set)
- **Styling**: SCSS-based theming ( CoreUI's default light theme is used )

### Customization
While the base design follows CoreUI's free version, the project may include:
- Custom SCSS overrides in `src/scss/style.scss`
- Custom components in `src/components/` that extend or modify CoreUI components
- Custom icons or logo replacements in `src/assets/images/`

### Design Principles
- Consistency with CoreUI's component API and styling
- Responsive layout using CoreUI's grid system
- Accessibility considerations (where CoreUI provides them)
- Minimal custom styling to maintain ease of updates

### Implementation Notes
- The sidebar navigation is dynamically built from backend menu data (see `src/services/sidebarService.js`)
- The header may include user-specific controls (dropdown, notifications, etc.)
- The content area is where individual views (pages) are rendered via React Router
- Forms and tables often use CoreUI's components with custom validation and event handling

### Updating CoreUI
If updating the CoreUI version, check:
- `package.json` for the dependency
- Any custom SCSS overrides for compatibility
- Component usage in case of breaking changes

### References
- CoreUI React Documentation: https://coreui.io/react/
- CoreUI GitHub (Free): https://github.com/coreui/coreui-free-react-admin-template