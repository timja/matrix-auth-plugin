* ~~The user and group buttons have \u2026 at the end of the label~~ Fixed: use `&#x2026;` in Jelly instead of `\u2026`
* ~~There's nothing indicating that you need to click a permission to check it. The card caption is too subtle especially for a first time user~~ Fixed: empty cards now show italic hint "No permissions granted"
* ~~The select all button includes all roles in the card caption whilst when you click administer it just shows administer which is correct~~ Fixed: summary now only includes explicitly granted (non-implied) permissions
* ~~Tooltips say "Grant all permissions to null" and "Remove all permissions from null"~~ Fixed: use local Jelly variables (`cardSid`) instead of `attrs.sid` for i18n pattern substitution
* ~~Alignment is off in the card header, the user and icon is at the bottom while select all etc controls are in the middle~~ Fixed: added `display: block` on header SVGs to eliminate baseline alignment issues
* ~~The add user and add group buttons don't need ... at the end~~ Fixed: removed ellipsis from button labels
* ~~The username after the icon is now wrapping onto the next line all the time regardless of the length of the username. It should only wrap if the username is too long to fit on one line.~~ Fixed: set `flex-wrap: nowrap` on header, allow identity to shrink, name truncates with ellipsis only when too long
* ~~Click to expand is unnecessary text~~ Fixed: changed to just "No permissions granted"
* ~~The permission indication is still not clear. The mouse pointer needs to change, hovering should have a different background colour, once selected it should look different to unselected~~ Fixed: added cursor pointer, hover background, and checked permissions show with accent color background
* ~~FormChecker.delayedCheck was replacing the entire .mas-card__identity content with old-style validation HTML (mas-table__* classes), destroying the card's icon, name span, and badge~~ Fixed: added hidden `.mas-card__validation-target` element for FormChecker, with MutationObserver to process the response and apply validation styles (not-found, warning, tooltip, display name) to the card without destroying its structure


* Anoymous and authenticated are special users and groups respectively they shouldn't be showing as not found