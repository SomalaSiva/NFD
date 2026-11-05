async function updateNavigation() {
  if (location.pathname === "/login") {
    try {
      sessionStorage.setItem(FEED_TAGLINE_LOGIN_PENDING_KEY, "1");
    } catch {
      // Rotation is best-effort when session storage is unavailable.
    }
    setMainNavigationVisible(false);
    return;
  }
  try {
    const response = await fetch("/api/auth-status", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      setMainNavigationVisible(false);
      if (response.status === 401) location.replace("/auth/signout?idle=1&return_to=%2Flogin%3Fidle%3D1");
      return;
    }
    const result = await response.json().catch(() => ({}));
    applySessionIdleMinutes(result.sessionIdleMinutes);
    startSessionActivityTracking();
    currentUserId = result.userId || currentUserId;
    if (
      location.pathname === "/trust-score" &&
      ["my-agreements", "record"].includes(new URLSearchParams(location.search).get("tab"))
    ) {
      loadStoredAgreements();
    }
    syncFeedTagline(currentUserId);
    setProfilePhotoEverywhere(result.profilePhotoUrl || "", result.displayName || "NFD member");
    accountAdminLink.hidden = !result.isAdmin;
    setMainNavigationVisible(true);
    clearInterval(sessionTimeoutRefreshTimer);
    sessionTimeoutRefreshTimer = setInterval(refreshSessionIdleMinutes, 30000);
    currentGhostMode = result.ghostMode || { allowed: false, active: false, profile: null };
    const hasGhostProfile = Boolean(currentGhostMode.profile);
    ghostModeSetupLink.hidden = !currentGhostMode.allowed || hasGhostProfile;
    ghostModeToggle.hidden = !currentGhostMode.allowed || !hasGhostProfile;
    ghostModeToggle.textContent = currentGhostMode.active ? "Turn off Ghost mode" : "Turn on Ghost mode";
    ghostModeBanner.hidden = !currentGhostMode.active;
    ghostModeHandle.textContent = currentGhostMode.profile?.handle
      ? `@${currentGhostMode.profile.handle}`
      : "";
    void loadStories();
    clearInterval(storyTrayRefreshTimer);
    storyTrayRefreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") loadStories();
    }, 60000);
    await refreshMessageNavBadge();
    clearInterval(messageNavRefreshTimer);
    messageNavRefreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") refreshMessageNavBadge();
    }, 15000);
  } catch {
    setMainNavigationVisible(false);
  }
}
updateNavigation();
sessionTimeoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const minutes = Number(sessionTimeoutMinutesInput.value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) {
    sessionTimeoutFeedback.textContent = "Choose a whole number from 1 to 120 minutes.";
    sessionTimeoutFeedback.classList.add("error");
    return;
  }
  sessionTimeoutSave.disabled = true;
  sessionTimeoutFeedback.textContent = "Saving session timeout…";
  sessionTimeoutFeedback.classList.remove("error");
  try {
    const response = await fetch("/api/admin/session-timeout", {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ minutes }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Session timeout could not be saved.");
    sessionTimeoutMinutesInput.value = String(result.minutes);
    applySessionIdleMinutes(result.minutes);
    sessionTimeoutFeedback.textContent = `Saved. Users will be signed out after ${result.minutes} minutes without activity.`;
  } catch (error) {
    sessionTimeoutFeedback.textContent = error.message;
    sessionTimeoutFeedback.classList.add("error");
  } finally {
    sessionTimeoutSave.disabled = false;
  }
});
quickStoriesToggle.addEventListener("click", async () => {
  const enabled = quickStoriesToggle.dataset.enabled === "true";
  quickStoriesToggle.disabled = true;
  quickStoriesFeedback.textContent = "Saving Quick Stories setting…";
  quickStoriesFeedback.classList.remove("error");
  try {
    const response = await fetch("/api/admin/quick-stories", {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Quick Stories setting could not be saved.");
    quickStoriesToggle.dataset.enabled = String(result.enabled);
    quickStoriesToggle.setAttribute("aria-pressed", String(result.enabled));
    quickStoriesToggle.textContent = result.enabled ? "Turn Quick Stories off" : "Turn Quick Stories on";
    quickStoriesFeedback.textContent = result.enabled
      ? "Quick Stories are available to all NFD members."
      : "Quick Stories are disabled for everyone. Existing stories remain hidden until they expire or the feature is re-enabled.";
    await loadStories();
  } catch (error) {
    quickStoriesFeedback.textContent = error.message;
    quickStoriesFeedback.classList.add("error");
  } finally {
    quickStoriesToggle.disabled = false;
  }
});
moderationToggle.addEventListener("click", async () => {
  const enabled = moderationToggle.dataset.enabled === "true";
  moderationToggle.disabled = true;
  moderationFeedback.textContent = "Saving review setting…";
  try {
    const response = await fetch("/api/moderation/settings", {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Review setting could not be saved.");
    moderationToggle.dataset.enabled = String(result.enabled);
    moderationToggle.setAttribute("aria-pressed", String(result.enabled));
    moderationToggle.textContent = result.enabled ? "Turn automatic review off" : "Turn automatic review on";
    moderationFeedback.textContent = result.enabled
      ? "Gemini is connected. New posts must pass its review before sharing."
      : "Gemini is connected. Automatic review is off.";
  } catch (error) {
    moderationFeedback.textContent = error.message;
    moderationFeedback.classList.add("error");
  } finally {
    moderationToggle.disabled = false;
  }
});
document.getElementById("admin-add-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.getElementById("admin-email");
  const email = input.value.trim();
  if (!email) return;
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  setAdminFeedback("Adding admin access…");
  try {
    const response = await fetch("/api/admins", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Admin access could not be added.");
    input.value = "";
    renderAdminUsers(result);
    setAdminFeedback(`Admin access granted to ${email}.`);
  } catch (error) {
    setAdminFeedback(error.message, true);
  } finally {
    button.disabled = false;
  }
});
document.getElementById("admin-post-search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  loadAdminExperiences(adminPostSearch.value.trim(), 0, false);
});
document.getElementById("admin-user-search").addEventListener("input", () => {
  if (adminUsersData) renderAdminUsers(adminUsersData);
});
document.getElementById("admin-user-type-filter").addEventListener("change", () => {
  if (adminUsersData) renderAdminUsers(adminUsersData);
});
document.getElementById("member-search").addEventListener("input", renderMemberDirectory);
document.getElementById("member-provider-filter").addEventListener("change", renderMemberDirectory);
document.getElementById("member-status-filter").addEventListener("change", renderMemberDirectory);
document.getElementById("admin-post-visibility-filter").addEventListener("change", renderAdminExperiences);
document.getElementById("admin-post-author-filter").addEventListener("change", renderAdminExperiences);
document.getElementById("admin-post-category-filter").addEventListener("change", renderAdminExperiences);
document.getElementById("restricted-email-search").addEventListener("input", renderRestrictedEmails);
document.getElementById("restricted-email-reason-filter").addEventListener("change", renderRestrictedEmails);
document.getElementById("ghost-access-search").addEventListener("input", renderGhostAccess);
document.getElementById("ghost-access-filter").addEventListener("change", renderGhostAccess);
document.getElementById("ghost-provider-filter").addEventListener("change", renderGhostAccess);
document.getElementById("activity-search").addEventListener("input", renderActivityAudit);
document.getElementById("activity-action-filter").addEventListener("change", renderActivityAudit);
document.getElementById("activity-provider-filter").addEventListener("change", renderActivityAudit);
memberDirectoryLoadMore.addEventListener("click", () => {
  if (memberDirectoryNextOffset !== null) loadMemberDirectory(memberDirectoryNextOffset, true);
});
adminPostLoadMore.addEventListener("click", () => {
  if (adminExperienceNextOffset !== null)
    loadAdminExperiences(adminPostSearch.value.trim(), adminExperienceNextOffset, true);
});
restrictedEmailLoadMore.addEventListener("click", () => {
  if (restrictedEmailNextOffset !== null) loadRestrictedEmails(restrictedEmailNextOffset, true);
});
ghostAccessLoadMore.addEventListener("click", () => {
  if (ghostAccessNextOffset !== null) loadGhostAccess(ghostAccessNextOffset, true);
});
activityAuditLoadMore.addEventListener("click", () => {
  if (activityNextOffset !== null) loadActivityAudit(activityNextOffset, true);
});
document.getElementById("restricted-email-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const emailInput = document.getElementById("restricted-email-input");
  const reasonInput = document.getElementById("restricted-email-reason");
  const email = emailInput.value.trim().toLowerCase();
  if (!email) return;
  if (
    !window.confirm(
      `Block ${email} from signing in or creating an NFD account? Any existing matching account will be deactivated and signed out.`,
    )
  )
    return;
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  restrictedEmailFeedback.textContent = "Blocking email and deactivating matching accounts…";
  restrictedEmailFeedback.classList.remove("error");
  try {
    const response = await fetch("/api/admin/restricted-emails", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, reason: reasonInput.value.trim() }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Email could not be blocked.");
    emailInput.value = "";
    reasonInput.value = "";
    await loadRestrictedEmails();
    restrictedEmailFeedback.textContent = `${email} is blocked. ${result.deactivatedAccounts || 0} existing ${Number(result.deactivatedAccounts) === 1 ? "account was" : "accounts were"} deactivated.`;
  } catch (error) {
    restrictedEmailFeedback.textContent = error.message;
    restrictedEmailFeedback.classList.add("error");
  } finally {
    button.disabled = false;
  }
});
