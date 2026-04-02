You are a UX designer specialising in modernisation of legacy applications. Your task is to review the existing user interface of a legacy application and provide recommendations for improving its usability and visual appeal.

Start by creating a plan in PLAN.md in this directory.

The screenshot of the existing user interface is provided in the file `matrix-auth.png`. 

Review the screenshot and identify areas where the user interface can be improved. Consider factors such as layout, color scheme, typography, and overall user experience.

Provide recommendations but ask questions first.

You should follow standards from the Jenkins design libary: https://github.com/jenkinsci/design-library-plugin

Hosted at https://weekly.ci.jenkins.io/design-library/

## Q&A

**About Scope:**

1. **Is the scope limited to the permission matrix table?**
   - No — also consider the "Add user"/"Add group" buttons and the ambiguity warning area.

2. **Are there other views in scope?**
   - No other views in scope, but be aware that the permissions section is included in per-job and per-folder views as well.

**About Constraints:**

3. **Rotated column headers — keep or change?**
   - Other layouts are preferred over the current rotated-header matrix.

4. **Accessibility requirements?**
   - Must meet WCAG AA 2.3.

5. **Is horizontal scrolling acceptable?**
   - No — needs a new design that avoids horizontal scrolling.

6. **Should we review the Jenkins Design Library?**
   - Yes, can look as needed.

**About Users:**

7. **How many users/groups in a typical installation?**
   - Usually groups are used, no more than 10 ideally, but could be more.

8. **Most common pain points?**
   - Scrolling, hard to read, hard to know which permissions someone has.

## Implementation Context

### What was done

Replaced the old wide matrix table UI with an expandable card-based layout. Each user/group is a card that shows a permission summary when collapsed and grouped checkboxes when expanded.

### Files modified

- `src/main/resources/hudson/security/GlobalMatrixAuthorizationStrategy/config.jelly` — Complete rewrite from table to card layout
- `src/main/resources/hudson/security/table.js` — Complete rewrite for card interactions (expand/collapse, add/remove, select/unselect all, implied permissions, search, migration, summary generation)
- `src/main/resources/hudson/security/table.css` — Complete rewrite for card styles
- `src/main/resources/hudson/security/GlobalMatrixAuthorizationStrategy/config.properties` — Added new i18n keys
- `src/test/java/org/jenkinsci/plugins/matrixauth/ReadOnlyTest.java` — Updated assertion from `table.global-matrix-authorization-strategy-table` to `div.mas-container`

### Key design decisions

- **Form submission compatibility**: The `name` attribute hierarchy (`div[name="data"]` > `div[name="[TYPE:sid]"]` > `input[name="[permission.id]"]`) produces the same JSON as the old `table > tr > input` structure. No server-side changes needed.
- **Checkbox `checked` attribute**: Must use conditional Jelly (`j:choose`/`j:when`) to either render `checked="checked"` or omit the attribute entirely. Using `checked="${boolExpr}"` renders `checked="false"` which HTML treats as checked.
- **Jelly i18n variables**: Use `j:set` local variables (`cardSid`, `cardType`) instead of `attrs.sid`/`attrs.type` for i18n pattern substitution (e.g. `${%selectall(cardSid)}`), because `attrs.*` doesn't resolve in `${%...()}` patterns.
- **Template card**: The `<template>` element is placed OUTSIDE the `name="data"` container. JS clones from it and appends into `.mas-cards` which is inside the data container.
- **Implied permissions**: Shown as `disabled` checkboxes with `(implied)` label. Summary only includes non-implied (non-disabled) permissions.
- **Select All / Unselect All**: Per-user (all permissions for that user/group).

### Current status

All known bugs from Phase 1 and Phase 2 have been fixed (see BUGS.md). The card-based UI is functional with:
- Proper icon/name alignment in card headers
- FormChecker validation working via hidden target element (preserves card structure)
- Correct not-found/warning styles, tooltips, and display name resolution
- All 67 plugin tests passing

### Next steps

- **Phase 2 remaining**: Accessibility audit (WCAG AA 2.3), keyboard navigation testing, screen reader testing
- **Phase 3**: Test with CasC round-trip, Job DSL, read-only mode, and per-job/folder views
- Clean up `ValidationUtil.java` — the `mas-table__*` class names in the server response are legacy; consider updating to `mas-card__*` for consistency (currently the JS bridges between the two naming conventions)

### Test status

- All 67 plugin tests pass (2 pre-existing `InjectedTest` infrastructure errors unrelated to changes)
- Jenkins running on `http://localhost:8099/jenkins` for manual testing
- Security config page: `http://localhost:8099/jenkins/configureSecurity`

### Browser automation

- `agent-browser open <url>` — navigate
- `agent-browser snapshot -i` — get interactive elements
- `agent-browser screenshot <path>` — take screenshot
- `agent-browser click @ref` / `agent-browser fill @ref "text"` — interact
- `agent-browser scroll down/up <pixels>` — scroll

### See also

- `PLAN.md` — Full design plan with wireframes
- `BUGS.md` — Bug tracker with fixes applied and remaining issues
