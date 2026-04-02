/* global Behaviour, dialog, FormChecker, findElementsBySelector */

function matrixAuthEscapeHtml(html) {
  return html.replace(/'/g, "&apos;").replace(/"/g, "&quot;").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Build a summary string of granted permissions for a card.
 * Returns something like "Overall: Read, Administer · Job: Build, Read"
 */
function matrixAuthBuildSummary(card) {
  const body = card.querySelector(".mas-card__body");
  if (!body) {
    return "";
  }
  const groups = body.querySelectorAll(".mas-card__permission-group");
  const parts = [];
  groups.forEach(function (group) {
    const title = group.querySelector(".mas-card__group-title");
    if (!title) {
      return;
    }
    const checked = [];
    group.querySelectorAll("input[type=checkbox]").forEach(function (cb) {
      if (cb.checked) {
        const label = cb.closest(".mas-card__permission");
        const nameEl = label ? label.querySelector(".mas-card__permission-name") : null;
        if (nameEl) {
          checked.push(nameEl.textContent.trim());
        }
      }
    });
    if (checked.length > 0) {
      parts.push(title.textContent.trim() + ": " + checked.join(", "));
    }
  });
  return parts.join(" \u00B7 ");
}

/**
 * Update the summary line in a card header.
 */
function matrixAuthUpdateSummary(card) {
  const summaryEl = card.querySelector(".mas-card__summary");
  if (summaryEl) {
    summaryEl.textContent = matrixAuthBuildSummary(card);
  }
}

/**
 * Update implied permission states within a card.
 * Disables checkboxes that are implied by other checked permissions.
 */
function matrixAuthUpdateImplied(card) {
  const labels = card.querySelectorAll(".mas-card__permission[data-permission-id]");
  labels.forEach(function (label) {
    const checkbox = label.querySelector("input[type=checkbox]");
    if (!checkbox) {
      return;
    }
    const impliedByStr = label.getAttribute("data-implied-by-list");
    if (!impliedByStr || impliedByStr.trim() === "") {
      return;
    }
    const impliedByList = impliedByStr.trim().split(" ");
    let isImplied = false;

    for (let i = 0; i < impliedByList.length; i++) {
      const ref = card.querySelector(".mas-card__permission[data-permission-id='" + impliedByList[i] + "'] input[type=checkbox]");
      if (ref && ref.checked) {
        isImplied = true;
        break;
      }
    }

    const impliedLabel = label.querySelector(".mas-card__permission-implied");
    if (isImplied) {
      checkbox.disabled = true;
      label.classList.add("mas-card__permission--implied");
      if (impliedLabel) {
        impliedLabel.hidden = false;
      }
    } else {
      checkbox.disabled = false;
      label.classList.remove("mas-card__permission--implied");
      if (impliedLabel) {
        impliedLabel.hidden = true;
      }
    }
  });
}

/**
 * Toggle card expansion.
 */
function matrixAuthToggleCard(card) {
  const body = card.querySelector(".mas-card__body");
  const header = card.querySelector(".mas-card__header");
  if (!body || !header) {
    return;
  }
  const isExpanded = !body.hidden;
  body.hidden = isExpanded;
  header.setAttribute("aria-expanded", String(!isExpanded));
  card.setAttribute("aria-expanded", String(!isExpanded));
}

/**
 * Check ambiguity warning visibility after card changes.
 */
function matrixAuthUpdateAmbiguityWarning(container) {
  const cards = container.querySelectorAll(".mas-card[data-type='EITHER']");
  const warning = container.querySelector(".mas-ambiguity-warning");
  if (warning) {
    warning.style.display = cards.length > 0 ? "" : "none";
  }
}

/*
 * Card header click to expand/collapse
 */
Behaviour.specify(".mas-card__header", "MatrixAuthCards", 0, function (header) {
  function handleToggle(e) {
    // Don't toggle if clicking on action buttons
    if (e.target.closest(".mas-card__actions") && !e.target.closest(".mas-card__toggle")) {
      return;
    }
    const card = header.closest(".mas-card");
    if (card && !card.classList.contains("read-only")) {
      matrixAuthToggleCard(card);
    }
  }

  header.onclick = handleToggle;
  header.onkeydown = function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle(e);
    }
  };
});

/*
 * Toggle button explicit click
 */
Behaviour.specify(".mas-card__toggle", "MatrixAuthCards", 10, function (btn) {
  btn.onclick = function (e) {
    e.stopPropagation();
    const card = btn.closest(".mas-card");
    if (card) {
      matrixAuthToggleCard(card);
    }
  };
});

/*
 * Adding new users/groups
 */
Behaviour.specify(".matrix-auth-add-button", "MatrixAuthCards", 0, function (e) {
  e.onclick = function () {
    const container = e.closest(".mas-container");
    const type = e.getAttribute("data-type");
    const typeLabel = e.getAttribute("data-type-label");

    // Find the template element associated with this container
    const templates = document.querySelectorAll("template[data-strategy-id]");
    let templateEl = null;
    for (let i = 0; i < templates.length; i++) {
      if (templates[i].getAttribute("data-strategy-id") === container.id) {
        templateEl = templates[i];
        break;
      }
    }

    dialog
      .prompt(e.getAttribute("data-message-title"), {
        message: e.getAttribute("data-message-prompt"),
      })
      .then(
        function (name) {
          if (!name || name.trim() === "") {
            return;
          }
          name = name.trim();

          // Check for duplicates
          const cardsContainer = container.querySelector(".mas-cards");
          const existing = cardsContainer.querySelector(".mas-card[name='[" + type + ":" + name + "]']");
          if (existing) {
            dialog.alert(e.getAttribute("data-message-error"));
            return;
          }

          if (templateEl) {
            const copy = templateEl.content.firstElementChild.cloneNode(true);
            copy.setAttribute("name", "[" + type + ":" + name + "]");
            copy.setAttribute("data-sid", name);
            copy.setAttribute("data-type", type);
            copy.classList.remove("mas-card--ambiguous");

            // Update the displayed name
            const nameEl = copy.querySelector(".mas-card__name");
            if (nameEl) {
              nameEl.textContent = name;
            }

            // Remove ambiguous badge if present
            const badge = copy.querySelector(".mas-card__badge--warning");
            if (badge) {
              badge.remove();
            }

            // Remove migration buttons
            copy.querySelectorAll(".migrate").forEach(function (btn) {
              btn.remove();
            });

            // Update icon based on type
            const iconContainer = copy.querySelector(".mas-card__identity");
            if (iconContainer) {
              const icon = iconContainer.querySelector("[class*='symbol-']");
              if (icon) {
                // Icon will be set by the template; we may need to swap for group
                // The template defaults to USER icon, swap if GROUP
              }
            }

            // Update tooltips
            copy.querySelectorAll(".mas-card__action[tooltip]").forEach(function (btn) {
              const t = btn.getAttribute("tooltip");
              if (t) {
                btn.setAttribute("tooltip", t.replace("__SID__", name).replace("__TYPE__", typeLabel));
              }
            });

            cardsContainer.appendChild(copy);
            Behaviour.applySubtree(container, true);
            matrixAuthUpdateSummary(copy);

            // Expand the new card
            matrixAuthToggleCard(copy);
          }
        },
        function () {},
      );
  };
});

/*
 * Remove button
 */
Behaviour.specify(".mas-card .mas-card__action.remove", "MatrixAuthCards", 0, function (btn) {
  btn.onclick = function (e) {
    e.stopPropagation();
    const card = btn.closest(".mas-card");
    const container = card.closest(".mas-container");
    card.remove();
    matrixAuthUpdateAmbiguityWarning(container);
  };
});

/*
 * Select all button
 */
Behaviour.specify(".mas-card .mas-card__action.selectall", "MatrixAuthCards", 0, function (btn) {
  btn.onclick = function (e) {
    e.stopPropagation();
    const card = btn.closest(".mas-card");
    card.querySelectorAll(".mas-card__body input[type=checkbox]").forEach(function (cb) {
      cb.checked = true;
    });
    matrixAuthUpdateImplied(card);
    matrixAuthUpdateSummary(card);
  };
});

/*
 * Unselect all button
 */
Behaviour.specify(".mas-card .mas-card__action.unselectall", "MatrixAuthCards", 0, function (btn) {
  btn.onclick = function (e) {
    e.stopPropagation();
    const card = btn.closest(".mas-card");
    card.querySelectorAll(".mas-card__body input[type=checkbox]").forEach(function (cb) {
      cb.checked = false;
      cb.disabled = false;
    });
    card.querySelectorAll(".mas-card__permission--implied").forEach(function (label) {
      label.classList.remove("mas-card__permission--implied");
      const impliedEl = label.querySelector(".mas-card__permission-implied");
      if (impliedEl) {
        impliedEl.hidden = true;
      }
    });
    matrixAuthUpdateSummary(card);
  };
});

/*
 * Migrate to user/group
 */
Behaviour.specify(".mas-card .mas-card__action.migrate", "MatrixAuthCards", 0, function (btn) {
  btn.onclick = function (e) {
    e.stopPropagation();
    const card = btn.closest(".mas-card");
    const container = card.closest(".mas-container");
    const name = card.getAttribute("name");

    let newType = "USER";
    if (btn.classList.contains("migrate_group")) {
      newType = "GROUP";
    }
    const sid = card.getAttribute("data-sid");
    const newName = "[" + newType + ":" + sid + "]";

    // Check if a card with this name already exists
    const existingCard = container.querySelector(".mas-card[name='" + newName + "']");

    if (existingCard && existingCard !== card) {
      // Merge permissions into existing card
      const sourceCheckboxes = card.querySelectorAll(".mas-card__body input[type=checkbox]");
      const targetCheckboxes = existingCard.querySelectorAll(".mas-card__body input[type=checkbox]");
      for (let i = 0; i < sourceCheckboxes.length && i < targetCheckboxes.length; i++) {
        if (sourceCheckboxes[i].checked) {
          targetCheckboxes[i].checked = true;
        }
      }
      existingCard.classList.add("highlight-entry");
      matrixAuthUpdateImplied(existingCard);
      matrixAuthUpdateSummary(existingCard);
      card.remove();
    } else {
      // Transform this card
      card.setAttribute("name", newName);
      card.setAttribute("data-type", newType);
      card.classList.remove("mas-card--ambiguous");

      // Remove ambiguous badge
      const badge = card.querySelector(".mas-card__badge--warning");
      if (badge) {
        badge.remove();
      }

      // Remove migration buttons
      card.querySelectorAll(".migrate").forEach(function (b) {
        b.remove();
      });
    }

    matrixAuthUpdateAmbiguityWarning(container);
  };
});

/*
 * Checkbox change handler — update implied permissions and summary
 */
Behaviour.specify(".mas-card__body input[type=checkbox]", "MatrixAuthCards", 0, function (cb) {
  const card = cb.closest(".mas-card");
  if (card && card.classList.contains("read-only")) {
    cb.disabled = true;
    return;
  }

  cb.onchange = function () {
    if (card) {
      matrixAuthUpdateImplied(card);
      matrixAuthUpdateSummary(card);
    }
  };
});

/*
 * Initialize each card: update implied state and summary on load
 */
Behaviour.specify(".mas-card", "MatrixAuthCards", 100, function (card) {
  if (card.getAttribute("name") === "__unused__" || card.getAttribute("data-initialized") === "true") {
    return;
  }

  matrixAuthUpdateImplied(card);
  matrixAuthUpdateSummary(card);
  card.setAttribute("data-initialized", "true");

  // Name validation for non-built-in entries
  if (card.classList.contains("permission-row") && card.getAttribute("data-descriptor-url")) {
    if (!card.hasAttribute("data-checked")) {
      const nameEl = card.querySelector(".mas-card__identity");
      FormChecker.delayedCheck(
        card.getAttribute("data-descriptor-url") + "/checkName?value=" + encodeURIComponent(card.getAttribute("name")),
        "GET",
        nameEl
      );
      card.setAttribute("data-checked", "true");
    }
  }
});

/*
 * Search / filter
 */
Behaviour.specify(".mas-search__input", "MatrixAuthCards", 0, function (input) {
  input.oninput = function () {
    const query = input.value.toLowerCase().trim();
    const container = input.closest(".mas-container");
    const cards = container.querySelectorAll(".mas-card");
    let visibleCount = 0;

    cards.forEach(function (card) {
      const sid = (card.getAttribute("data-sid") || "").toLowerCase();
      const nameEl = card.querySelector(".mas-card__name");
      const displayName = nameEl ? nameEl.textContent.toLowerCase() : "";

      if (query === "" || sid.indexOf(query) !== -1 || displayName.indexOf(query) !== -1) {
        card.classList.remove("mas-card--hidden");
        visibleCount++;
      } else {
        card.classList.add("mas-card--hidden");
      }
    });

    const emptyState = container.querySelector(".mas-empty-state");
    if (emptyState) {
      emptyState.hidden = visibleCount > 0 || query === "";
    }
  };
});
