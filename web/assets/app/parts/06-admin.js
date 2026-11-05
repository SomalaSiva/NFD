const adminFeedback = document.getElementById("admin-feedback");
const adminManagement = document.getElementById("admin-user-management");
const adminUserList = document.getElementById("admin-user-list");
const adminOverview = document.getElementById("admin-overview");
const memberDirectory = document.getElementById("member-directory");
const memberDirectoryFeedback = document.getElementById("member-directory-feedback");
const memberDirectoryList = document.getElementById("member-directory-list");
const ghostAccessPanel = document.getElementById("ghost-access-panel");
const ghostAccessFeedback = document.getElementById("ghost-access-feedback");
const ghostAccessList = document.getElementById("ghost-access-list");
const activityAudit = document.getElementById("activity-audit");
const activityAuditFeedback = document.getElementById("activity-audit-feedback");
const activityAuditList = document.getElementById("activity-audit-list");
const moderationSettings = document.getElementById("moderation-settings");
const moderationFeedback = document.getElementById("moderation-feedback");
const moderationToggle = document.getElementById("moderation-toggle");
const sessionTimeoutSettings = document.getElementById("session-timeout-settings");
const sessionTimeoutForm = document.getElementById("session-timeout-form");
const sessionTimeoutMinutesInput = document.getElementById("session-timeout-minutes");
const sessionTimeoutSave = document.getElementById("session-timeout-save");
const sessionTimeoutFeedback = document.getElementById("session-timeout-feedback");
const quickStoriesSettings = document.getElementById("quick-stories-settings");
const quickStoriesFeedback = document.getElementById("quick-stories-feedback");
const quickStoriesToggle = document.getElementById("quick-stories-toggle");
const adminPostManagement = document.getElementById("admin-post-management");
const adminPostFeedback = document.getElementById("admin-post-feedback");
const adminPostList = document.getElementById("admin-post-list");
const adminPostSearch = document.getElementById("admin-post-search-query");
const restrictedEmailsPanel = document.getElementById("restricted-emails-panel");
const restrictedEmailFeedback = document.getElementById("restricted-email-feedback");
const restrictedEmailList = document.getElementById("restricted-email-list");
const memberDirectoryLoadMore = document.getElementById("member-directory-load-more");
const adminPostLoadMore = document.getElementById("admin-post-load-more");
const restrictedEmailLoadMore = document.getElementById("restricted-email-load-more");
const ghostAccessLoadMore = document.getElementById("ghost-access-load-more");
const activityAuditLoadMore = document.getElementById("activity-audit-load-more");
let adminUsersData = null,
  memberDirectoryUsers = [],
  memberDirectoryTotal = 0,
  memberDirectoryNextOffset = null;
let adminExperiencePosts = [],
  adminExperienceTotal = 0,
  adminExperienceNextOffset = null;
let restrictedEmailEntries = [],
  restrictedEmailTotal = 0,
  restrictedEmailNextOffset = null;
let ghostAccessUsers = [],
  ghostAccessTotal = 0,
  ghostAccessNextOffset = null;
let activityEntries = [],
  activityTotal = 0,
  activityNextOffset = null;
const filterText = (...values) =>
  values
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLocaleLowerCase();
function setDynamicFilterOptions(select, values, allLabel, format = (value) => value) {
  if (!select) return;
  const selected = select.value;
  const unique = [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  select.replaceChildren(
    new Option(allLabel, ""),
    ...unique.map((value) => new Option(format(value), value)),
  );
  if (unique.includes(selected)) select.value = selected;
}
function setAdminFeedback(message, isError = false) {
  adminFeedback.textContent = message;
  adminFeedback.classList.toggle("error", isError);
}
function renderAdminUsers(data) {
  adminUsersData = data;
  adminUserList.replaceChildren();
  const query = document.getElementById("admin-user-search").value.trim().toLocaleLowerCase();
  const type = document.getElementById("admin-user-type-filter").value;
  const ownerEmail = data.ownerEmail || "Site owner";
  const showOwner = (!type || type === "owner") && filterText(ownerEmail).includes(query);
  if (showOwner) {
    const ownerItem = document.createElement("li");
    ownerItem.className = "admin-user-item";
    const ownerLabel = document.createElement("div");
    ownerLabel.className = "admin-user-email";
    ownerLabel.textContent = ownerEmail;
    const ownerNote = document.createElement("span");
    ownerNote.className = "admin-user-added";
    ownerNote.textContent = "Owner · permanent admin access";
    ownerLabel.append(ownerNote);
    ownerItem.append(ownerLabel);
    adminUserList.append(ownerItem);
  }
  const admins = (data.admins || []).filter(
    (admin) => (!type || type === "admin") && filterText(admin.email).includes(query),
  );
  admins.forEach((admin) => {
    const item = document.createElement("li");
    item.className = "admin-user-item";
    const label = document.createElement("div");
    label.className = "admin-user-email";
    label.textContent = admin.email;
    const note = document.createElement("span");
    note.className = "admin-user-added";
    note.textContent = "Administrator";
    label.append(note);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "admin-remove";
    remove.textContent = "Remove access";
    remove.setAttribute("aria-label", `Remove admin access for ${admin.email}`);
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Remove administrator access for ${admin.email}?`)) return;
      remove.disabled = true;
      setAdminFeedback("Removing admin access…");
      try {
        const response = await fetch(`/api/admins?email=${encodeURIComponent(admin.email)}`, {
          method: "DELETE",
          headers: { accept: "application/json" },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Admin access could not be removed.");
        renderAdminUsers(result);
        setAdminFeedback(`Admin access removed for ${admin.email}.`);
      } catch (error) {
        remove.disabled = false;
        setAdminFeedback(error.message, true);
      }
    });
    item.append(label, remove);
    adminUserList.append(item);
  });
  if (!showOwner && !admins.length) setAdminFeedback("No administrators match these filters.");
  else if ((data.admins || []).length === 0)
    setAdminFeedback("Your owner account is the only admin right now.");
}
function renderMemberDirectory() {
  const query = document.getElementById("member-search").value.trim().toLocaleLowerCase(),
    provider = document.getElementById("member-provider-filter").value,
    statusFilter = document.getElementById("member-status-filter").value;
  const users = memberDirectoryUsers.filter(
    (user) =>
      (!query ||
        filterText(user.displayName, user.email, user.accountId, user.providerSubject).includes(query)) &&
      (!provider || user.provider === provider) &&
      (!statusFilter || (statusFilter === "active" ? user.active !== false : user.active === false)),
  );
  memberDirectoryList.replaceChildren();
  memberDirectoryFeedback.textContent = `Showing ${users.length} matches in ${memberDirectoryUsers.length} of ${memberDirectoryTotal} accounts loaded.`;
  memberDirectoryLoadMore.hidden = memberDirectoryNextOffset === null;
  if (!users.length) {
    memberDirectoryFeedback.textContent = memberDirectoryUsers.length
      ? "No loaded accounts match these filters."
      : "No accounts have signed in yet.";
    return;
  }
  users.forEach((user) => {
    const item = document.createElement("li");
    item.className = "admin-user-item";
    const label = document.createElement("div");
    label.className = "admin-user-email";
    label.textContent = user.displayName || user.email || "NFD member";
    if (user.email) {
      const email = document.createElement("span");
      email.className = "member-email";
      email.textContent = user.email;
      label.append(email);
    }
    const method =
      user.provider === "ghost" ? "Ghost profile" : user.provider === "google" ? "Google" : "ChatGPT";
    const count = Number(user.sharedPostCount) || 0;
    const note = document.createElement("span");
    note.className = "admin-user-added";
    note.textContent = `${method} · Joined ${prettyDate(user.joinedAt)} · ${count} shared ${count === 1 ? "post" : "posts"}${user.lastActivityAt ? ` · Active ${prettyDate(user.lastActivityAt)}` : ""}`;
    const identifiers = document.createElement("details");
    identifiers.className = "member-identifiers";
    addText(identifiers, "summary", "", "Account identifiers");
    const internalId = addText(identifiers, "p", "", "NFD account ID: ");
    const internalCode = document.createElement("code");
    internalCode.textContent = user.accountId || "Unavailable";
    internalId.append(internalCode);
    const providerId = addText(identifiers, "p", "", `${method} account ID: `);
    const providerCode = document.createElement("code");
    providerCode.textContent = user.providerSubject || "Unavailable";
    providerId.append(providerCode);
    label.append(identifiers);
    const status = document.createElement("span");
    status.className = "admin-user-added";
    status.textContent = user.active === false ? "Deactivated" : "Active";
    item.append(label, note, status);
    if (user.canDeactivate) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "secondary-button account-status-toggle";
      toggle.textContent = user.active === false ? "Reactivate account" : "Deactivate account";
      toggle.setAttribute(
        "aria-label",
        `${user.active === false ? "Reactivate" : "Deactivate"} ${user.displayName || user.email || "NFD account"}`,
      );
      toggle.addEventListener("click", async () => {
        const active = user.active === false;
        if (
          !active &&
          !window.confirm(
            `Deactivate ${user.displayName || user.email || "this NFD account"}? People will no longer find or message this account.`,
          )
        )
          return;
        toggle.disabled = true;
        memberDirectoryFeedback.textContent = active ? "Reactivating account…" : "Deactivating account…";
        memberDirectoryFeedback.classList.remove("error");
        try {
          const response = await fetch("/api/admin/account-status", {
            method: "PUT",
            headers: { "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({ userId: user.accountId, active }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "Account status could not be changed.");
          await loadMemberDirectory();
          memberDirectoryFeedback.textContent = `${user.displayName || user.email || "NFD account"} ${active ? "reactivated" : "deactivated"}.`;
        } catch (error) {
          toggle.disabled = false;
          memberDirectoryFeedback.textContent = error.message;
          memberDirectoryFeedback.classList.add("error");
        }
      });
      item.append(toggle);
    }
    memberDirectoryList.append(item);
  });
}
async function loadMemberDirectory(offset = 0, append = false) {
  memberDirectory.hidden = false;
  memberDirectoryLoadMore.disabled = true;
  memberDirectoryFeedback.textContent = "Loading NFD members…";
  try {
    const response = await fetch(`/api/users?offset=${offset}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "The member list could not be loaded.");
    memberDirectoryUsers = append ? [...memberDirectoryUsers, ...(result.users || [])] : result.users || [];
    memberDirectoryTotal = Number(result.total) || 0;
    memberDirectoryNextOffset = result.nextOffset ?? null;
    renderMemberDirectory();
  } catch (error) {
    memberDirectoryFeedback.textContent = error.message;
    memberDirectoryFeedback.classList.add("error");
  } finally {
    memberDirectoryLoadMore.disabled = false;
  }
}
async function loadAdminExperiences(query = adminPostSearch.value.trim(), offset = 0, append = false) {
  adminPostLoadMore.disabled = true;
  adminPostFeedback.textContent = "Loading shared posts…";
  adminPostFeedback.classList.remove("error");
  try {
    const params = new URLSearchParams({ offset: String(offset) });
    if (query) params.set("q", query);
    const response = await fetch(`/api/admin/experiences?${params}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Shared posts could not be loaded.");
    adminExperiencePosts = append ? [...adminExperiencePosts, ...(result.posts || [])] : result.posts || [];
    adminExperienceTotal = Number(result.total) || 0;
    adminExperienceNextOffset = result.nextOffset ?? null;
    adminPostLoadMore.hidden = adminExperienceNextOffset === null;
    adminPostLoadMore.disabled = false;
    adminPostManagement.hidden = false;
    setDynamicFilterOptions(
      document.getElementById("admin-post-category-filter"),
      adminExperiencePosts.map((post) => post.experienceCategory),
      "All experience types",
    );
    renderAdminExperiences();
  } catch (error) {
    adminPostManagement.hidden = error.message.includes("administrator");
    adminPostFeedback.textContent = error.message;
    adminPostFeedback.classList.add("error");
  } finally {
    adminPostLoadMore.disabled = false;
  }
}
function renderAdminExperiences() {
  adminPostList.replaceChildren();
  const query = adminPostSearch.value.trim();
  const visibility = document.getElementById("admin-post-visibility-filter").value,
    authorStatus = document.getElementById("admin-post-author-filter").value,
    category = document.getElementById("admin-post-category-filter").value;
  const posts = adminExperiencePosts.filter(
    (post) =>
      (!visibility || post.visibility === visibility) &&
      (!authorStatus ||
        (authorStatus === "active" ? post.authorActive !== false : post.authorActive === false)) &&
      (!category || post.experienceCategory === category),
  );
  adminPostFeedback.textContent = `Showing ${posts.length} matches in ${adminExperiencePosts.length} of ${adminExperienceTotal} posts loaded.`;
  if (!posts.length) {
    adminPostFeedback.textContent = adminExperiencePosts.length
      ? "No loaded posts match these filters."
      : query
        ? "No shared posts matched that search."
        : "There are no shared posts yet.";
    return;
  }
  posts.forEach((post) => {
    const item = document.createElement("li");
    item.className = "admin-user-item admin-post-item";
    const copy = document.createElement("div");
    copy.className = "admin-post-copy";
    const title = document.createElement("strong");
    title.className = "admin-user-email";
    title.textContent = post.shortDescription || "Shared post";
    copy.append(title);
    const note = document.createElement("span");
    note.className = "admin-user-added";
    note.textContent = `${post.authorName}${post.authorEmail ? ` · ${post.authorEmail}` : ""} · ${post.provider === "ghost" ? "Ghost profile" : "NFD account"}${post.authorActive ? "" : " · Deactivated"} · ${post.visibility} · ${prettyDate(post.createdAt)}`;
    copy.append(note);
    const category = document.createElement("span");
    category.className = "admin-user-added";
    category.textContent = `${post.experienceCategory || "Not provided"} · ${post.incidentCategory || "Not provided"} · ${post.place || "Not provided"}`;
    copy.append(category);
    const story = document.createElement("details");
    story.className = "member-identifiers";
    addText(story, "summary", "", "Read full post");
    addText(story, "p", "", post.fullDescription || "No additional details were provided.");
    copy.append(story);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "admin-remove admin-delete-post";
    remove.textContent = "Delete post";
    remove.setAttribute("aria-label", `Delete post by ${post.authorName}`);
    remove.addEventListener("click", async () => {
      if (
        !window.confirm(
          `Permanently delete this post by ${post.authorName}, including its comments, reactions, and attachments?`,
        )
      )
        return;
      remove.disabled = true;
      adminPostFeedback.textContent = "Deleting post…";
      adminPostFeedback.classList.remove("error");
      try {
        const deletion = await fetch("/api/admin/experiences", {
          method: "DELETE",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ experienceId: post.id }),
        });
        const saved = await deletion.json().catch(() => ({}));
        if (!deletion.ok) throw new Error(saved.error || "Post could not be deleted.");
        await loadAdminExperiences(adminPostSearch.value.trim());
        adminPostFeedback.textContent = saved.cleanupPending
          ? "Post deleted; attachment cleanup is queued."
          : "Post and its attachments deleted.";
      } catch (error) {
        remove.disabled = false;
        adminPostFeedback.textContent = error.message;
        adminPostFeedback.classList.add("error");
      }
    });
    item.append(copy, remove);
    adminPostList.append(item);
  });
}
async function loadRestrictedEmails(offset = 0, append = false) {
  restrictedEmailLoadMore.disabled = true;
  restrictedEmailFeedback.textContent = "Loading restricted emails…";
  restrictedEmailFeedback.classList.remove("error");
  try {
    const response = await fetch(`/api/admin/restricted-emails?offset=${offset}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Restricted emails could not be loaded.");
    restrictedEmailEntries = append
      ? [...restrictedEmailEntries, ...(result.emails || [])]
      : result.emails || [];
    restrictedEmailTotal = Number(result.total) || 0;
    restrictedEmailNextOffset = result.nextOffset ?? null;
    restrictedEmailLoadMore.hidden = restrictedEmailNextOffset === null;
    restrictedEmailLoadMore.disabled = false;
    restrictedEmailsPanel.hidden = false;
    renderRestrictedEmails();
  } catch (error) {
    restrictedEmailsPanel.hidden = error.message.includes("administrator");
    restrictedEmailFeedback.textContent = error.message;
    restrictedEmailFeedback.classList.add("error");
  } finally {
    restrictedEmailLoadMore.disabled = false;
  }
}
function renderRestrictedEmails() {
  restrictedEmailList.replaceChildren();
  const query = document.getElementById("restricted-email-search").value.trim().toLocaleLowerCase(),
    reasonFilter = document.getElementById("restricted-email-reason-filter").value;
  const emails = restrictedEmailEntries.filter(
    (entry) =>
      (!query || filterText(entry.email, entry.reason, entry.createdBy).includes(query)) &&
      (!reasonFilter || (reasonFilter === "with-reason" ? Boolean(entry.reason) : !entry.reason)),
  );
  restrictedEmailFeedback.textContent = `Showing ${emails.length} matches in ${restrictedEmailEntries.length} of ${restrictedEmailTotal} restrictions loaded.`;
  restrictedEmailLoadMore.hidden = restrictedEmailNextOffset === null;
  if (!emails.length) {
    restrictedEmailFeedback.textContent = restrictedEmailEntries.length
      ? "No restricted emails match these filters."
      : "No email addresses are restricted.";
    return;
  }
  emails.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "admin-user-item";
    const label = document.createElement("div");
    label.className = "admin-user-email";
    label.textContent = entry.email;
    const note = document.createElement("span");
    note.className = "admin-user-added";
    note.textContent = `Blocked ${prettyDate(entry.createdAt)} by ${entry.createdBy}${entry.reason ? ` · ${entry.reason}` : ""}`;
    label.append(note);
    const unblock = document.createElement("button");
    unblock.type = "button";
    unblock.className = "admin-remove";
    unblock.textContent = "Remove block";
    unblock.setAttribute("aria-label", `Remove email restriction for ${entry.email}`);
    unblock.addEventListener("click", async () => {
      if (
        !window.confirm(
          `Remove the sign-in block for ${entry.email}? Any account disabled by this block will remain deactivated until the site owner reactivates it.`,
        )
      )
        return;
      unblock.disabled = true;
      restrictedEmailFeedback.textContent = "Removing email block…";
      try {
        const response = await fetch(
          `/api/admin/restricted-emails?email=${encodeURIComponent(entry.email)}`,
          { method: "DELETE", headers: { accept: "application/json" } },
        );
        const saved = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(saved.error || "Email block could not be removed.");
        await loadRestrictedEmails();
        restrictedEmailFeedback.textContent = saved.message || "Email block removed.";
      } catch (error) {
        unblock.disabled = false;
        restrictedEmailFeedback.textContent = error.message;
        restrictedEmailFeedback.classList.add("error");
      }
    });
    item.append(label, unblock);
    restrictedEmailList.append(item);
  });
}
async function loadGhostAccess(offset = 0, append = false) {
  ghostAccessPanel.hidden = false;
  ghostAccessLoadMore.disabled = true;
  ghostAccessFeedback.textContent = "Loading account access…";
  ghostAccessFeedback.classList.remove("error");
  try {
    const response = await fetch(`/api/admin/ghost-access?offset=${offset}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Ghost mode access could not be loaded.");
    ghostAccessUsers = append ? [...ghostAccessUsers, ...(result.users || [])] : result.users || [];
    ghostAccessTotal = Number(result.total) || 0;
    ghostAccessNextOffset = result.nextOffset ?? null;
    ghostAccessLoadMore.hidden = ghostAccessNextOffset === null;
    renderGhostAccess();
  } catch (error) {
    ghostAccessFeedback.textContent = error.message;
    ghostAccessFeedback.classList.add("error");
  } finally {
    ghostAccessLoadMore.disabled = false;
  }
}
function renderGhostAccess() {
  const query = document.getElementById("ghost-access-search").value.trim().toLocaleLowerCase(),
    access = document.getElementById("ghost-access-filter").value,
    provider = document.getElementById("ghost-provider-filter").value;
  const users = ghostAccessUsers.filter(
    (user) =>
      (!query || filterText(user.name, user.email, user.ghostHandle).includes(query)) &&
      (!access || (access === "enabled" ? user.enabled : !user.enabled)) &&
      (!provider || user.provider === provider),
  );
  ghostAccessList.replaceChildren();
  ghostAccessFeedback.textContent = `Showing ${users.length} matches in ${ghostAccessUsers.length} of ${ghostAccessTotal} accounts loaded.`;
  ghostAccessLoadMore.hidden = ghostAccessNextOffset === null;
  if (!users.length) {
    ghostAccessFeedback.textContent = ghostAccessUsers.length
      ? "No NFD accounts match these filters."
      : "No NFD accounts are available yet.";
    return;
  }
  users.forEach((user) => {
    const item = document.createElement("li");
    item.className = "admin-user-item";
    const label = document.createElement("div");
    label.className = "admin-user-email";
    label.textContent = user.name || user.email || "NFD member";
    if (user.email) addText(label, "span", "member-email", user.email);
    const note = document.createElement("span");
    note.className = "admin-user-added";
    note.textContent = user.ghostHandle
      ? `Ghost profile · @${user.ghostHandle}`
      : `${user.provider === "google" ? "Google" : "ChatGPT"} account`;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "secondary-button ghost-access-toggle";
    toggle.setAttribute("aria-pressed", String(user.enabled));
    toggle.setAttribute(
      "aria-label",
      `${user.enabled ? "Disable" : "Enable"} Ghost mode for ${user.name || user.email || "NFD member"}`,
    );
    toggle.textContent = user.enabled ? "Disable Ghost mode" : "Enable Ghost mode";
    toggle.addEventListener("click", async () => {
      toggle.disabled = true;
      ghostAccessFeedback.textContent = `${user.enabled ? "Removing" : "Enabling"} Ghost mode access…`;
      try {
        const update = await fetch("/api/admin/ghost-access", {
          method: "PUT",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ userId: user.id, enabled: !user.enabled }),
        });
        const saved = await update.json().catch(() => ({}));
        if (!update.ok) throw new Error(saved.error || "Ghost mode access could not be changed.");
        await loadGhostAccess();
        ghostAccessFeedback.textContent = `Ghost mode ${saved.enabled ? "enabled" : "disabled"} for ${user.name || user.email || "NFD member"}.`;
      } catch (error) {
        toggle.disabled = false;
        ghostAccessFeedback.textContent = error.message;
        ghostAccessFeedback.classList.add("error");
      }
    });
    item.append(label, note, toggle);
    ghostAccessList.append(item);
  });
}
async function loadActivityAudit(offset = 0, append = false) {
  activityAudit.hidden = false;
  activityAuditLoadMore.disabled = true;
  activityAuditFeedback.textContent = "Loading account activity…";
  activityAuditFeedback.classList.remove("error");
  try {
    const response = await fetch(`/api/admin/activity?offset=${offset}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Account activity could not be loaded.");
    activityEntries = append ? [...activityEntries, ...(result.activities || [])] : result.activities || [];
    activityTotal = Number(result.total) || 0;
    activityNextOffset = result.nextOffset ?? null;
    activityAuditLoadMore.hidden = activityNextOffset === null;
    setDynamicFilterOptions(
      document.getElementById("activity-action-filter"),
      activityEntries.map((item) => item.action),
      "All actions",
      (value) => value.replaceAll("_", " "),
    );
    setDynamicFilterOptions(
      document.getElementById("activity-provider-filter"),
      activityEntries.map((item) => item.details?.provider),
      "All providers",
    );
    renderActivityAudit();
  } catch (error) {
    activityAuditFeedback.textContent = error.message;
    activityAuditFeedback.classList.add("error");
  } finally {
    activityAuditLoadMore.disabled = false;
  }
}
function renderActivityAudit() {
  const query = document.getElementById("activity-search").value.trim().toLocaleLowerCase(),
    action = document.getElementById("activity-action-filter").value,
    provider = document.getElementById("activity-provider-filter").value;
  const items = activityEntries.filter(
    (activity) =>
      (!query ||
        filterText(
          activity.displayName,
          activity.email,
          activity.action,
          activity.targetType,
          activity.targetId,
          JSON.stringify(activity.details || {}),
        ).includes(query)) &&
      (!action || activity.action === action) &&
      (!provider || activity.details?.provider === provider),
  );
  activityAuditList.replaceChildren();
  activityAuditFeedback.textContent = `Showing ${items.length} matches in ${activityEntries.length} of ${activityTotal} account activities loaded.`;
  activityAuditLoadMore.hidden = activityNextOffset === null;
  if (!items.length) {
    activityAuditFeedback.textContent = activityEntries.length
      ? "No activity matches these filters."
      : "No account activity has been recorded yet.";
    return;
  }
  items.forEach((activity) => {
    const item = document.createElement("li");
    item.className = "admin-user-item audit-activity";
    const label = document.createElement("div");
    label.className = "admin-user-email";
    label.textContent = activity.displayName || activity.email || "NFD member";
    const when = addText(label, "time", "audit-time", prettyDate(activity.createdAt));
    when.dateTime = activity.createdAt;
    addText(label, "span", "member-email", activity.email || "");
    const meta = addText(item, "div", "audit-details", activity.action.replaceAll("_", " "));
    const detail = [];
    if (activity.details?.provider) detail.push(activity.details.provider);
    if (activity.details?.reaction) detail.push(activity.details.reaction);
    if (activity.details?.visibility) detail.push(`${activity.details.visibility} audience`);
    if (Number.isFinite(activity.details?.attachmentCount))
      detail.push(
        `${activity.details.attachmentCount} attachment${activity.details.attachmentCount === 1 ? "" : "s"}`,
      );
    if (activity.targetType !== "account" && activity.targetType && activity.targetId)
      detail.push(`${activity.targetType} · ${activity.targetId}`);
    if (detail.length) addText(meta, "span", "audit-time", detail.join(" · "));
    item.append(label, meta);
    activityAuditList.append(item);
  });
}
async function loadModerationSettings() {
  moderationSettings.hidden = false;
  moderationFeedback.textContent = "Loading automatic-review settings…";
  moderationFeedback.classList.remove("error");
  moderationToggle.disabled = true;
  try {
    const response = await fetch("/api/moderation/settings", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Review settings could not be loaded.");
    moderationToggle.setAttribute("aria-pressed", String(result.enabled));
    moderationToggle.textContent = result.enabled ? "Turn automatic review off" : "Turn automatic review on";
    moderationToggle.disabled = !result.ready && !result.enabled;
    moderationFeedback.textContent = result.ready
      ? result.enabled
        ? "Gemini is connected. New posts must pass its review before sharing."
        : "Gemini is connected. Automatic review is off."
      : "Gemini key is not connected. Add GEMINI_API_KEY to NFD’s private runtime settings to turn this on.";
    moderationToggle.dataset.enabled = String(result.enabled);
  } catch (error) {
    moderationFeedback.textContent = error.message;
    moderationFeedback.classList.add("error");
  }
}
async function loadSessionTimeoutSettings() {
  sessionTimeoutSettings.hidden = false;
  sessionTimeoutFeedback.textContent = "Loading session timeout…";
  sessionTimeoutFeedback.classList.remove("error");
  sessionTimeoutSave.disabled = true;
  try {
    const response = await fetch("/api/admin/session-timeout", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Session timeout settings could not be loaded.");
    sessionTimeoutMinutesInput.value = String(result.minutes);
    applySessionIdleMinutes(result.minutes);
    sessionTimeoutFeedback.textContent = `Users are signed out after ${result.minutes} minutes without activity.`;
  } catch (error) {
    sessionTimeoutFeedback.textContent = error.message;
    sessionTimeoutFeedback.classList.add("error");
  } finally {
    sessionTimeoutSave.disabled = false;
  }
}
async function loadQuickStoriesSettings() {
  quickStoriesSettings.hidden = false;
  quickStoriesFeedback.textContent = "Loading Quick Stories settings…";
  quickStoriesFeedback.classList.remove("error");
  quickStoriesToggle.disabled = true;
  let loaded = false;
  try {
    const response = await fetch("/api/admin/quick-stories", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Quick Stories settings could not be loaded.");
    quickStoriesToggle.dataset.enabled = String(result.enabled);
    quickStoriesToggle.setAttribute("aria-pressed", String(result.enabled));
    quickStoriesToggle.textContent = result.enabled ? "Turn Quick Stories off" : "Turn Quick Stories on";
    quickStoriesFeedback.textContent = result.enabled
      ? "Quick Stories are available to all NFD members."
      : "Quick Stories are currently disabled for all NFD members.";
    loaded = true;
  } catch (error) {
    quickStoriesFeedback.textContent = error.message;
    quickStoriesFeedback.classList.add("error");
  } finally {
    quickStoriesToggle.disabled = !loaded;
  }
}
async function loadReviewModerationStatus() {
  aiReviewConsent.hidden = true;
  aiReviewConsentCheckbox.checked = false;
  aiReviewConsentCheckbox.required = false;
  const confirmButton = document.getElementById("confirm-review");
  confirmButton.disabled = true;
  try {
    const response = await fetch("/api/moderation/settings", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Automatic review settings could not be checked.");
    if (result.enabled) {
      aiReviewConsent.hidden = false;
      aiReviewConsentCheckbox.required = true;
    }
    confirmButton.disabled = false;
  } catch {
    reviewNotice.textContent =
      "NFD could not check the automatic review requirement. Refresh the page and try again.";
    reviewNotice.classList.add("show", "error");
    reviewNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
async function loadAdminUsers() {
  setAdminFeedback("Checking administrator permissions…");
  try {
    const response = await fetch("/api/admins", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 403) {
      adminManagement.hidden = true;
      setAdminFeedback("Only the site owner can manage administrator access.", true);
      return;
    }
    if (!response.ok) throw new Error(result.error || "Administrator settings could not be loaded.");
    adminManagement.hidden = false;
    renderAdminUsers(result);
    setAdminFeedback("Administrator access is up to date.");
  } catch (error) {
    setAdminFeedback(error.message, true);
  }
}
async function loadAdminPage() {
  adminPage.hidden = false;
  appLayout.hidden = true;
  document.title = "Administrator — NFD";
  const pageKey =
    location.pathname === "/admin" ? "overview" : location.pathname.split("/").filter(Boolean).at(-1);
  const pageTitles = {
    overview: "Administrator access",
    "ghost-access": "Ghost mode access",
    "restricted-emails": "Restricted email accounts",
    posts: "Manage shared posts",
    members: "People using NFD",
    activity: "Account activity",
    moderation: "Automatic post review",
    "session-timeout": "Session timeout",
    "quick-stories": "Quick Stories",
    admins: "Manage administrators",
  };
  const panels = [
    adminOverview,
    adminManagement,
    memberDirectory,
    ghostAccessPanel,
    activityAudit,
    moderationSettings,
    sessionTimeoutSettings,
    quickStoriesSettings,
    adminPostManagement,
    restrictedEmailsPanel,
  ];
  panels.forEach((panel) => {
    if (panel) panel.hidden = true;
  });
  adminFeedback.hidden = pageKey !== "admins";
  document.getElementById("admin-heading").textContent = pageTitles[pageKey] || "Administrator access";
  document.querySelectorAll("[data-admin-page]").forEach((link) => {
    const active = link.dataset.adminPage === pageKey;
    link.toggleAttribute("aria-current", active);
    if (active) link.setAttribute("aria-current", "page");
  });
  try {
    const response = await fetch("/api/admins", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const isOwner = response.ok;
    document.querySelectorAll("[data-owner-only]").forEach((link) => {
      link.hidden = !isOwner;
    });
  } catch {
    document.querySelectorAll("[data-owner-only]").forEach((link) => {
      link.hidden = true;
    });
  }
  if (pageKey === "overview") {
    adminOverview.hidden = false;
    return;
  }
  if (pageKey === "ghost-access") {
    await loadGhostAccess();
    return;
  }
  if (pageKey === "restricted-emails") {
    await loadRestrictedEmails();
    return;
  }
  if (pageKey === "posts") {
    await loadAdminExperiences("");
    return;
  }
  if (pageKey === "members") {
    await loadMemberDirectory();
    return;
  }
  if (pageKey === "activity") {
    await loadActivityAudit();
    return;
  }
  if (pageKey === "moderation") {
    await loadModerationSettings();
    return;
  }
  if (pageKey === "session-timeout") {
    await loadSessionTimeoutSettings();
    return;
  }
  if (pageKey === "quick-stories") {
    await loadQuickStoriesSettings();
    return;
  }
  if (pageKey === "admins") {
    await loadAdminUsers();
    return;
  }
  adminOverview.hidden = false;
}
