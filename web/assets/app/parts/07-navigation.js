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
      if (document.visibilityState === "visible" && location.pathname !== "/messages")
        refreshMessageNavBadge();
    }, 30000);
  } catch {
    setMainNavigationVisible(false);
  }
}
updateNavigation();
