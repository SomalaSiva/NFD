let trustAdminOffset = 0;
let trustAdminQuery = "";

function setProfileMessage(message, isError = false) {
  profileMessage.textContent = message;
  profileMessage.classList.toggle("error", isError);
  profileMessage.hidden = !message;
}
function renderGhostSettings(state) {
  currentGhostMode = state || { allowed: false, active: false, profile: null };
  const setupRequested = new URLSearchParams(location.search).get("ghost") === "setup";
  ghostSettings.hidden = !currentGhostMode.allowed || (!currentGhostMode.profile && !setupRequested);
  if (!currentGhostMode.allowed) return;
  const profile = currentGhostMode.profile;
  ghostProfileReady.hidden = !profile;
  ghostCreateForm.hidden = Boolean(profile) || !setupRequested;
  if (profile) {
    ghostProfileName.textContent = profile.name || "Ghost profile";
    ghostProfileHandle.textContent = `@${profile.handle}`;
    ghostProfileToggle.textContent = currentGhostMode.active ? "Turn off Ghost mode" : "Turn on Ghost mode";
    ghostProfileState.textContent = currentGhostMode.active ? "Ghost mode is on." : "Ghost mode is off.";
    ghostSettingsFeedback.textContent = "Your Ghost identity is separate from your personal account.";
  } else
    ghostSettingsFeedback.textContent =
      "Ghost mode is enabled for your account. Create one separate identity to get started.";
}
async function loadGhostSettings() {
  try {
    const response = await fetch("/api/ghost-mode", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Ghost mode settings could not be loaded.");
    renderGhostSettings(result);
  } catch (error) {
    ghostSettings.hidden = true;
    setProfileMessage(error.message, true);
  }
}
async function changeGhostMode(active, button) {
  if (button) button.disabled = true;
  ghostSettingsFeedback.textContent = active ? "Turning Ghost mode on…" : "Turning Ghost mode off…";
  try {
    const response = await fetch("/api/ghost-mode", {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ active }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Ghost mode could not be changed.");
    window.location.assign("/feed");
  } catch (error) {
    ghostSettingsFeedback.textContent = error.message;
    if (button) button.disabled = false;
  }
}
ghostCreateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = ghostCreateForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  ghostSettingsFeedback.textContent = "Creating your separate identity…";
  try {
    const response = await fetch("/api/ghost-profile", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        name: document.getElementById("ghost-name").value,
        handle: document.getElementById("ghost-handle").value,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your Ghost profile could not be created.");
    window.history.replaceState(null, "", "/profile");
    await loadGhostSettings();
  } catch (error) {
    ghostSettingsFeedback.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});
ghostProfileToggle.addEventListener("click", () =>
  changeGhostMode(!currentGhostMode.active, ghostProfileToggle),
);
ghostProfileDeactivate.addEventListener("click", async () => {
  const handle = currentGhostMode.profile?.handle || "this Ghost ID";
  if (
    !window.confirm(
      `Deactivate @${handle}? Ghost mode will turn off. You can then create a new Ghost ID. This ID will no longer be available for new friend requests.`,
    )
  )
    return;
  ghostProfileDeactivate.disabled = true;
  ghostSettingsFeedback.textContent = "Deactivating your Ghost ID…";
  try {
    const response = await fetch("/api/ghost-profile", {
      method: "DELETE",
      headers: { accept: "application/json" },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your Ghost ID could not be deactivated.");
    window.location.assign("/profile");
  } catch (error) {
    ghostSettingsFeedback.textContent = error.message;
    ghostProfileDeactivate.disabled = false;
  }
});
ghostModeToggle.addEventListener("click", () => changeGhostMode(!currentGhostMode.active, ghostModeToggle));
ghostModeExit.addEventListener("click", () => changeGhostMode(false, ghostModeExit));
function renderProfile(data, { append = false } = {}) {
  const user = data.user || {};
  const isProfileDetailsPage = new URLSearchParams(location.search).get("edit") === "details";
  const displayName = user.name || user.email?.split("@")[0] || "NFD member";
  if (!append) {
    document.getElementById("profile-intro").textContent =
      user.provider === "ghost"
        ? "This Ghost identity has its own friends, messages, and posts, separate from your personal NFD profile."
        : "Your display name, username, and bio are visible on your NFD profile. Your email and sign-in details stay private.";
    profileSummaryContent.replaceChildren();
    setProfilePhotoEverywhere(user.photoUrl || "", displayName);
    const identity = addText(profileSummaryContent, "div", "profile-identity", "");
    const titleRow = document.createElement("div");
    titleRow.className = "profile-identity-title-row";
    addText(titleRow, "h2", "", displayName);
    if (user.provider !== "ghost") {
      const editProfileLink = addText(titleRow, "a", "profile-edit-link", "Edit");
      editProfileLink.href = "/profile?edit=details";
      editProfileLink.setAttribute("aria-label", "Edit profile details");
    }
    identity.append(titleRow);
    if (user.provider === "ghost" && user.ghostHandle) {
      addText(identity, "p", "profile-identity-handle", `@${user.ghostHandle}`);
    } else if (user.username) {
      addText(identity, "p", "profile-identity-handle", `@${user.username}`);
    }
    if (user.bio) addText(identity, "p", "profile-identity-bio", user.bio);
    profileDetailsPanel.hidden = user.provider === "ghost" || !isProfileDetailsPage;
    if (user.provider !== "ghost") {
      profileDisplayNameInput.value = user.name || "";
      profileUsernameInput.value = user.username || "";
      profileBioInput.value = user.bio || "";
      profileBioCount.textContent = `${profileBioInput.value.length}/160`;
      profileDetailsFeedback.hidden = true;
      profileDetailsFeedback.textContent = "";
      profileDetailsSave.disabled = false;
      profileDetailsSave.textContent = "Save profile";
    }
    profileSummaryScore.replaceChildren(createTrustScorePreview(displayName, true));
    profilePostList.replaceChildren();
    profilePostCursor = null;
  }
  const posts = data.experiences || [];
  if (!append) {
    profileTotalPosts = Number(data.total) || 0;
    profilePostCount.textContent = `${profileTotalPosts} ${profileTotalPosts === 1 ? "post" : "posts"} shared`;
  }
  if (!append && !posts.length) {
    const empty = document.createElement("div");
    empty.className = "profile-empty";
    addText(empty, "strong", "", "Nothing here yet");
    addText(empty, "p", "", "The stories you share will show up here.");
    const link = document.createElement("a");
    link.href = "/share";
    link.className = "submit";
    link.textContent = "Share an experience";
    empty.append(link);
    profilePostList.append(empty);
    profilePostLoadMore.hidden = true;
    return;
  }
  posts.forEach((experience) => {
    const card = document.createElement("article");
    card.className = "profile-post-card";
    card.dataset.experienceId = experience.id;
    const top = document.createElement("div");
    top.className = "profile-post-top";
    const titleGroup = document.createElement("div");
    addText(
      titleGroup,
      "h3",
      "profile-post-title",
      experience.shortDescription || experience.experienceCategory,
    );
    addText(
      titleGroup,
      "span",
      "profile-post-category",
      `${experience.experienceCategory || "Not provided"} · ${experience.incidentCategory || "Not provided"}`,
    );
    addText(
      titleGroup,
      "span",
      "profile-post-audience",
      { public: "Public · name shown", friends: "Friends only", anonymous: "Anonymous · name hidden" }[
        experience.visibility
      ] || "Public · name shown",
    );
    top.append(
      titleGroup,
      addText(top, "time", "profile-post-date", `Shared ${prettyDate(experience.createdAt)}`),
    );
    card.append(top);
    const meta = document.createElement("div");
    meta.className = "profile-post-meta";
    const where = document.createElement("span");
    where.innerHTML = "<strong>Where</strong> ";
    const placeSummary = [experience.place, experience.placeCategory].filter(Boolean).join(" · ");
    where.append(document.createTextNode(placeSummary || "Not provided"));
    meta.append(where);
    if (experience.locationDetails) {
      const area = document.createElement("span");
      area.innerHTML = "<strong>Area</strong> ";
      area.append(document.createTextNode(experience.locationDetails));
      meta.append(area);
    }
    where.append(document.createTextNode(""));
    const when = document.createElement("span");
    when.innerHTML = "<strong>When</strong> ";
    when.append(document.createTextNode(experienceTimeText(experience)));
    meta.append(when);
    card.append(meta);
    const full = document.createElement("details");
    full.className = "profile-post-full";
    addText(full, "summary", "", "Read the full story");
    addText(full, "p", "", experience.fullDescription || "No additional details were provided.");
    card.append(full);
    const evidence = experience.evidence || [];
    const images = evidence.filter((file) => file.contentType?.startsWith("image/"));
    const videos = evidence.filter((file) => file.contentType?.startsWith("video/"));
    const documents = evidence.filter(
      (file) => !file.contentType?.startsWith("image/") && !file.contentType?.startsWith("video/"),
    );
    if (images.length) {
      const gallery = document.createElement("div");
      gallery.className = `feed-photo-grid${images.length > 1 ? " multi scrollable" : ""}`;
      gallery.setAttribute(
        "aria-label",
        `${images.length} attached ${images.length === 1 ? "photo" : "photos"}`,
      );
      images.forEach((file) => {
        const link = document.createElement("a");
        link.className = "feed-photo";
        link.href = `/api/evidence/${encodeURIComponent(file.id)}`;
        link.setAttribute("aria-label", `Open photo: ${file.originalFilename || "attached photo"}`);
        link.addEventListener("click", (event) => {
          event.preventDefault();
          openPhotoViewer(link.href, image.alt);
        });
        const image = document.createElement("img");
        image.className = "feed-photo-image";
        image.alt = `Photo attached to ${experience.shortDescription || "your post"}`;
        image.loading = "lazy";
        image.decoding = "async";
        image.title = file.originalFilename;
        image.addEventListener(
          "load",
          () => {
            const isPortrait = image.naturalHeight > image.naturalWidth;
            image.classList.toggle("is-portrait", isPortrait);
            link.classList.toggle("is-portrait", isPortrait);
          },
          { once: true },
        );
        image.src = file.hasPreview ? `${link.href}?variant=preview` : link.href;
        link.append(image);
        gallery.append(link);
      });
      const media = document.createElement("div");
      media.className = "feed-media profile-post-media";
      media.append(gallery);
      card.append(media);
    }
    if (videos.length) {
      const gallery = document.createElement("div");
      gallery.className = `feed-video-grid${videos.length === 1 ? " single" : ""} profile-post-media`;
      videos.forEach((file) => {
        const item = document.createElement("div");
        item.className = "feed-video-item";
        const video = document.createElement("video");
        video.className = "feed-video";
        video.controls = true;
        video.preload = "none";
        video.playsInline = true;
        video.title = file.originalFilename;
        video.poster = videoFallbackPoster;
        video.addEventListener("loadedmetadata", () => {
          item.classList.toggle("is-portrait", video.videoHeight > video.videoWidth);
        });
        const source = `/api/evidence/${encodeURIComponent(file.id)}`;
        if (file.hasPreview) video.dataset.previewPoster = `${source}?variant=preview`;
        video.src = source;
        if (file.hasPreview) {
          if (feedVideoPosterObserver) feedVideoPosterObserver.observe(item);
          else video.poster = `${source}?variant=preview`;
        }
        const playbackMessage = addText(
          item,
          "p",
          "feed-video-error",
          "This video could not be played. Its format or codec may not be supported by this browser.",
        );
        playbackMessage.hidden = true;
        playbackMessage.setAttribute("role", "status");
        video.addEventListener("error", () => {
          playbackMessage.hidden = false;
        });
        item.prepend(video);
        gallery.append(item);
      });
      card.append(gallery);
    }
    if (documents.length) {
      const files = document.createElement("div");
      files.className = "profile-post-evidence";
      documents.forEach((file) => {
        const link = document.createElement("a");
        link.href = `/api/evidence/${encodeURIComponent(file.id)}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const label = file.contentType?.startsWith("video/")
          ? "Play video"
          : file.contentType?.startsWith("image/")
            ? "View photo"
            : "Open document";
        link.textContent = `${label} · ${file.originalFilename}`;
        files.append(link);
      });
      card.append(files);
    }
    const actions = document.createElement("div");
    actions.className = "profile-post-actions";
    const edit = addText(actions, "a", "profile-edit", "Edit post");
    edit.href = `/share?edit=${encodeURIComponent(experience.id)}`;
    edit.setAttribute(
      "aria-label",
      `Edit your post: ${experience.shortDescription || experience.experienceCategory}`,
    );
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "profile-delete";
    remove.textContent = "Delete this post";
    remove.setAttribute(
      "aria-label",
      `Delete your post: ${experience.shortDescription || experience.experienceCategory}`,
    );
    remove.addEventListener("click", async () => {
      if (!window.confirm("Delete this post and its attached files from NFD? This cannot be undone.")) return;
      remove.disabled = true;
      remove.textContent = "Deleting…";
      setProfileMessage("");
      try {
        const response = await fetch(`/api/experiences/${encodeURIComponent(experience.id)}`, {
          method: "DELETE",
          headers: { accept: "application/json" },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "The post could not be deleted.");
        card.remove();
        profileTotalPosts = Math.max(0, profileTotalPosts - 1);
        profilePostCount.textContent = `${profileTotalPosts} ${profileTotalPosts === 1 ? "post" : "posts"} shared`;
        if (profilePostCursor) profilePostCursor = null;
        profilePostLoadMore.hidden = true;
        const remaining = profilePostList.querySelectorAll(".profile-post-card").length;
        if (!remaining) {
          const empty = document.createElement("div");
          empty.className = "profile-empty";
          addText(empty, "strong", "", "Nothing here yet");
          addText(empty, "p", "", "The stories you share will show up here.");
          profilePostList.append(empty);
        }
        setProfileMessage(
          result.cleanupPending
            ? "Your post was removed. NFD is still cleaning up an attached file."
            : "Your post and attached files were removed.",
        );
      } catch (error) {
        remove.disabled = false;
        remove.textContent = "Delete this post";
        setProfileMessage(error.message, true);
      }
    });
    actions.append(remove);
    card.append(actions);
    profilePostList.append(card);
  });
  profilePostCursor = data.nextCursor || null;
  profilePostLoadMore.hidden = !profilePostCursor;
  profilePostLoadMore.disabled = false;
  profilePostLoadMore.textContent = "Load more posts";
}
async function loadProfile() {
  const profileParams = new URLSearchParams(location.search);
  const friendId = profileParams.get("friend");
  if (friendId) {
    appLayout.classList.remove("profile-details-mode");
    profileOwnView.hidden = true;
    friendProfileView.hidden = false;
    await loadFriendProfile(friendId);
    return;
  }
  const isProfileDetailsPage = profileParams.get("edit") === "details";
  appLayout.classList.toggle("profile-details-mode", isProfileDetailsPage);
  profileOwnView.hidden = false;
  friendProfileView.hidden = true;
  activateProfileTab(profileParams.get("tab") || "posts", false);
  if (profileParams.has("removed")) setFriendsFeedback("Friend removed.");
  profileMessage.hidden = true;
  profilePostList.replaceChildren();
  profileSummaryContent.replaceChildren(
    Object.assign(document.createElement("div"), {
      className: "profile-loading",
      textContent: "Loading your profile…",
    }),
  );
  profileSummaryScore.replaceChildren();
  profilePostCount.textContent = "Loading your posts…";
  try {
    const response = await fetch("/api/profile", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your profile could not be loaded.");
    renderProfile(result);
    if (profileParams.has("updated")) setProfileMessage("Your post was updated.");
    loadFriends();
    await loadGhostSettings();
  } catch (error) {
    profileSummaryContent.replaceChildren();
    profileSummaryScore.replaceChildren();
    profilePostList.replaceChildren();
    profilePostCount.textContent = "";
    const message = addText(
      profilePostList,
      "div",
      "profile-error",
      error instanceof TypeError
        ? "Your profile could not connect. Try refreshing this page."
        : error.message,
    );
    message.setAttribute("role", "alert");
  }
}
profilePostLoadMore.addEventListener("click", async () => {
  if (!profilePostCursor || profilePostsLoading) return;
  profilePostsLoading = true;
  profilePostLoadMore.disabled = true;
  profilePostLoadMore.textContent = "Loading…";
  const params = new URLSearchParams({ before: profilePostCursor.createdAt, beforeId: profilePostCursor.id });
  try {
    const response = await fetch(`/api/profile?${params}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "More posts could not be loaded.");
    renderProfile(result, { append: true });
  } catch (error) {
    setProfileMessage(error.message, true);
    profilePostLoadMore.disabled = false;
    profilePostLoadMore.textContent = "Try loading more";
  } finally {
    profilePostsLoading = false;
  }
});
function activateProfileTab(tab, updateUrl = true) {
  const availableTabs = new Set(profileTabs.map((button) => button.dataset.profileTab));
  const activeTab = availableTabs.has(tab) ? tab : "posts";
  profileTabs.forEach((button) => {
    const selected = button.dataset.profileTab === activeTab;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  profileTabPanels.forEach((panel) => {
    panel.hidden = panel.id !== `profile-panel-${activeTab}`;
  });
  if (updateUrl) {
    const url = new URL(location.href);
    url.search = "";
    if (activeTab !== "posts") url.searchParams.set("tab", activeTab);
    history.replaceState(null, "", url);
  }
}
function activateTrustScoreTab(tab, updateUrl = true) {
  const availableTabs = new Set(trustScoreTabs.map((button) => button.dataset.trustTab));
  const activeTab = availableTabs.has(tab) ? tab : "overview";
  trustScoreTabs.forEach((button) => {
    const selected = button.dataset.trustTab === activeTab;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  trustScorePanels.forEach((panel) => {
    panel.hidden = panel.id !== `trust-panel-${activeTab}`;
  });
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("tab", activeTab);
    history.replaceState(null, "", url);
  }
  if (activeTab === "my-agreements" || activeTab === "record") loadStoredAgreements();
  if (activeTab === "allegations") loadTrustDashboard();
}
let activeTrustProfileId = "";
let trustPeopleSearchTimer;
function mergeTrustClassificationSummaries(positive = {}, negative = {}) {
  return Object.fromEntries(
    Object.entries(positive).map(([key, classification]) => {
      const negativeClassification = negative[key];
      const outcomes = [...(classification.outcomes || []), ...(negativeClassification?.outcomes || [])];
      return [
        key,
        {
          ...classification,
          total: (classification.total || 0) + (negativeClassification?.total || 0),
          outcomes,
        },
      ];
    }),
  );
}
function renderTrustClassificationCards(container, classifications = {}) {
  if (!container) return;
  container.replaceChildren();
  const entries = Object.values(classifications);
  if (!entries.length) {
    addText(container, "p", "trust-score-hint", "No Trust activity has been recorded for this profile yet.");
    return;
  }
  for (const classification of entries) {
    const card = document.createElement("article");
    card.className = "trust-classification-card";
    const header = document.createElement("div");
    header.className = "trust-classification-heading";
    addText(header, "h3", "", classification.label);
    addText(header, "strong", "trust-classification-total", String(classification.total || 0));
    card.append(header);
    const outcomes = document.createElement("ul");
    outcomes.className = "trust-classification-outcomes";
    for (const outcome of classification.outcomes || []) {
      const item = document.createElement("li");
      item.classList.add(outcome.polarity === "positive" ? "is-positive" : "is-allegation");
      addText(
        item,
        "span",
        "trust-classification-outcome-label",
        `${outcome.polarity === "positive" ? "Positive" : "Unverified"} · ${outcome.label}`,
      );
      addText(item, "strong", "", String(outcome.count || 0));
      outcomes.append(item);
    }
    card.append(outcomes);
    container.append(card);
  }
}
function renderTrustRecords(
  container,
  records = [],
  refresh = () => loadTrustDashboard(activeTrustProfileId),
) {
  if (!container) return;
  container.replaceChildren();
  if (!records.length) {
    addText(
      container,
      "p",
      "trust-score-hint",
      "No audience-visible Trust activity is recorded for this profile yet.",
    );
    return;
  }
  for (const allegation of records) {
    const positive = allegation.polarity === "positive";
    const card = document.createElement("article");
    card.className = "trust-allegation-card";
    const header = document.createElement("div");
    header.className = "trust-allegation-heading";
    const status = addText(
      header,
      "span",
      "trust-allegation-status",
      positive ? "Positive recognition · unverified" : "Unverified allegation",
    );
    if (positive) status.classList.add("is-positive");
    addText(header, "time", "", prettyDate(allegation.createdAt));
    card.append(header);
    addText(card, "h3", "", `${allegation.classificationLabel} · ${allegation.outcomeLabel}`);
    addText(card, "p", "", allegation.shortDescription || "No short description.");
    addText(
      card,
      "p",
      "trust-allegation-author",
      `Shared by ${allegation.authorName || "Anonymous NFD member"}`,
    );
    if (!positive) {
      addText(
        card,
        "p",
        "trust-poll-note",
        `Poll: ${allegation.poll?.believePercent || 0}% Believe · ${100 - (allegation.poll?.believePercent || 0)}% Don’t believe · ${allegation.poll?.total || 0} responses. Weighted result: ${allegation.poll?.weightedBelieve || 0} to ${allegation.poll?.weightedNotBelieve || 0}. Voter identities are not shown.`,
      );
    }
    if (allegation.canVote) {
      const actions = document.createElement("div");
      actions.className = "trust-poll-actions";
      for (const [choice, label] of [
        ["believe", "Believe"],
        ["not_believe", "Don’t believe"],
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = choice === "believe" ? "secondary-button" : "secondary-button trust-poll-disagree";
        button.textContent = label;
        button.addEventListener("click", async () => {
          button.disabled = true;
          try {
            const response = await fetch(
              `/api/trust-score/allegations/${encodeURIComponent(allegation.id)}/vote`,
              {
                method: "POST",
                headers: { "content-type": "application/json", accept: "application/json" },
                body: JSON.stringify({ choice }),
              },
            );
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || "Your poll response could not be saved.");
            await refresh();
          } catch (error) {
            addText(
              card,
              "p",
              "trust-score-error",
              error.message || "Your poll response could not be saved.",
            );
          } finally {
            button.disabled = false;
          }
        });
        actions.append(button);
      }
      card.append(actions);
    }
    container.append(card);
  }
}
async function loadTrustDashboard(userId = activeTrustProfileId) {
  if (!trustScorePage || trustScorePage.hidden) return;
  if (trustOverviewClassifications) trustOverviewClassifications.setAttribute("aria-busy", "true");
  try {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const response = await fetch(`/api/trust-score/dashboard${query}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Trust Score could not be loaded.");
    activeTrustProfileId = result.profile?.userId || "";
    if (trustProfileSearch && !userId) trustProfileSearch.value = "";
    renderTrustClassificationCards(
      trustOverviewClassifications,
      mergeTrustClassificationSummaries(
        result.positiveClassifications,
        result.negativeClassifications || result.classifications,
      ),
    );
    renderTrustClassificationCards(
      trustProfileClassifications,
      mergeTrustClassificationSummaries(
        result.positiveClassifications,
        result.negativeClassifications || result.classifications,
      ),
    );
    trustProfileHeading.replaceChildren();
    const identity = document.createElement("div");
    identity.className = "trust-profile-identity";
    addText(
      identity,
      "h3",
      "",
      result.profile?.isSelf ? "Your Trust profile" : result.profile?.name || "NFD member",
    );
    const score = createTrustScorePreview(result.profile?.name || "NFD member", true);
    identity.append(score);
    trustProfileHeading.append(identity);
    addText(
      trustProfileHeading,
      "p",
      "trust-score-hint",
      result.scoreNote || "Unverified reports do not affect the current score.",
    );
    renderTrustRecords(
      trustProfileActivityList,
      [...(result.recognitions || []), ...(result.allegations || [])].sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
      ),
    );
    void loadTrustAdminSummary();
  } catch (error) {
    const message = error.message || "Trust Score could not be loaded right now.";
    if (trustOverviewClassifications)
      trustOverviewClassifications.replaceChildren(
        addText(document.createElement("div"), "p", "trust-score-error", message),
      );
    if (trustProfileActivityList)
      trustProfileActivityList.replaceChildren(
        addText(document.createElement("div"), "p", "trust-score-error", message),
      );
  } finally {
    trustOverviewClassifications?.removeAttribute("aria-busy");
  }
}
async function loadTrustAdminSummary() {
  if (!trustAdminSummary) return;
  const params = new URLSearchParams({ offset: String(trustAdminOffset) });
  if (trustAdminQuery) params.set("q", trustAdminQuery);
  try {
    const response = await fetch(`/api/admin/trust-score/allegations?${params}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (response.status === 403 || response.status === 401) return;
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return;
    const weights = result.rules?.pollWeights || {};
    trustAdminSummary.hidden = false;
    trustAdminSummary.replaceChildren();
    addText(trustAdminSummary, "h3", "", "Administrator Trust activity review");
    addText(
      trustAdminSummary,
      "p",
      "trust-score-hint",
      "Positive recognition and allegations are listed separately by type. Allegations remain unverified; poll voter identities are not displayed.",
    );
    const searchForm = document.createElement("form");
    searchForm.className = "trust-admin-search";
    const searchInput = document.createElement("input");
    searchInput.className = "control";
    searchInput.type = "search";
    searchInput.value = trustAdminQuery;
    searchInput.placeholder = "Search people, categories, outcomes, or post text";
    searchInput.setAttribute("aria-label", "Search Trust activity review");
    const searchButton = document.createElement("button");
    searchButton.className = "secondary-button";
    searchButton.type = "submit";
    searchButton.textContent = "Search";
    searchForm.append(searchInput, searchButton);
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      trustAdminQuery = searchInput.value.trim().slice(0, 100);
      trustAdminOffset = 0;
      void loadTrustAdminSummary();
    });
    trustAdminSummary.append(searchForm);
    for (const allegation of result.allegations || []) {
      const row = document.createElement("article");
      row.className = "trust-admin-poll-row";
      addText(
        row,
        "strong",
        "",
        `${allegation.typeLabel || "Unverified allegation"} · ${allegation.classificationLabel} · ${allegation.outcomeLabel}`,
      );
      addText(
        row,
        "p",
        "",
        `Reported by ${allegation.authorName || "NFD member"} about ${allegation.subjectName || "NFD member"}`,
      );
      addText(row, "p", "", allegation.postSummary || "No short description provided.");
      addText(row, "p", "", `Status: ${allegation.typeLabel || "Unverified allegation"}`);
      if (allegation.polarity === "positive") {
        trustAdminSummary.append(row);
        continue;
      }
      const groups = allegation.votes?.groups || {};
      addText(
        row,
        "p",
        "",
        `Receiver’s friends (${weights.receiverFriend ?? "—"}×): ${groups.receiverFriends?.believe || 0} Believe / ${groups.receiverFriends?.notBelieve || 0} Don’t believe`,
      );
      addText(
        row,
        "p",
        "",
        `Creator’s friends (${weights.creatorFriend ?? "—"}×): ${groups.creatorFriends?.believe || 0} Believe / ${groups.creatorFriends?.notBelieve || 0} Don’t believe`,
      );
      addText(
        row,
        "p",
        "",
        `Other members (${weights.other ?? "—"}×): ${groups.others?.believe || 0} Believe / ${groups.others?.notBelieve || 0} Don’t believe`,
      );
      addText(
        row,
        "p",
        "",
        `Weighted totals: ${allegation.votes?.weighted?.believe || 0} Believe / ${allegation.votes?.weighted?.notBelieve || 0} Don’t believe`,
      );
      trustAdminSummary.append(row);
    }
    const pager = document.createElement("div");
    pager.className = "trust-admin-pagination";
    const start = result.total ? result.offset + 1 : 0;
    const end = result.offset + (result.allegations || []).length;
    addText(pager, "span", "", `${start}–${end} of ${result.total || 0}`);
    const previous = document.createElement("button");
    previous.className = "secondary-button";
    previous.type = "button";
    previous.textContent = "Previous";
    previous.disabled = result.offset <= 0;
    previous.addEventListener("click", () => {
      trustAdminOffset = Math.max(0, result.offset - result.pageSize);
      void loadTrustAdminSummary();
    });
    const next = document.createElement("button");
    next.className = "secondary-button";
    next.type = "button";
    next.textContent = "Next";
    next.disabled = result.nextOffset === null;
    next.addEventListener("click", () => {
      trustAdminOffset = result.nextOffset ?? result.offset;
      void loadTrustAdminSummary();
    });
    pager.append(previous, next);
    trustAdminSummary.append(pager);
  } catch {}
}
async function searchTrustPeople() {
  const query = trustProfileSearch?.value.trim() || "";
  if (!trustProfileSearchResults) return;
  trustProfileSearchResults.replaceChildren();
  if (query.length < 2) {
    trustProfileSearchResults.hidden = true;
    return;
  }
  try {
    const response = await fetch(`/api/trust-score/people?q=${encodeURIComponent(query)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Profiles could not be searched.");
    for (const person of result.people || []) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "trust-profile-search-option";
      option.setAttribute("role", "option");
      option.textContent = person.username ? `${person.name} · @${person.username}` : person.name;
      option.addEventListener("click", () => {
        trustProfileSearch.value = person.name;
        trustProfileSearchResults.hidden = true;
        loadTrustDashboard(person.userId);
      });
      trustProfileSearchResults.append(option);
    }
    if (!result.people?.length)
      addText(trustProfileSearchResults, "p", "trust-score-hint", "No matching NFD profiles.");
    trustProfileSearchResults.hidden = false;
  } catch (error) {
    trustProfileSearchResults.replaceChildren(
      addText(document.createElement("div"), "p", "trust-score-error", error.message),
    );
    trustProfileSearchResults.hidden = false;
  }
}
trustProfileSearch?.addEventListener("input", () => {
  clearTimeout(trustPeopleSearchTimer);
  trustPeopleSearchTimer = setTimeout(searchTrustPeople, 220);
});
document.addEventListener("click", (event) => {
  if (!trustProfileSearchResults?.contains(event.target) && event.target !== trustProfileSearch) {
    trustProfileSearchResults.hidden = true;
  }
});
profileTabs.forEach((button, index) => {
  button.addEventListener("click", () => activateProfileTab(button.dataset.profileTab));
  button.addEventListener("keydown", (event) => {
    if (!event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const next = (index + direction + profileTabs.length) % profileTabs.length;
    profileTabs[next].focus();
    activateProfileTab(profileTabs[next].dataset.profileTab);
  });
});
trustScoreTabs.forEach((button, index) => {
  button.addEventListener("click", () => activateTrustScoreTab(button.dataset.trustTab));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? trustScoreTabs.length - 1
          : (index + (event.key === "ArrowLeft" ? -1 : 1) + trustScoreTabs.length) % trustScoreTabs.length;
    trustScoreTabs[next].focus();
    activateTrustScoreTab(trustScoreTabs[next].dataset.trustTab);
  });
});
async function loadFriendProfile(friendId) {
  friendProfileView.replaceChildren();
  addText(friendProfileView, "p", "profile-loading", "Loading friend profile…");
  try {
    const response = await fetch(`/api/friends/${encodeURIComponent(friendId)}/profile`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "That friend profile could not be loaded.");
    const friend = result.friend || {};
    friendProfileView.replaceChildren();
    const back = addText(friendProfileView, "a", "friend-profile-back", "← Back to friends");
    back.href = "/profile?tab=friends";
    const header = document.createElement("div");
    header.className = "friend-profile-header";
    const avatar = document.createElement("div");
    avatar.className = "profile-avatar";
    const initials =
      (friend.name || "NFD member")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "N";
    avatar.textContent = initials;
    if (friend.photoUrl) {
      const image = document.createElement("img");
      image.alt = "";
      image.src = friend.photoUrl;
      image.onerror = () => image.remove();
      avatar.replaceChildren(image);
    }
    const identity = document.createElement("div");
    identity.className = "friend-profile-identity";
    addText(identity, "h1", "", friend.name || "NFD member");
    addText(
      identity,
      "p",
      "",
      friend.provider === "ghost"
        ? `Ghost profile · @${friend.ghostHandle}`
        : friend.username
          ? `NFD friend · @${friend.username}`
          : "NFD friend",
    );
    if (friend.bio) addText(identity, "p", "friend-profile-bio", friend.bio);
    header.append(avatar, identity);
    const actions = document.createElement("div");
    actions.className = "friend-profile-actions";
    const message = addText(actions, "a", "secondary-button", "Message");
    message.href = `/messages?friend=${encodeURIComponent(friend.userId)}`;
    const remove = addText(actions, "button", "friend-profile-remove", "Remove friend");
    remove.type = "button";
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      feedback.textContent = "Removing friend…";
      try {
        const removal = await fetch(`/api/friends/${encodeURIComponent(friend.relationshipId)}`, {
          method: "DELETE",
          headers: { accept: "application/json" },
        });
        const removed = await removal.json().catch(() => ({}));
        if (!removal.ok) throw new Error(removed.error || "This friend could not be removed.");
        location.assign("/profile?tab=friends&removed=1");
      } catch (error) {
        feedback.textContent = error.message;
        feedback.classList.add("error");
        remove.disabled = false;
      }
    });
    actions.append(message, remove);
    const feedback = addText(friendProfileView, "p", "friend-profile-feedback", "");
    feedback.setAttribute("role", "status");
    header.append(actions);
    friendProfileView.append(back, header, feedback);
    const friendTabList = document.createElement("div");
    friendTabList.className = "profile-tabs friend-profile-tabs";
    friendTabList.setAttribute("role", "tablist");
    friendTabList.setAttribute("aria-label", `${friend.name || "Friend"} profile sections`);
    const postsTab = addText(friendTabList, "button", "profile-tab", "Posts");
    postsTab.type = "button";
    postsTab.id = "friend-profile-tab-posts";
    postsTab.setAttribute("role", "tab");
    postsTab.setAttribute("aria-controls", "friend-profile-panel-posts");
    postsTab.dataset.friendProfileTab = "posts";
    const trustTab = addText(friendTabList, "button", "profile-tab", "Trust Score");
    trustTab.type = "button";
    trustTab.id = "friend-profile-tab-trust";
    trustTab.setAttribute("role", "tab");
    trustTab.setAttribute("aria-controls", "friend-profile-panel-trust");
    trustTab.dataset.friendProfileTab = "trust";
    const postsPanel = document.createElement("section");
    postsPanel.className = "profile-tab-panel friend-profile-tab-panel";
    postsPanel.id = "friend-profile-panel-posts";
    postsPanel.setAttribute("role", "tabpanel");
    postsPanel.setAttribute("aria-labelledby", postsTab.id);
    postsPanel.tabIndex = 0;
    const trustPanel = document.createElement("section");
    trustPanel.className = "profile-tab-panel friend-profile-tab-panel";
    trustPanel.id = "friend-profile-panel-trust";
    trustPanel.setAttribute("role", "tabpanel");
    trustPanel.setAttribute("aria-labelledby", trustTab.id);
    trustPanel.tabIndex = 0;
    const trustSection = document.createElement("section");
    trustSection.className = "friend-trust-dashboard trust-allegation-dashboard";
    trustSection.setAttribute("aria-labelledby", "friend-trust-heading");
    addText(trustSection, "h2", "", "Trust Score").id = "friend-trust-heading";
    addText(
      trustSection,
      "p",
      "trust-score-hint",
      "Audience-visible positive experiences and unverified allegations for this NFD profile.",
    );
    const trustScore = document.createElement("div");
    trustScore.className = "friend-trust-score-meter";
    trustScore.append(createTrustScorePreview(friend.name || "This member", true));
    trustSection.append(trustScore);
    addText(trustSection, "h3", "trust-activity-subheading", "Activity by category");
    const trustClassifications = document.createElement("div");
    trustClassifications.className = "trust-classification-grid";
    trustSection.append(trustClassifications);
    addText(trustSection, "h3", "trust-activity-subheading", "Trust activity");
    const trustRecords = document.createElement("div");
    trustRecords.className = "trust-allegation-list";
    trustSection.append(trustRecords);
    trustPanel.append(trustSection);
    const postsHeading = addText(
      friendProfileView,
      "h2",
      "friend-profile-posts-heading",
      "Posts shared with you",
    );
    addText(
      friendProfileView,
      "p",
      "friend-profile-posts-note",
      "Public and friends-only feed posts appear here. Anonymous posts stay anonymous.",
    );
    const posts = document.createElement("div");
    posts.className = "profile-post-list";
    const friendPosts = result.posts || [];
    if (!friendPosts.length) {
      addText(posts, "p", "profile-empty", "No feed posts have been shared with you yet.");
    } else {
      friendPosts.forEach((post) => {
        const card = document.createElement("article");
        card.className = "profile-post-card friend-profile-post";
        const top = document.createElement("div");
        top.className = "profile-post-top";
        const titleGroup = document.createElement("div");
        addText(titleGroup, "h3", "profile-post-title", post.text || post.category || "NFD post");
        addText(
          titleGroup,
          "span",
          "profile-post-category",
          [post.category, post.incident].filter(Boolean).join(" · "),
        );
        top.append(
          titleGroup,
          addText(top, "time", "profile-post-date", `Shared ${prettyDate(post.createdAt)}`),
        );
        card.append(top);
        const meta = document.createElement("div");
        meta.className = "profile-post-meta";
        const place = document.createElement("span");
        const placeSummary = [post.place, post.placeCategory].filter(Boolean).join(" · ");
        place.innerHTML = "<strong>Where</strong> ";
        place.append(document.createTextNode(placeSummary || "Not provided"));
        meta.append(place);
        if (post.locationDetails) {
          const area = document.createElement("span");
          area.innerHTML = "<strong>Area</strong> ";
          area.append(document.createTextNode(post.locationDetails));
          meta.append(area);
        }
        const when = document.createElement("span");
        when.innerHTML = "<strong>When</strong> ";
        when.append(
          document.createTextNode(
            experienceTimeText({
              incidentTime: post.incidentTime,
              incidentTimeEnd: post.incidentTimeEnd,
              incidentTimeZone: post.incidentTimeZone,
            }),
          ),
        );
        meta.append(when);
        card.append(meta);
        const full = document.createElement("details");
        full.className = "profile-post-full";
        addText(full, "summary", "", "Read the full story");
        addText(full, "p", "", post.fullText || "No additional details were provided.");
        card.append(full);
        if (post.evidence?.length) {
          const files = document.createElement("div");
          files.className = "profile-post-evidence";
          post.evidence.forEach((file) => {
            const link = document.createElement("a");
            link.href = `/api/evidence/${encodeURIComponent(file.id)}`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            const label = file.contentType?.startsWith("video/")
              ? "Play video"
              : file.contentType?.startsWith("image/")
                ? "View photo"
                : "Open document";
            link.textContent = `${label} · ${file.originalFilename}`;
            files.append(link);
          });
          card.append(files);
        }
        posts.append(card);
      });
    }
    postsPanel.append(postsHeading, posts);
    friendProfileView.append(friendTabList, postsPanel, trustPanel);
    const updateFriendTab = (activeTab, updateUrl = false) => {
      const selectedTab = activeTab === "trust" ? "trust" : "posts";
      for (const button of [postsTab, trustTab]) {
        const selected = button.dataset.friendProfileTab === selectedTab;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      }
      postsPanel.hidden = selectedTab !== "posts";
      trustPanel.hidden = selectedTab !== "trust";
      if (updateUrl) {
        const nextUrl = new URL(location.href);
        if (selectedTab === "trust") nextUrl.searchParams.set("friend_tab", "trust");
        else nextUrl.searchParams.delete("friend_tab");
        history.replaceState(null, "", nextUrl);
      }
      if (selectedTab === "trust" && trustPanel.dataset.loaded !== "true") {
        trustPanel.dataset.loaded = "true";
        void loadFriendTrustDashboard(
          friend.userId,
          friend.name || "This member",
          trustScore,
          trustClassifications,
          trustRecords,
        );
      }
    };
    for (const button of [postsTab, trustTab]) {
      button.addEventListener("click", () => updateFriendTab(button.dataset.friendProfileTab, true));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const nextTab = button === postsTab ? trustTab : postsTab;
        nextTab.focus();
        updateFriendTab(nextTab.dataset.friendProfileTab, true);
      });
    }
    updateFriendTab(new URLSearchParams(location.search).get("friend_tab"));
    document.title = `${friend.name || "Friend"} — NFD`;
  } catch (error) {
    friendProfileView.replaceChildren();
    const back = addText(friendProfileView, "a", "friend-profile-back", "← Back to friends");
    back.href = "/profile?tab=friends";
    const message = addText(friendProfileView, "p", "profile-error", error.message);
    message.setAttribute("role", "alert");
  }
}

async function loadFriendTrustDashboard(
  userId,
  name,
  scoreContainer,
  classificationsContainer,
  recordsContainer,
) {
  try {
    const response = await fetch(`/api/trust-score/dashboard?userId=${encodeURIComponent(userId)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This Trust Score could not be loaded.");
    scoreContainer.replaceChildren(createTrustScorePreview(name, true, result.profile?.score));
    renderTrustClassificationCards(
      classificationsContainer,
      mergeTrustClassificationSummaries(
        result.positiveClassifications,
        result.negativeClassifications || result.classifications,
      ),
    );
    renderTrustRecords(
      recordsContainer,
      [...(result.recognitions || []), ...(result.allegations || [])].sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
      ),
      () =>
        loadFriendTrustDashboard(userId, name, scoreContainer, classificationsContainer, recordsContainer),
    );
  } catch (error) {
    scoreContainer.replaceChildren();
    classificationsContainer.replaceChildren();
    recordsContainer.replaceChildren(
      addText(
        document.createElement("div"),
        "p",
        "trust-score-error",
        error.message || "This Trust Score could not be loaded.",
      ),
    );
  }
}

function createTrustScorePreview(profileName, compact = false, scoreValue = 40) {
  const scoreNumber = Math.max(1, Math.min(100, Number(scoreValue) || 40));
  const section = document.createElement("section");
  section.className = `profile-trust-score${compact ? " profile-trust-score-compact" : ""}`;
  section.setAttribute("aria-label", `${profileName}’s Trust Score`);
  const value = document.createElement("span");
  value.className = "profile-trust-score-value";
  addText(value, "strong", "", String(scoreNumber));
  addText(value, "span", "", "/100");
  value.setAttribute("aria-label", `${scoreNumber} out of 100`);
  const heading = document.createElement("div");
  heading.className = "profile-trust-score-heading";
  addText(heading, "strong", "profile-trust-score-label", "Trust score");
  heading.append(value);
  const track = document.createElement("div");
  track.className = "profile-trust-score-track";
  track.setAttribute("role", "meter");
  track.setAttribute("aria-label", `${profileName}’s Trust Score`);
  track.setAttribute("aria-valuemin", "1");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-valuenow", String(scoreNumber));
  const fill = document.createElement("span");
  fill.className = "profile-trust-score-fill";
  fill.style.width = "0%";
  track.append(fill);
  requestAnimationFrame(() => {
    fill.style.width = `${scoreNumber}%`;
  });
  const scale = document.createElement("div");
  scale.className = "profile-trust-score-scale";
  scale.setAttribute("aria-hidden", "true");
  addText(scale, "span", "", "1");
  if (compact) {
    const current = addText(scale, "span", "profile-trust-score-current", "");
    current.append(document.createTextNode("Trust score "));
    const compactValue = document.createElement("strong");
    compactValue.textContent = `${scoreNumber}/100`;
    current.append(compactValue);
  }
  addText(scale, "span", "", "100");
  if (!compact) addText(section, "p", "profile-trust-score-note", "Starting score");
  if (compact) section.append(track, scale);
  else section.append(heading, track, scale);
  return section;
}
function setFriendsFeedback(message, error = false) {
  friendsFeedback.textContent = message;
  friendsFeedback.classList.toggle("error", error);
}
function renderFriendList(listId, emptyId, entries, kind) {
  const list = document.getElementById(listId);
  const empty = document.getElementById(emptyId);
  list.replaceChildren();
  empty.hidden = entries.length > 0;
  entries.forEach((friend) => {
    const item = document.createElement("li");
    item.className = "friend-item";
    const person = document.createElement(kind === "friends" ? "a" : "div");
    person.className = `friend-person friend-person-with-avatar${kind === "friends" ? " friend-profile-link" : ""}`;
    if (kind === "friends") person.href = `/profile?friend=${encodeURIComponent(friend.userId)}`;
    const avatar = document.createElement("span");
    avatar.className = "friend-avatar";
    const initials =
      (friend.name || "NFD member")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "N";
    avatar.textContent = initials;
    if (friend.photoUrl) {
      avatar.textContent = "";
      const image = document.createElement("img");
      image.alt = "";
      image.src = friend.photoUrl;
      image.onerror = () => {
        avatar.textContent = initials;
      };
      avatar.append(image);
    }
    person.append(avatar);
    addText(person, "strong", "", friend.name || "NFD member");
    item.append(person);
    const actions = document.createElement("div");
    actions.className = "friend-actions";
    if (kind === "friends") {
      const message = document.createElement("a");
      message.className = "friend-action message-friend";
      message.href = `/messages?friend=${encodeURIComponent(friend.userId)}`;
      message.textContent = "Message";
      message.setAttribute("aria-label", `Message ${friend.name || "friend"}`);
      actions.append(message);
    }
    const addAction = (label, action, method, style = "") => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `friend-action ${style}`.trim();
      button.textContent = label;
      button.addEventListener("click", async () => {
        button.disabled = true;
        setFriendsFeedback(
          action === "accept"
            ? "Accepting request…"
            : action === "remove"
              ? "Updating friends…"
              : "Removing request…",
        );
        try {
          const response = await fetch(
            `/api/friends/${encodeURIComponent(friend.id)}${action === "accept" ? "/accept" : ""}`,
            { method, headers: { accept: "application/json" } },
          );
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "Your friend list could not be updated.");
          setFriendsFeedback(
            action === "accept"
              ? "You’re connected on NFD."
              : action === "remove"
                ? "Connection removed."
                : "Request removed.",
          );
          await loadFriends();
        } catch (error) {
          button.disabled = false;
          setFriendsFeedback(error.message, true);
        }
      });
      actions.append(button);
    };
    if (kind === "incoming") addAction("Accept", "accept", "POST");
    if (kind !== "friends") {
      addAction(kind === "outgoing" ? "Cancel" : "Ignore", "ignore", "DELETE", "remove");
    }
    item.append(actions);
    list.append(item);
  });
}
async function loadFriends() {
  try {
    const response = await fetch("/api/friends", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your NFD friends could not be loaded.");
    renderFriendList("friend-list", "friend-empty", result.friends || [], "friends");
    renderFriendList("friend-incoming-list", "friend-incoming-empty", result.incoming || [], "incoming");
    renderFriendList("friend-outgoing-list", "friend-outgoing-empty", result.outgoing || [], "outgoing");
  } catch (error) {
    setFriendsFeedback(error.message, true);
  }
}
let friendSearchTimer;
let friendSearchRequest = 0;
async function loadFriendSuggestions() {
  const query = friendSearchInput.value.trim();
  const requestNumber = ++friendSearchRequest;
  friendSuggestions.replaceChildren();
  if (query.length < 2) {
    friendSuggestions.hidden = true;
    friendSearchFeedback.textContent = "Type at least 2 letters to see NFD member suggestions.";
    friendSearchFeedback.classList.remove("error");
    return;
  }
  friendSuggestions.hidden = false;
  friendSearchFeedback.textContent = "Looking for matching NFD names…";
  friendSearchFeedback.classList.remove("error");
  try {
    const response = await fetch(`/api/friends/suggestions?q=${encodeURIComponent(query)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (requestNumber !== friendSearchRequest) return;
    if (!response.ok) throw new Error(result.error || "Friend suggestions could not be loaded.");
    const suggestions = result.suggestions || [];
    if (!suggestions.length) {
      friendSuggestions.hidden = true;
      friendSearchFeedback.textContent =
        "No matching NFD members found. Try a different spelling or Ghost ID.";
      return;
    }
    friendSearchFeedback.textContent = `${suggestions.length} matching ${suggestions.length === 1 ? "member" : "members"} found.`;
    suggestions.forEach((suggestion) => {
      const item = document.createElement("li");
      item.className = "friend-item friend-suggestion-item";
      const person = document.createElement("div");
      person.className = "friend-person";
      addText(person, "strong", "", suggestion.name);
      addText(person, "span", "", suggestion.handle ? `Ghost profile · @${suggestion.handle}` : "NFD member");
      item.append(person);
      const connect = document.createElement("button");
      connect.type = "button";
      connect.className = "friend-action friend-suggestion-connect";
      connect.textContent = "Connect";
      connect.setAttribute("aria-label", `Send a friend request to ${suggestion.name}`);
      connect.addEventListener("click", async () => {
        connect.disabled = true;
        connect.textContent = "Sending…";
        friendSearchFeedback.textContent = "Sending friend request…";
        try {
          const send = await fetch("/api/friends", {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({ userId: suggestion.id }),
          });
          const sent = await send.json().catch(() => ({}));
          if (!send.ok) throw new Error(sent.error || "The friend request could not be sent.");
          friendSearchInput.value = "";
          friendSuggestions.replaceChildren();
          friendSuggestions.hidden = true;
          friendSearchFeedback.textContent =
            sent.message || "Friend request sent. They’ll see it in their NFD profile.";
          await loadFriends();
        } catch (error) {
          connect.disabled = false;
          connect.textContent = "Connect";
          friendSearchFeedback.textContent = error.message;
          friendSearchFeedback.classList.add("error");
        }
      });
      item.append(connect);
      friendSuggestions.append(item);
    });
  } catch (error) {
    if (requestNumber !== friendSearchRequest) return;
    friendSuggestions.hidden = true;
    friendSearchFeedback.textContent = error.message;
    friendSearchFeedback.classList.add("error");
  }
}
friendSearchInput.addEventListener("input", () => {
  clearTimeout(friendSearchTimer);
  friendSearchTimer = setTimeout(loadFriendSuggestions, 220);
});
function setMessageFeedback(message, error = false) {
  messageFeedback.textContent = message;
  messageFeedback.classList.toggle("error", error);
}
async function refreshMessageNavBadge() {
  if (messageNavRefreshInFlight || location.pathname === "/login") return;
  messageNavRefreshInFlight = true;
  try {
    const response = await fetch("/api/notifications?summary=1", {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return;
    const result = await response.json();
    const unread = Number(result.unreadCount) || 0;
    navUnreadCount.hidden = unread === 0;
    navUnreadCount.textContent = unread > 99 ? "99+" : String(unread);
    document.getElementById("account-notifications-label").textContent = unread
      ? `(${unread > 99 ? "99+" : unread})`
      : "";
    accountMenuButton.setAttribute(
      "aria-label",
      unread
        ? `Open your account menu, ${unread > 99 ? "99+" : unread} unread notifications`
        : "Open your account menu",
    );
    messagesNavLink.setAttribute("aria-label", "Messages");
  } catch {
    // Keep the last known count if a background refresh temporarily fails.
  } finally {
    messageNavRefreshInFlight = false;
  }
}
