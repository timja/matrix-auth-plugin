# UX Modernisation Plan — Matrix Authorization Strategy

## Problem Statement

The current permission matrix UI is a wide table with rotated column headers and checkboxes at every intersection of user/group and permission. Key pain points:

- **Horizontal scrolling** required — the table grows very wide with many permission columns
- **Hard to read** — rotated permission names are difficult to scan
- **Hard to audit** — answering "what can user X do?" requires scanning across a long row of checkboxes
- **Accessibility** — rotated text, small click targets, and dense layout are problematic for WCAG AA 2.3

## Design Principles

1. **User/group-centric** — the primary question is "what can this user/group do?", not "who has permission X?"
2. **No horizontal scroll** — the layout must fit within the page width
3. **Scannable** — permissions should be readable at a glance
4. **WCAG AA 2.3** compliant — proper contrast, focus indicators, keyboard navigation, screen reader support
5. **Consistent with Jenkins Design Library** — use standard components (`l:card`, `f:checkbox`, `l:icon`, spacing utilities, etc.)

## Proposed Design: Expandable Card Layout

Replace the wide matrix table with a **vertical list of expandable cards**, one per user/group.

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ [Search bar: Filter users/groups...]            │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👤 Anonymous                        ▼ [···] │ │
│ │  Overall: Read                               │ │
│ │  (expand to see/edit all permissions)         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👥 Authenticated Users              ▼ [···] │ │
│ │  Overall: Read · Job: Read, Build            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👥 admins                           ▼ [···] │ │
│ │  Overall: Administer (all permissions)       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👥 developers                       ▼ [···] │ │
│ │  Overall: Read · Job: Read, Build, Configure │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [+ Add user...]  [+ Add group...]               │
└─────────────────────────────────────────────────┘
```

### Collapsed Card (Summary View)

Each card shows:
- **Icon** indicating user (`person-outline`) or group (`people-outline`)
- **Name** of the user/group
- **Summary line** — a concise text list of granted permissions (e.g. "Overall: Read · Job: Read, Build")
- **Expand/collapse toggle**
- **Actions menu** (···) with: Select All, Unselect All, Remove (and migration options for EITHER type)

The summary line answers "what can this user/group do?" without expanding.

### Expanded Card (Edit View)

When expanded, permissions are grouped by category using sections:

```
┌─────────────────────────────────────────────────┐
│ 👥 developers                          ▲ [···] │
│                                                 │
│  Overall                                        │
│  ┌─────────────────────────────────────────────┐│
│  │ ☑ Read                                      ││
│  │ ☐ Administer                                ││
│  │ ☐ SystemRead                                ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Job                                            │
│  ┌─────────────────────────────────────────────┐│
│  │ ☑ Read                                      ││
│  │ ☑ Build                                     ││
│  │ ☑ Configure                                 ││
│  │ ☐ Delete                                    ││
│  │ ☐ Discover                                  ││
│  │ ...                                         ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  View                                           │
│  ┌─────────────────────────────────────────────┐│
│  │ ☑ Read                                      ││
│  │ ☐ Configure                                 ││
│  │ ☐ Create                                    ││
│  │ ☐ Delete                                    ││
│  └─────────────────────────────────────────────┘│
│                                                 │
└─────────────────────────────────────────────────┘
```

Each permission shows:
- **Checkbox** (`f:checkbox`) with the permission name as label
- **Tooltip** (on hover/focus) with the permission description and implied-by info
- **Visual indicator** if a permission is implied by another granted permission (e.g. dimmed checkbox, "(implied by Administer)" text)

### Components Used (Jenkins Design Library)

| Component | Usage |
|-----------|-------|
| `l:card` with `expandable` | Each user/group entry |
| `f:checkbox` | Individual permission toggles |
| `l:search-bar` | Filter users/groups |
| `l:icon` with `symbol-person-outline` / `symbol-people-outline` | User vs group indicator |
| `jenkins-button` | Add user/group buttons |
| `dialog.prompt()` | Add user/group name input |
| `data-html-tooltip` | Permission descriptions |
| `jenkins-!-margin-*` / `jenkins-!-padding-*` | Spacing |
| `jenkins-alert` | Ambiguity warnings |

### Accessibility (WCAG AA 2.3)

- All checkboxes have visible text labels (no rotated text)
- Proper `aria-expanded` on card toggle
- Keyboard navigation: Tab through cards, Enter/Space to expand, Tab through permissions
- Focus indicators on all interactive elements (Jenkins default styles)
- Sufficient color contrast using Jenkins CSS variables
- Screen reader: card summary reads as "developers group, permissions: Overall Read, Job Read Build Configure"
- No reliance on color alone for permission state

### Search / Filter

- `l:search-bar` at the top filters the card list by user/group name
- Client-side filtering (hide non-matching cards)
- Shows empty state (`l:notice`) when no results match

### Inheritance Strategy

The inheritance strategy dropdown (`f:dropdownDescriptorSelector`) remains above the cards as it applies globally to the permission set. No change needed.

### Read-Only Mode

In read-only mode:
- Cards are not expandable (or expand to show permissions but without checkboxes)
- Summary line shows granted permissions as text
- No Add/Remove buttons

## Migration Path

The change is purely UI — the underlying data model (`AuthorizationContainer`, `PermissionEntry`) does not change. The Jelly template (`config.jelly`) and JavaScript (`table.js`) are rewritten, but form submission format remains compatible.

### Phases

1. **Phase 1**: Build the new card-based layout in `config.jelly` and new JS
2. **Phase 2**: Style and accessibility polish, WCAG AA audit
3. **Phase 3**: Test with CasC round-trip, Job DSL, read-only mode, and per-job/folder views

## Resolved Questions

- **Select All / Unselect All** operates per-user (all permissions for that user/group), not per-category.
- **Implied permissions** are shown as checked-and-disabled with a subtle "(implied)" label next to the permission name. This makes it clear the permission is active but not directly granted, and prevents users from unchecking something that would remain in effect anyway.
- **Compare view** is not needed.
