if (location.pathname === "/login") {
  appLayout.hidden = true;
  loginPage.hidden = false;
  setMainNavigationVisible(false);
  document.title = "Sign in — NFD";
  const params = new URLSearchParams(location.search);
  const adminLogin = params.get("mode") === "admin" || params.get("return_to") === "/admin";
  const loginReturnTo = adminLogin ? "/admin" : "/feed";
  const adminLink = document.getElementById("login-admin-link");
  adminLink.hidden = false;
  adminLink.href = adminLogin ? "/login" : "/login?mode=admin";
  adminLink.textContent = adminLogin ? "User sign in" : "Admin";
  adminLink.setAttribute(
    "aria-label",
    adminLogin ? "Switch to user sign in" : "Switch to administrator sign in",
  );
  document.getElementById("login-heading").textContent = adminLogin
    ? "Administrator sign in"
    : "Sign in to NFD";
  document.getElementById("login-intro").textContent = adminLogin
    ? "Sign in with your approved NFD administrator account to open the admin area."
    : "Use your Google or ChatGPT account to read or share stories. NFD checks administrator access behind the scenes.";
  document.getElementById("login-access-heading").textContent = adminLogin
    ? "Administrator access"
    : "User access";
  document.getElementById("login-access-description").textContent = adminLogin
    ? "Use your authorized NFD account. Administrator permissions are checked securely."
    : "Read the stories and add one of your own.";
  document.getElementById("user-signin").href =
    `/auth/chatgpt-resume?return_to=${encodeURIComponent(loginReturnTo)}`;
  document.getElementById("google-user-signin").href =
    `/auth/google?return_to=${encodeURIComponent(loginReturnTo)}`;
  if (params.get("idle") === "1") {
    const feedback = document.getElementById("google-feedback");
    feedback.style.display = "block";
    feedback.textContent =
      "You were signed out after being inactive for too long. Sign in again to continue.";
  }
  if (params.get("access") === "denied") document.getElementById("auth-denied").style.display = "block";
  const googleStatus = params.get("google");
  if (googleStatus) {
    const feedback = document.getElementById("google-feedback");
    feedback.style.display = "block";
    feedback.textContent =
      googleStatus === "setup"
        ? "Google sign-in is not set up yet. The NFD owner needs to finish connecting Google."
        : googleStatus === "cancelled"
          ? "Google sign-in was cancelled. No account changes were made."
          : "Google sign-in could not be completed. Please try again.";
  }
  if (params.get("account") === "restricted" || params.get("account") === "deactivated") {
    const feedback = document.getElementById("google-feedback");
    feedback.style.display = "block";
    feedback.textContent =
      params.get("account") === "restricted"
        ? "This email address is restricted from signing in to or creating an NFD account. Contact an NFD administrator if you think this is an error."
        : "This NFD account is deactivated. Contact an NFD administrator if you think this is an error.";
  }
} else if (location.pathname === "/admin" || location.pathname.startsWith("/admin/")) {
  void loadAdminPage();
} else if (location.pathname === "/profile") {
  appLayout.classList.add("profile-mode");
  form.hidden = true;
  reviewPage.hidden = true;
  feedPage.hidden = true;
  profilePage.hidden = false;
  appLayout.classList.toggle(
    "profile-details-mode",
    new URLSearchParams(location.search).get("edit") === "details",
  );
  document.title = "Your profile — NFD";
  loadProfile();
} else if (location.pathname === "/messages") {
  appLayout.classList.add("profile-mode");
  form.hidden = true;
  reviewPage.hidden = true;
  feedPage.hidden = true;
  profilePage.hidden = true;
  messagesPage.hidden = false;
  document.title = "Messages — NFD";
  loadMessagesPage();
} else if (location.pathname === "/trust-score") {
  appLayout.classList.add("profile-mode");
  form.hidden = true;
  reviewPage.hidden = true;
  feedPage.hidden = true;
  profilePage.hidden = true;
  messagesPage.hidden = true;
  trustScorePage.hidden = false;
  trustScoreOverviewMeter.replaceChildren(createTrustScorePreview("Your profile", true));
  const initialTrustTab = new URLSearchParams(location.search).get("tab");
  activateTrustScoreTab(initialTrustTab, false);
  if (initialTrustTab !== "allegations") void loadTrustDashboard();
  document.title = "Trust Score — NFD";
} else if (location.pathname === "/feed" || location.pathname === "/feed/") {
  appLayout.classList.add("feed-mode");
  form.hidden = true;
  reviewPage.hidden = true;
  feedPage.hidden = false;
  document.title = "Lore Feed — NFD";
  if (new URLSearchParams(location.search).has("shared")) {
    feedBanner.hidden = false;
    feedBanner.classList.add("show");
  }
  loadFeed();
}
experienceCategoryInput.addEventListener("change", updateIncidentCategoryOptions);
