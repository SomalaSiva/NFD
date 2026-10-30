const picker = document.getElementById("evidence-files");
const list = document.getElementById("file-list");
const zone = document.getElementById("upload-zone");
const shortDescription = document.getElementById("short-description");
const fullDescription = document.getElementById("full-description");
const experienceCategoryInput = document.getElementById("experience-category");
const incidentCategoryInput = document.getElementById("incident-category");
const incidentCategoryHelper = document.getElementById("incident-category-helper");
const incidentCategoriesByExperience = {
  "Personal relationships": [
    "Trust broken or deception",
    "Heartbreak or relationship change",
    "Conflict or boundary issue",
    "Scam or financial harm",
    "Kindness or support",
    "Trust kept or connection strengthened",
    "Joyful or positive moment",
    "Other or not sure",
  ],
  "Work and school": [
    "Bullying, harassment, or aggression",
    "Unfair treatment or retaliation",
    "Trust broken or deception",
    "Conflict or boundary issue",
    "Support, appreciation, or teamwork",
    "Promise kept or trust strengthened",
    "Positive work or school experience",
    "Other or not sure",
  ],
  "Community and social life": [
    "Conflict, harassment, or safety concern",
    "Trust broken or deception",
    "Scam or financial harm",
    "Kindness or help",
    "Belonging or community support",
    "Positive event or gathering",
    "Other or not sure",
  ],
  "Business, products, and services": [
    "Scam or misleading conduct",
    "Billing or payment issue",
    "Product or service problem",
    "Delivery, refund, or cancellation issue",
    "Helpful service or fair resolution",
    "Great product or service",
    "Other or not sure",
  ],
  "Online and digital life": [
    "Scam, fraud, or impersonation",
    "Harassment or unwanted contact",
    "Privacy or account misuse",
    "Deception or broken trust",
    "Supportive or respectful interaction",
    "Positive online experience",
    "Other or not sure",
  ],
  "Public places and travel": [
    "Safety issue or unwanted aggression",
    "Scam or overcharge",
    "Service, travel, or access issue",
    "Helpful person or support",
    "Trustworthy or welcoming service",
    "Positive outing or experience",
    "Other or not sure",
  ],
  "Other or not sure": [
    "Trust broken or deception",
    "Scam or financial harm",
    "Harassment, aggression, or safety issue",
    "Conflict or boundary issue",
    "Kindness or support",
    "Trust kept or promise fulfilled",
    "Positive or joyful experience",
    "Other or not sure",
  ],
};
const form = document.getElementById("experience-form");
const reviewPage = document.getElementById("review-page");
const reviewFiles = document.getElementById("review-files");
const reviewNotice = document.getElementById("review-notice");
const aiReviewConsent = document.getElementById("ai-review-consent");
const aiReviewConsentCheckbox = document.getElementById("ai-review-consent-checkbox");
const feedPage = document.getElementById("feed-page");
const feedList = document.getElementById("feed-list");
const feedState = document.getElementById("feed-state");
const feedPlaceSearch = document.getElementById("feed-place-search");
const feedLocationSearch = document.getElementById("feed-location-search");
const feedExperienceCategory = document.getElementById("feed-experience-category");
const feedIncidentCategory = document.getElementById("feed-incident-category");
const feedPlaceCategory = document.getElementById("feed-place-category");
const feedFilters = document.getElementById("feed-filters");
const feedFilterToggle = document.getElementById("toggle-feed-filters");
const feedFilterCount = document.getElementById("feed-filter-count");
const feedPlaceSuggestions = document.getElementById("feed-place-suggestions");
const feedLocationSuggestions = document.getElementById("feed-location-suggestions");
const feedResultCount = document.getElementById("feed-result-count");
const feedLoadMore = document.getElementById("feed-load-more");
const feedBanner = document.getElementById("feed-shared-banner");
const appLayout = document.getElementById("app-layout");
const loginPage = document.getElementById("login-page");
const adminPage = document.getElementById("admin-page");
const mainNav = document.getElementById("main-nav");
const mainNavRow = document.getElementById("main-nav-row");
const accountMenuWrap = document.getElementById("account-menu-wrap");
const adminNavLink = document.getElementById("admin-nav-link");
const accountAdminLink = document.getElementById("account-admin-link");
const ghostModeSetupLink = document.getElementById("ghost-mode-setup");
const ghostModeToggle = document.getElementById("ghost-mode-toggle");
const ghostModeBanner = document.getElementById("ghost-mode-banner");
const ghostModeHandle = document.getElementById("ghost-mode-handle");
const ghostModeExit = document.getElementById("ghost-mode-exit");
const messagesNavLink = document.getElementById("messages-nav-link");
const navUnreadCount = document.getElementById("nav-unread-count");
const trustScorePendingCount = document.getElementById("trust-score-pending-count");
const trustScorePage = document.getElementById("trust-score-page");
function setMainNavigationVisible(visible) {
  mainNav.hidden = !visible;
  mainNavRow.hidden = !visible;
  accountMenuWrap.hidden = !visible;
}
let messageNavRefreshTimer;
const SESSION_IDLE_LIMIT_MS = 4 * 60 * 1000;
const SESSION_ACTIVITY_STORAGE_KEY = "nfd:last-active-at";
let inactivityLogoutTimer;
let lastSessionActivityAt = 0;
let lastSessionActivitySavedAt = 0;
let sessionActivityTrackingStarted = false;
function readSharedSessionActivity() {
  try {
    const value = Number(localStorage.getItem(SESSION_ACTIVITY_STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}
function scheduleInactivityLogout() {
  clearTimeout(inactivityLogoutTimer);
  const lastActivityAt = Math.max(lastSessionActivityAt, readSharedSessionActivity());
  lastSessionActivityAt = lastActivityAt;
  const remaining = SESSION_IDLE_LIMIT_MS - (Date.now() - lastActivityAt);
  if (remaining <= 0) {
    if (Date.now() - Math.max(lastSessionActivityAt, readSharedSessionActivity()) >= SESSION_IDLE_LIMIT_MS)
      location.replace("/auth/signout?idle=1&return_to=%2Flogin%3Fidle%3D1");
    else scheduleInactivityLogout();
    return;
  }
  inactivityLogoutTimer = setTimeout(scheduleInactivityLogout, remaining + 25);
}
function markSessionActivity() {
  const now = Date.now();
  lastSessionActivityAt = now;
  if (now - lastSessionActivitySavedAt >= 5000) {
    lastSessionActivitySavedAt = now;
    try {
      localStorage.setItem(SESSION_ACTIVITY_STORAGE_KEY, String(now));
    } catch {
      // In-memory activity tracking still works when browser storage is unavailable.
    }
  }
  scheduleInactivityLogout();
}
function startSessionActivityTracking() {
  if (sessionActivityTrackingStarted || location.pathname === "/login") return;
  sessionActivityTrackingStarted = true;
  markSessionActivity();
  ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"].forEach((eventName) =>
    document.addEventListener(eventName, markSessionActivity, { passive: true }),
  );
  window.addEventListener("storage", (event) => {
    if (event.key !== SESSION_ACTIVITY_STORAGE_KEY) return;
    const sharedActivity = Number(event.newValue);
    if (Number.isFinite(sharedActivity) && sharedActivity > lastSessionActivityAt) {
      lastSessionActivityAt = sharedActivity;
      scheduleInactivityLogout();
    }
  });
}
const accountMenuButton = document.getElementById("account-menu-button");
const accountMenu = document.getElementById("account-menu");
function closeAccountMenu() {
  accountMenu.hidden = true;
  accountMenuButton.setAttribute("aria-expanded", "false");
}
accountMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const open = accountMenuButton.getAttribute("aria-expanded") !== "true";
  accountMenu.hidden = !open;
  accountMenuButton.setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (event) => {
  if (!accountMenu.contains(event.target) && !accountMenuButton.contains(event.target)) closeAccountMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAccountMenu();
    accountMenuButton.focus();
  }
});
const profilePage = document.getElementById("profile-page");
const ghostSettings = document.getElementById("ghost-settings");
const ghostSettingsFeedback = document.getElementById("ghost-settings-feedback");
const ghostCreateForm = document.getElementById("ghost-create-form");
const ghostProfileReady = document.getElementById("ghost-profile-ready");
const ghostProfileName = document.getElementById("ghost-profile-name");
const ghostProfileHandle = document.getElementById("ghost-profile-handle");
const ghostProfileState = document.getElementById("ghost-profile-state");
const ghostProfileToggle = document.getElementById("ghost-profile-toggle");
const ghostProfileDeactivate = document.getElementById("ghost-profile-deactivate");
const messagesPage = document.getElementById("messages-page");
const messageThreadList = document.getElementById("message-thread-list");
const messageInboxStatus = document.getElementById("message-inbox-status");
const messageInboxEmpty = document.getElementById("message-inbox-empty");
const messageThreadEmpty = document.getElementById("message-thread-empty");
const messageThreadHeader = document.getElementById("message-thread-header");
const messageFriendName = document.getElementById("message-friend-name");
const messageList = document.getElementById("message-list");
const messageCompose = document.getElementById("message-compose");
const messageInput = document.getElementById("message-input");
const messageSend = document.getElementById("message-send");
const messageFeedback = document.getElementById("message-feedback");
let currentUserId = "";
let currentGhostMode = { allowed: false, active: false, profile: null };
let currentMessageFriendId = "";
let messageRefreshTimer;
let messageRefreshInFlight = false;
let messageSeenPending = new Set();
const profileSummary = document.getElementById("profile-summary");
const profilePostCount = document.getElementById("profile-post-count");
const profilePostList = document.getElementById("profile-post-list");
const profileMessage = document.getElementById("profile-message");
const friendRequestForm = document.getElementById("friend-request-form");
const friendsFeedback = document.getElementById("friends-feedback");
const friendSearchInput = document.getElementById("friend-search-query");
const friendSuggestions = document.getElementById("friend-suggestions");
const friendSearchFeedback = document.getElementById("friend-search-feedback");
const audienceNote = document.getElementById("audience-note");
const experienceStep = document.getElementById("step-experience");
const reviewStep = document.getElementById("step-review");
let selectedFiles = [];
const filePreviewUrls = new Map();
function getFilePreviewUrl(file) {
  if (!filePreviewUrls.has(file)) filePreviewUrls.set(file, URL.createObjectURL(file));
  return filePreviewUrls.get(file);
}
const prettySize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const iconForFile = () =>
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3.8h7l4 4V20H7a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.6"/><path d="M14 4v4h4M8.5 12h7M8.5 15.5h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
function renderFiles() {
  list.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "file-item";
    const thumb = document.createElement("div");
    thumb.className = "file-thumb";
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = getFilePreviewUrl(file);
      img.alt = "";
      thumb.append(img);
    } else thumb.innerHTML = iconForFile();
    const meta = document.createElement("div");
    meta.className = "file-meta";
    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = file.name;
    const size = document.createElement("div");
    size.className = "file-size";
    size.textContent = prettySize(file.size);
    meta.append(name, size);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-file";
    remove.setAttribute("aria-label", `Remove ${file.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      const previewUrl = filePreviewUrls.get(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      filePreviewUrls.delete(file);
      renderFiles();
    });
    item.append(thumb, meta, remove);
    list.append(item);
  });
}
function addFiles(files) {
  const allowed = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/avif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  const valid = [...files].filter((file) => {
    if (!allowed.has(file.type)) {
      alert(`${file.name} is not a supported photo, video, or document.`);
      return false;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert(`${file.name} is larger than 25 MB.`);
      return false;
    }
    return true;
  });
  if (selectedFiles.length + valid.length > 5) {
    alert("Attach no more than five files.");
    picker.value = "";
    return;
  }
  if ([...selectedFiles, ...valid].reduce((total, file) => total + file.size, 0) > 50 * 1024 * 1024) {
    alert("Attachments must total 50 MB or less.");
    picker.value = "";
    return;
  }
  selectedFiles = [...selectedFiles, ...valid];
  renderFiles();
  picker.value = "";
}
picker.addEventListener("change", (event) => addFiles(event.target.files));
["dragenter", "dragover"].forEach((type) =>
  zone.addEventListener(type, (event) => {
    event.preventDefault();
    zone.classList.add("drag");
  }),
);
["dragleave", "drop"].forEach((type) =>
  zone.addEventListener(type, (event) => {
    event.preventDefault();
    zone.classList.remove("drag");
  }),
);
zone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));
shortDescription.addEventListener(
  "input",
  () => (document.getElementById("short-char-count").textContent = shortDescription.value.length),
);
fullDescription.addEventListener(
  "input",
  () => (document.getElementById("full-char-count").textContent = fullDescription.value.length),
);
const incidentTimeRangeToggle = document.getElementById("incident-time-range-toggle");
const incidentTimeEndField = document.getElementById("incident-time-end-field");
const incidentTimeEndInput = document.getElementById("incident-time-end");
incidentTimeRangeToggle.addEventListener("change", () => {
  incidentTimeEndField.hidden = !incidentTimeRangeToggle.checked;
  incidentTimeEndInput.required = incidentTimeRangeToggle.checked;
  document.getElementById("incident-time-label").innerHTML = incidentTimeRangeToggle.checked
    ? 'When did it start? <span class="required">*</span>'
    : 'When did it happen? <span class="required">*</span>';
  if (!incidentTimeRangeToggle.checked) incidentTimeEndInput.value = "";
});
function showReview() {
  const value = (id) => document.getElementById(id).value.trim();
  const selected = (id) => document.getElementById(id).selectedOptions[0]?.textContent || "Not provided";
  document.getElementById("review-experience-category").textContent = selected("experience-category");
  document.getElementById("review-incident-category").textContent = selected("incident-category");
  document.getElementById("review-place").textContent = value("place");
  document.getElementById("review-place-category").textContent = selected("place-category");
  const when = value("incident-time");
  const end = value("incident-time-end");
  const formatDate = (part) => {
    const parsed = part ? new Date(part) : null;
    return parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : "";
  };
  const startLabel = formatDate(when);
  document.getElementById("review-time").textContent = startLabel
    ? incidentTimeRangeToggle.checked
      ? `${startLabel} – ${formatDate(end)}`
      : startLabel
    : "Not provided";
  document.getElementById("review-location-detail").textContent = value("location-detail") || "Not provided";
  document.getElementById("review-short-description").textContent = shortDescription.value.trim();
  document.getElementById("review-full-description").textContent = fullDescription.value.trim();
  const audience = document.querySelector('input[name="visibility"]:checked')?.value || "public";
  document.getElementById("review-audience").textContent = {
    public: "Public in NFD · your name is shown",
    friends: "Friends only · visible to accepted NFD friends",
    anonymous: "Anonymous · your name and profile are hidden",
  }[audience];
  document.getElementById("review-file-count").textContent = selectedFiles.length
    ? `${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"} attached`
    : "No files attached";
  reviewFiles.innerHTML = "";
  if (!selectedFiles.length) {
    const empty = document.createElement("p");
    empty.className = "review-empty";
    empty.textContent = "You can add photos or documents by going back to edit.";
    reviewFiles.append(empty);
  }
  selectedFiles.forEach((file) => {
    const item = document.createElement("div");
    item.className = "file-item";
    const thumb = document.createElement("div");
    thumb.className = "file-thumb";
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = getFilePreviewUrl(file);
      img.alt = "";
      thumb.append(img);
    } else thumb.innerHTML = iconForFile();
    const meta = document.createElement("div");
    meta.className = "file-meta";
    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = file.name;
    const size = document.createElement("div");
    size.className = "file-size";
    size.textContent = prettySize(file.size);
    meta.append(name, size);
    item.append(thumb, meta);
    reviewFiles.append(item);
  });
  form.hidden = true;
  reviewPage.hidden = false;
  experienceStep.classList.remove("active");
  experienceStep.classList.add("done");
  reviewStep.classList.add("active");
  reviewNotice.classList.remove("show", "error");
  reviewNotice.replaceChildren();
  aiReviewConsentCheckbox.checked = false;
  void loadReviewModerationStatus();
  document.getElementById("edit-experience").disabled = false;
  document.getElementById("confirm-review").disabled = false;
  document.getElementById("confirm-review").innerHTML =
    'Looks right — share <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function updateIncidentCategoryOptions() {
  const options = incidentCategoriesByExperience[experienceCategoryInput.value] || [];
  incidentCategoryInput.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = options.length ? "Choose an incident" : "Choose an experience type first";
  incidentCategoryInput.append(placeholder);
  options.forEach((label) => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    incidentCategoryInput.append(option);
  });
  incidentCategoryInput.disabled = !options.length;
  incidentCategoryHelper.textContent = options.length
    ? `${options.length - 1} matching options, plus “Other or not sure.”`
    : "Options will match the experience category you choose.";
}
function backToEdit() {
  reviewPage.hidden = true;
  form.hidden = false;
  reviewStep.classList.remove("active");
  experienceStep.classList.remove("done");
  experienceStep.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function prettyDate(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  try {
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      ...(timeZone ? { timeZone } : {}),
    });
  } catch {
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
}
async function createFeedPreview(file) {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.size < 300 * 1024 ||
    typeof createImageBitmap !== "function"
  )
    return null;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const preview = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
    return preview?.type === "image/webp" && preview.size < file.size && preview.size <= 1024 * 1024
      ? preview
      : null;
  } catch {
    return null;
  } finally {
    bitmap?.close?.();
  }
}
function addText(parent, tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value || "";
  parent.append(element);
  return element;
}
function renderDocumentLink(file) {
  const link = document.createElement("a");
  link.className = "feed-file-link";
  link.href = `/api/evidence/${encodeURIComponent(file.id)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  addText(link, "span", "feed-file-icon", "▤");
  addText(link, "span", "", `${file.originalFilename} · ${prettySize(file.sizeBytes)}`);
  return link;
}
const videoLoader =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const video = entry.target;
              video.src = video.dataset.src;
              delete video.dataset.src;
              videoLoader.unobserve(video);
            }
          }),
        { rootMargin: "320px 0px" },
      )
    : null;
let feedLoadedCount = 0;
let feedNextCursor = "";
function renderFeed(experiences, total, { append = false, nextCursor = "" } = {}) {
  if (!append) {
    feedList.replaceChildren();
    feedLoadedCount = 0;
  }
  feedState.hidden = true;
  feedNextCursor = nextCursor || "";
  const placeQuery = feedPlaceSearch.value.trim();
  const locationQuery = feedLocationSearch.value.trim();
  const filterActive = Boolean(
    placeQuery ||
    locationQuery ||
    feedExperienceCategory.value ||
    feedIncidentCategory.value ||
    feedPlaceCategory.value,
  );
  const countLabel = filterActive
    ? `${total} matching stor${total === 1 ? "y" : "ies"}`
    : `${total} stor${total === 1 ? "y" : "ies"} in the feed`;
  feedResultCount.textContent = `${countLabel}${total > 0 ? ` · Showing ${Math.min(total, feedLoadedCount + experiences.length)} of ${total}` : ""}`;
  if (!experiences.length) {
    if (append) {
      feedLoadMore.hidden = true;
      return;
    }
    const empty = document.createElement("div");
    empty.className = "feed-empty";
    addText(empty, "strong", "", filterActive ? "No stories found here" : "No stories here yet");
    addText(
      empty,
      "p",
      "",
      filterActive
        ? "Try a shorter name or a wider area. Our search is clever, not psychic."
        : "Be the first to add a story. We promise not to make you write a novel.",
    );
    if (filterActive) {
      const clear = document.createElement("button");
      clear.className = "secondary-button";
      clear.type = "button";
      clear.textContent = "Clear search";
      clear.addEventListener("click", clearFeedFilters);
      empty.append(clear);
    } else {
      const link = document.createElement("a");
      link.className = "submit";
      link.href = "/share";
      const icon = document.createElement("img");
      icon.src = "/nfd-icon.png";
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = "Drop your story";
      link.append(icon, label);
      empty.append(link);
    }
    feedList.append(empty);
    feedLoadMore.hidden = true;
    return;
  }
  experiences.forEach((experience) => {
    const card = document.createElement("article");
    card.className = "feed-card";
    const main = document.createElement("div");
    main.className = "feed-card-main";
    const header = document.createElement("div");
    header.className = "feed-card-head";
    const titleGroup = document.createElement("div");
    titleGroup.className = "feed-title-group";
    addText(titleGroup, "h2", "feed-category", experience.shortDescription || experience.experienceCategory);
    addText(titleGroup, "span", "feed-experience-type", experience.experienceCategory);
    header.append(titleGroup);
    addText(header, "span", "feed-incident", experience.incidentCategory);
    main.append(header);
    const author = document.createElement("div");
    author.className = `feed-author${experience.visibility === "anonymous" ? " anonymous" : ""}`;
    const authorIcon = addText(
      author,
      "span",
      "feed-author-icon",
      experience.visibility === "anonymous"
        ? "?"
        : (experience.authorName || "N").trim().slice(0, 1).toUpperCase(),
    );
    authorIcon.setAttribute("aria-hidden", "true");
    addText(
      author,
      "span",
      "",
      experience.visibility === "anonymous"
        ? "Shared anonymously"
        : `Shared by ${experience.authorName || "NFD member"}`,
    );
    main.append(author);
    const meta = document.createElement("div");
    meta.className = "feed-meta";
    const place = document.createElement("span");
    place.innerHTML = "<strong>Where</strong> ";
    place.append(document.createTextNode(`${experience.place} · ${experience.placeCategory}`));
    meta.append(place);
    if (experience.locationDetails) {
      const area = document.createElement("span");
      area.innerHTML = "<strong>Area</strong> ";
      area.append(document.createTextNode(experience.locationDetails));
      meta.append(area);
    }
    const occurred = document.createElement("span");
    occurred.innerHTML = "<strong>When</strong> ";
    occurred.append(
      document.createTextNode(
        `${prettyDate(experience.incidentTime, experience.incidentTimeZone)}${experience.incidentTimeEnd ? ` – ${prettyDate(experience.incidentTimeEnd, experience.incidentTimeZone)}` : ""}`,
      ),
    );
    meta.append(occurred);
    const shared = document.createElement("span");
    shared.innerHTML = "<strong>Shared</strong> ";
    shared.append(document.createTextNode(prettyDate(experience.createdAt)));
    meta.append(shared);
    main.append(meta);
    card.append(main);
    const images = (experience.evidence || []).filter((file) => file.contentType?.startsWith("image/"));
    const videos = (experience.evidence || []).filter((file) => file.contentType?.startsWith("video/"));
    const documents = (experience.evidence || []).filter(
      (file) => !file.contentType?.startsWith("image/") && !file.contentType?.startsWith("video/"),
    );
    if (images.length) {
      const gallery = document.createElement("div");
      gallery.className = `feed-photo-grid${images.length > 1 ? " multi scrollable" : ""}`;
      gallery.setAttribute(
        "aria-label",
        images.length > 1
          ? `${images.length} photos. Scroll horizontally to see one photo at a time.`
          : `${images.length} attached photo`,
      );
      images.forEach((file, index) => {
        const link = document.createElement("a");
        link.className = "feed-photo";
        link.href = `/api/evidence/${encodeURIComponent(file.id)}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const image = document.createElement("img");
        image.className = "feed-photo-image";
        image.src = file.hasPreview ? `${link.href}?variant=preview` : link.href;
        image.alt = `Photo attached to ${experience.experienceCategory} experience`;
        image.loading = index === 0 ? "eager" : "lazy";
        image.decoding = "async";
        image.title = file.originalFilename;
        link.append(image);
        gallery.append(link);
      });
      const media = document.createElement("div");
      media.className = "feed-media";
      media.append(gallery);
      if (images.length > 1) {
        const controls = document.createElement("div");
        controls.className = "feed-gallery-controls";
        const previous = document.createElement("button");
        previous.type = "button";
        previous.className = "feed-gallery-step";
        previous.textContent = "‹";
        previous.setAttribute("aria-label", "Show previous photo");
        const status = document.createElement("div");
        status.className = "feed-gallery-status";
        const count = addText(status, "span", "feed-gallery-count", `Photo 1 of ${images.length}`);
        addText(status, "span", "feed-gallery-hint", "Swipe to see more");
        const progress = document.createElement("div");
        progress.className = "feed-gallery-progress";
        progress.setAttribute("role", "progressbar");
        progress.setAttribute("aria-label", "Photo position");
        progress.setAttribute("aria-valuemin", "1");
        progress.setAttribute("aria-valuemax", String(images.length));
        const progressFill = document.createElement("span");
        progressFill.style.width = `${100 / images.length}%`;
        progress.append(progressFill);
        status.append(progress);
        const next = document.createElement("button");
        next.type = "button";
        next.className = "feed-gallery-step";
        next.textContent = "›";
        next.setAttribute("aria-label", "Show next photo");
        const currentIndex = () => {
          let closest = 0;
          let distance = Infinity;
          Array.from(gallery.children).forEach((photo, index) => {
            const offset = Math.abs(photo.offsetLeft - gallery.scrollLeft);
            if (Number.isFinite(offset) && offset < distance) {
              closest = index;
              distance = offset;
            }
          });
          return closest;
        };
        const move = (direction) => {
          const index = Math.max(0, Math.min(images.length - 1, currentIndex() + direction));
          gallery.scrollTo({ left: gallery.children[index].offsetLeft, behavior: "smooth" });
        };
        const update = () => {
          const index = currentIndex();
          count.textContent = `Photo ${index + 1} of ${images.length}`;
          progress.setAttribute("aria-valuenow", String(index + 1));
          progressFill.style.width = `${((index + 1) / images.length) * 100}%`;
          previous.disabled = index === 0;
          next.disabled = index === images.length - 1;
          const activeImage = gallery.children[index]?.querySelector("img");
          const imageHeight = activeImage?.getBoundingClientRect().height;
          if (imageHeight > 0) gallery.style.height = `${imageHeight}px`;
        };
        previous.addEventListener("click", () => move(-1));
        next.addEventListener("click", () => move(1));
        gallery.addEventListener("scroll", update, { passive: true });
        gallery.addEventListener("load", update, true);
        controls.append(previous, status, next);
        media.append(controls);
        requestAnimationFrame(update);
      }
      card.append(media);
    }
    if (videos.length) {
      const gallery = document.createElement("div");
      gallery.className = `feed-video-grid${videos.length === 1 ? " single" : ""}`;
      videos.forEach((file) => {
        const video = document.createElement("video");
        video.className = "feed-video";
        video.controls = true;
        video.preload = "none";
        video.playsInline = true;
        video.title = file.originalFilename;
        video.dataset.src = `/api/evidence/${encodeURIComponent(file.id)}`;
        if (videoLoader) videoLoader.observe(video);
        else video.src = video.dataset.src;
        gallery.append(video);
      });
      card.append(gallery);
    }
    const full = document.createElement("details");
    full.className = "feed-full";
    addText(full, "summary", "", "Read the full story");
    addText(full, "p", "", experience.fullDescription);
    card.append(full);
    if (documents.length) {
      const evidence = document.createElement("div");
      evidence.className = "feed-evidence";
      addText(evidence, "div", "feed-evidence-title", `Documents · ${documents.length}`);
      const files = document.createElement("div");
      files.className = "feed-evidence-list";
      documents.forEach((file) => files.append(renderDocumentLink(file)));
      evidence.append(files);
      card.append(evidence);
    }
    renderEngagement(card, experience);
    feedList.append(card);
  });
  feedLoadedCount += experiences.length;
  feedResultCount.textContent = `${countLabel} · Showing ${Math.min(total, feedLoadedCount)} of ${total}`;
  feedLoadMore.hidden = !feedNextCursor;
}
const reactionChoices = [
  ["like", "👍", "Like"],
  ["dislike", "👎", "Dislike"],
  ["love", "❤️", "Love it"],
  ["hate", "😡", "Hate it"],
];
function renderEngagement(card, experience) {
  const engagement = experience.engagement || { counts: {}, myReaction: "", commentCount: 0 };
  const counts = { like: 0, dislike: 0, love: 0, hate: 0, ...engagement.counts };
  let myReaction = engagement.myReaction || "";
  const section = document.createElement("section");
  section.className = "feed-engagement";
  section.setAttribute("aria-label", "Reactions and comments");
  const controls = document.createElement("div");
  controls.className = "feed-reactions";
  const reactionButtons = new Map();
  const labelButton = (choice) => `${choice[1]} ${choice[2]} · ${counts[choice[0]]}`;
  reactionChoices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "feed-reaction";
    button.textContent = labelButton(choice);
    button.setAttribute("aria-pressed", String(myReaction === choice[0]));
    button.setAttribute("aria-label", `${choice[2]}, ${counts[choice[0]]} reactions`);
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const remove = myReaction === choice[0];
        const response = await fetch(`/api/experiences/${encodeURIComponent(experience.id)}/reaction`, {
          method: remove ? "DELETE" : "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: remove ? undefined : JSON.stringify({ reaction: choice[0] }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Your reaction could not be saved.");
        if (myReaction) counts[myReaction] = Math.max(0, counts[myReaction] - 1);
        myReaction = remove ? "" : choice[0];
        if (myReaction) counts[myReaction]++;
        reactionButtons.forEach((item, key) => {
          const option = reactionChoices.find((value) => value[0] === key);
          item.textContent = labelButton(option);
          item.setAttribute("aria-pressed", String(myReaction === key));
          item.setAttribute("aria-label", `${option[2]}, ${counts[key]} reactions`);
        });
        feedback.textContent = "Reaction saved.";
      } catch (error) {
        feedback.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
    reactionButtons.set(choice[0], button);
    controls.append(button);
  });
  let commentsEnabled = experience.commentsEnabled !== false;
  const commentToggle = document.createElement("button");
  commentToggle.type = "button";
  commentToggle.className = "feed-comments-toggle";
  commentToggle.textContent = `${commentsEnabled ? "💬 Comment" : "Comments off"} · ${Number(engagement.commentCount) || 0}`;
  commentToggle.setAttribute("aria-expanded", "false");
  controls.append(commentToggle);
  let commentsSetting = null;
  if (experience.isMine) {
    commentsSetting = document.createElement("button");
    commentsSetting.type = "button";
    commentsSetting.className = "feed-comments-setting";
    commentsSetting.textContent = commentsEnabled ? "Turn comments off" : "Turn comments on";
    commentsSetting.setAttribute("aria-label", commentsSetting.textContent);
    controls.append(commentsSetting);
  }
  section.append(controls);
  const feedback = addText(section, "p", "feed-comment-feedback", "");
  const panel = document.createElement("div");
  panel.className = "feed-comment-panel";
  panel.hidden = true;
  const comments = document.createElement("div");
  comments.className = "feed-comment-list";
  panel.append(comments);
  const form = document.createElement("form");
  form.className = "feed-comment-form";
  form.hidden = !commentsEnabled;
  const input = document.createElement("textarea");
  input.className = "feed-comment-input";
  input.maxLength = 1000;
  input.rows = 2;
  input.placeholder = "Add a comment (up to 1,000 characters)";
  input.setAttribute("aria-label", "Write a comment");
  const submit = document.createElement("button");
  submit.className = "feed-comment-submit";
  submit.type = "submit";
  submit.textContent = "Post comment";
  form.append(input, submit);
  panel.append(form);
  section.append(panel);
  card.append(section);
  let commentsLoaded = false;
  const drawComments = (items) => {
    comments.replaceChildren();
    if (!items.length) {
      addText(
        comments,
        "p",
        "feed-comment-empty",
        commentsEnabled
          ? "No comments yet. Say something useful—or at least kind."
          : "Comments are off for this story.",
      );
      return;
    }
    items.forEach((comment) => {
      const item = document.createElement("article");
      item.className = "feed-comment";
      const header = addText(item, "div", "", "");
      addText(header, "strong", "", comment.authorName || "NFD member");
      const time = document.createElement("time");
      time.textContent = prettyDate(comment.createdAt);
      header.append(time);
      if (comment.canDelete) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "feed-comment-delete";
        remove.textContent = "Delete";
        remove.setAttribute("aria-label", "Delete this comment");
        remove.addEventListener("click", async () => {
          if (!window.confirm("Delete this comment?")) return;
          remove.disabled = true;
          try {
            const response = await fetch(
              `/api/experiences/${encodeURIComponent(experience.id)}/comments/${encodeURIComponent(comment.id)}`,
              { method: "DELETE", headers: { accept: "application/json" } },
            );
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || "Comment could not be deleted.");
            counts.commentCount = Number(result.commentCount) || 0;
            commentToggle.textContent = `${commentsEnabled ? "💬 Comment" : "Comments off"} · ${counts.commentCount}`;
            feedback.textContent = "Comment deleted.";
            commentsLoaded = false;
            await loadComments();
          } catch (error) {
            feedback.textContent = error.message;
            remove.disabled = false;
          }
        });
        header.append(remove);
      }
      addText(item, "p", "", comment.body);
      comments.append(item);
    });
  };
  async function loadComments() {
    comments.replaceChildren();
    addText(comments, "p", "feed-comment-empty", "Loading comments…");
    try {
      const response = await fetch(`/api/experiences/${encodeURIComponent(experience.id)}/comments`, {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Comments could not be loaded.");
      commentsEnabled = result.commentsEnabled !== false;
      form.hidden = !commentsEnabled;
      if (commentsSetting) {
        commentsSetting.textContent = commentsEnabled ? "Turn comments off" : "Turn comments on";
        commentsSetting.setAttribute("aria-label", commentsSetting.textContent);
      }
      commentToggle.textContent = `${commentsEnabled ? "💬 Comment" : "Comments off"} · ${Number(engagement.commentCount) || 0}`;
      drawComments(result.comments || []);
      commentsLoaded = true;
    } catch (error) {
      comments.replaceChildren();
      addText(comments, "p", "feed-comment-empty", error.message);
    }
  }
  commentToggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    commentToggle.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden && !commentsLoaded) loadComments();
  });
  commentsSetting?.addEventListener("click", async () => {
    commentsSetting.disabled = true;
    try {
      const enabled = !commentsEnabled;
      const response = await fetch(`/api/experiences/${encodeURIComponent(experience.id)}/comments`, {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Comment settings could not be changed.");
      commentsEnabled = result.commentsEnabled !== false;
      form.hidden = !commentsEnabled;
      commentsSetting.textContent = commentsEnabled ? "Turn comments off" : "Turn comments on";
      commentsSetting.setAttribute("aria-label", commentsSetting.textContent);
      commentToggle.textContent = `${commentsEnabled ? "💬 Comment" : "Comments off"} · ${Number(engagement.commentCount) || 0}`;
      feedback.textContent = commentsEnabled ? "Comments are on." : "Comments are off.";
      if (!commentsLoaded && !panel.hidden) await loadComments();
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      commentsSetting.disabled = false;
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body || !commentsEnabled) return;
    submit.disabled = true;
    feedback.textContent = "Posting comment…";
    try {
      const response = await fetch(`/api/experiences/${encodeURIComponent(experience.id)}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ body }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Comment could not be posted.");
      input.value = "";
      counts.commentCount = (Number(counts.commentCount) || 0) + 1;
      commentToggle.textContent = `💬 Comment · ${counts.commentCount}`;
      feedback.textContent = "Comment posted.";
      commentsLoaded = false;
      await loadComments();
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
}
function setProfileMessage(message, isError = false) {
  profileMessage.textContent = message;
  profileMessage.classList.toggle("error", isError);
  profileMessage.hidden = !message;
}
function renderGhostSettings(state) {
  currentGhostMode = state || { allowed: false, active: false, profile: null };
  ghostSettings.hidden = !currentGhostMode.allowed;
  if (!currentGhostMode.allowed) return;
  const profile = currentGhostMode.profile;
  ghostProfileReady.hidden = !profile;
  ghostCreateForm.hidden = Boolean(profile);
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
function renderProfile(data) {
  const user = data.user || {};
  const displayName = user.name || user.email?.split("@")[0] || "NFD member";
  document.getElementById("profile-intro").textContent =
    user.provider === "ghost"
      ? "This Ghost identity has its own friends, messages, and posts, separate from your personal NFD profile."
      : "Your account details and the experiences you’ve shared. Your profile details are visible only to you.";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "N";
  profileSummary.replaceChildren();
  addText(profileSummary, "div", "profile-avatar", initials);
  const identity = addText(profileSummary, "div", "profile-identity", "");
  addText(identity, "h2", "", displayName);
  addText(
    identity,
    "p",
    "",
    user.provider === "ghost"
      ? `@${user.ghostHandle}`
      : user.email || "Email not provided by this sign-in method",
  );
  addText(
    profileSummary,
    "span",
    "profile-provider",
    user.provider === "ghost"
      ? "Ghost profile"
      : user.provider === "google"
        ? "Google account"
        : "ChatGPT account",
  );
  profilePostList.replaceChildren();
  const posts = data.experiences || [];
  profilePostCount.textContent = `${data.total || 0} ${Number(data.total) === 1 ? "post" : "posts"} shared`;
  if (!posts.length) {
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
      `${experience.experienceCategory} · ${experience.incidentCategory}`,
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
    where.append(document.createTextNode(`${experience.place} · ${experience.placeCategory}`));
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
    when.append(
      document.createTextNode(
        `${prettyDate(experience.incidentTime, experience.incidentTimeZone)}${experience.incidentTimeEnd ? ` – ${prettyDate(experience.incidentTimeEnd, experience.incidentTimeZone)}` : ""}`,
      ),
    );
    meta.append(when);
    card.append(meta);
    const full = document.createElement("details");
    full.className = "profile-post-full";
    addText(full, "summary", "", "Read the full story");
    addText(full, "p", "", experience.fullDescription);
    card.append(full);
    const evidence = experience.evidence || [];
    if (evidence.length) {
      const files = document.createElement("div");
      files.className = "profile-post-evidence";
      evidence.forEach((file) => {
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
        const remaining = profilePostList.querySelectorAll(".profile-post-card").length;
        profilePostCount.textContent = `${remaining} ${remaining === 1 ? "post" : "posts"} shared`;
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
}
async function loadProfile() {
  profileMessage.hidden = true;
  profilePostList.replaceChildren();
  profileSummary.innerHTML = '<div class="profile-loading">Loading your profile…</div>';
  profilePostCount.textContent = "Loading your posts…";
  try {
    const response = await fetch("/api/profile", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your profile could not be loaded.");
    renderProfile(result);
    loadFriends();
    await loadGhostSettings();
  } catch (error) {
    profileSummary.innerHTML = "";
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
    const person = document.createElement("div");
    person.className = "friend-person";
    addText(person, "strong", "", friend.name || "NFD member");
    addText(person, "span", "", friend.email || "");
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
    addAction(
      kind === "friends" ? "Remove" : kind === "outgoing" ? "Cancel" : "Ignore",
      kind === "friends" ? "remove" : "ignore",
      "DELETE",
      "remove",
    );
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
        "No matching NFD members found. Try a different spelling or email username.";
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
  try {
    const response = await fetch("/api/messages", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return;
    const result = await response.json().catch(() => ({}));
    const unread = (result.friends || []).reduce(
      (total, friend) => total + (Number(friend.unreadCount) || 0),
      0,
    );
    navUnreadCount.hidden = unread === 0;
    navUnreadCount.textContent = unread > 99 ? "99+" : String(unread);
    messagesNavLink.setAttribute("aria-label", unread ? `Messages, ${unread} unread` : "Messages");
  } catch {}
}
function formatMessageTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function messageExpiryLabel(message) {
  if (!message.seenAt) return "Sent · waiting to be seen";
  const remaining = Date.parse(message.expiresAt) - Date.now();
  if (remaining <= 0) return "Disappearing…";
  const minutes = Math.ceil(remaining / 60000);
  return `Seen · disappears in ${minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`}`;
}
async function loadMessageFriends() {
  messageInboxStatus.textContent = "Loading your friends…";
  messageInboxStatus.classList.remove("error");
  try {
    const response = await fetch("/api/messages", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your messages could not be loaded.");
    currentUserId = result.currentUserId || currentUserId;
    const friends = result.friends || [];
    messageThreadList.replaceChildren();
    messageInboxStatus.textContent = friends.length
      ? `${friends.length} ${friends.length === 1 ? "friend" : "friends"}`
      : "Your accepted friends will appear here.";
    messageInboxEmpty.hidden = friends.length > 0;
    friends.forEach((friend) => {
      const item = document.createElement("li");
      item.className = "message-thread-item";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "message-thread-button";
      button.dataset.friendId = friend.id;
      button.setAttribute("aria-current", String(friend.id === currentMessageFriendId));
      addText(button, "span", "message-thread-name", friend.name);
      if (friend.unreadCount)
        addText(
          button,
          "span",
          "message-unread",
          String(friend.unreadCount > 99 ? "99+" : friend.unreadCount),
        );
      addText(button, "span", "message-thread-preview", friend.lastMessage || "Start a conversation");
      button.addEventListener("click", () => openMessageThread(friend.id, friend.name));
      item.append(button);
      messageThreadList.append(item);
    });
    if (!friends.length) {
      currentMessageFriendId = "";
      messageThreadHeader.hidden = true;
      messageList.hidden = true;
      messageCompose.hidden = true;
      messageThreadEmpty.hidden = false;
    } else if (currentMessageFriendId && !friends.some((friend) => friend.id === currentMessageFriendId)) {
      currentMessageFriendId = "";
      messageThreadHeader.hidden = true;
      messageList.hidden = true;
      messageCompose.hidden = true;
      messageThreadEmpty.hidden = false;
      messageThreadEmpty.textContent = "You can message only accepted NFD friends.";
    }
    return friends;
  } catch (error) {
    messageInboxStatus.textContent = error.message;
    messageInboxStatus.classList.add("error");
    return [];
  }
}
let messageSeenObserver;
async function markMessagesSeen(friendId, messageIds) {
  const fresh = messageIds.filter((id) => !messageSeenPending.has(id));
  if (!fresh.length) return;
  fresh.forEach((id) => messageSeenPending.add(id));
  try {
    const response = await fetch(`/api/messages/${encodeURIComponent(friendId)}/seen`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ messageIds: fresh }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Message status could not be updated.");
    await loadFriendMessages({ quiet: true });
  } catch (error) {
    fresh.forEach((id) => messageSeenPending.delete(id));
    setMessageFeedback(error.message, true);
  }
}
function observeIncomingMessage(bubble, message, friendId) {
  if (message.seenAt) return;
  if (messageSeenObserver) messageSeenObserver.observe(bubble);
  else markMessagesSeen(friendId, [message.id]);
}
function renderMessageConversation(result, friendId) {
  if (friendId !== currentMessageFriendId) return;
  messageFriendName.textContent = result.friend?.name || "NFD friend";
  messageThreadHeader.hidden = false;
  messageThreadEmpty.hidden = true;
  messageList.hidden = false;
  messageCompose.hidden = false;
  const nearBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 100;
  const messages = result.messages || [];
  messageList.replaceChildren();
  if (!messages.length)
    addText(
      messageList,
      "p",
      "message-empty-conversation",
      "No messages here yet. Say hi when you’re ready.",
    );
  messages.forEach((message) => {
    const own = message.senderId === currentUserId;
    const bubble = document.createElement("article");
    bubble.className = `message-bubble${own ? " own" : ""}`;
    bubble.dataset.messageId = message.id;
    addText(bubble, "div", "message-bubble-text", message.body);
    const meta = addText(
      bubble,
      "div",
      "message-bubble-meta",
      `${formatMessageTime(message.createdAt)}${own ? ` · ${messageExpiryLabel(message)}` : ""}`,
    );
    meta.title = own && message.seenAt ? `Seen at ${new Date(message.seenAt).toLocaleString()}` : "";
    messageList.append(bubble);
    if (!own && !message.seenAt) observeIncomingMessage(bubble, message, friendId);
  });
  if (!messages.length || nearBottom) messageList.scrollTop = messageList.scrollHeight;
}
async function loadFriendMessages({ quiet = false } = {}) {
  const friendId = currentMessageFriendId;
  if (!friendId || messageRefreshInFlight) return;
  messageRefreshInFlight = true;
  if (!quiet) setMessageFeedback("Loading conversation…");
  try {
    const response = await fetch(`/api/messages/${encodeURIComponent(friendId)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This conversation could not be loaded.");
    messageSeenPending = new Set(
      (result.messages || []).filter((message) => message.seenAt).map((message) => message.id),
    );
    renderMessageConversation(result, friendId);
    if (!quiet) setMessageFeedback("Messages are private to you and your accepted friend.");
  } catch (error) {
    if (!quiet) setMessageFeedback(error.message, true);
  } finally {
    messageRefreshInFlight = false;
  }
}
async function openMessageThread(friendId, friendName = "") {
  currentMessageFriendId = friendId;
  messageThreadHeader.hidden = false;
  messageFriendName.textContent = friendName || "Loading…";
  messageThreadEmpty.hidden = true;
  messageList.hidden = false;
  messageCompose.hidden = false;
  messageInput.focus();
  messageThreadList
    .querySelectorAll(".message-thread-button")
    .forEach((button) => button.setAttribute("aria-current", String(button.dataset.friendId === friendId)));
  history.replaceState(null, "", `/messages?friend=${encodeURIComponent(friendId)}`);
  setMessageFeedback("");
  await loadFriendMessages();
}
messageSeenObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          const ids = [];
          let friendId = "";
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
              const id = entry.target.dataset.messageId;
              if (id) {
                ids.push(id);
                friendId = currentMessageFriendId;
                messageSeenObserver.unobserve(entry.target);
              }
            }
          });
          if (friendId && ids.length) markMessagesSeen(friendId, ids);
        },
        { root: messageList, threshold: [0.25] },
      )
    : null;
messageCompose.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentMessageFriendId || !messageInput.value.trim()) return;
  const body = messageInput.value;
  messageSend.disabled = true;
  messageSend.textContent = "Sending…";
  try {
    const response = await fetch(`/api/messages/${encodeURIComponent(currentMessageFriendId)}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ body }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your message could not be sent.");
    messageInput.value = "";
    setMessageFeedback("Sent. The one-hour timer starts when your friend sees it.");
    await Promise.all([loadFriendMessages({ quiet: true }), loadMessageFriends()]);
  } catch (error) {
    setMessageFeedback(error.message, true);
  } finally {
    messageSend.disabled = false;
    messageSend.textContent = "Send";
  }
});
async function loadMessagesPage() {
  const friends = await loadMessageFriends();
  const requestedFriend = new URLSearchParams(location.search).get("friend");
  const selected = requestedFriend && friends.find((friend) => friend.id === requestedFriend);
  if (selected) await openMessageThread(selected.id, selected.name);
  else if (requestedFriend) {
    messageThreadEmpty.textContent = "You can message only accepted NFD friends.";
    messageThreadHeader.hidden = true;
    messageList.hidden = true;
    messageCompose.hidden = true;
  }
  clearInterval(messageRefreshTimer);
  messageRefreshTimer = setInterval(() => {
    if (document.visibilityState === "visible") {
      loadMessageFriends();
      loadFriendMessages({ quiet: true });
    }
  }, 15000);
}
let acceptedFriendCount = 0;
function updateAudienceNote() {
  const visibility = document.querySelector('input[name="visibility"]:checked')?.value || "public";
  if (visibility === "friends")
    audienceNote.textContent = acceptedFriendCount
      ? `Only your ${acceptedFriendCount} accepted NFD ${acceptedFriendCount === 1 ? "friend" : "friends"} can see this story and its files. You can manage connections on your profile.`
      : "You have no accepted NFD friends yet. This story and its files will be visible only to you until you connect with friends.";
  else if (visibility === "anonymous")
    audienceNote.textContent =
      "Your name and profile stay hidden in the feed. Details you write or include in files could still identify you, so review them carefully.";
  else
    audienceNote.textContent =
      "All signed-in NFD members can see this story and its files. Your NFD display name is shown.";
}
async function loadFriendCount() {
  try {
    const response = await fetch("/api/friends", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) acceptedFriendCount = (result.friends || []).length;
  } catch {}
  updateAudienceNote();
}
document
  .querySelectorAll('input[name="visibility"]')
  .forEach((input) => input.addEventListener("change", updateAudienceNote));
friendRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.getElementById("friend-request-email");
  const button = friendRequestForm.querySelector('button[type="submit"]');
  button.disabled = true;
  setFriendsFeedback("Sending request…");
  try {
    const response = await fetch("/api/friends", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: input.value.trim() }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "The friend request could not be sent.");
    input.value = "";
    setFriendsFeedback(
      result.message ||
        "If that email belongs to another NFD member, your request will appear in their profile.",
    );
    await loadFriends();
  } catch (error) {
    setFriendsFeedback(error.message, true);
  } finally {
    button.disabled = false;
  }
});
let feedRequestNumber = 0;
let feedFilterTimer;
function updateSuggestions(list, values) {
  list.replaceChildren();
  [...new Set((values || []).filter(Boolean))].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    list.append(option);
  });
}
function updateSelectOptions(select, values, placeholder) {
  const selected = select.value;
  select.replaceChildren();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = placeholder;
  select.append(empty);
  [...new Set((values || []).filter(Boolean))].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
  if ((values || []).includes(selected)) select.value = selected;
}
function updateFeedFilterToggle() {
  const count = [
    feedPlaceSearch.value.trim(),
    feedLocationSearch.value.trim(),
    feedExperienceCategory.value,
    feedIncidentCategory.value,
    feedPlaceCategory.value,
  ].filter(Boolean).length;
  feedFilterCount.hidden = !count;
  feedFilterCount.textContent = count ? String(count) : "";
  const label = count ? `Show search filters (${count} active)` : "Show search filters";
  feedFilterToggle.setAttribute("aria-label", label);
  feedFilterToggle.title = count ? `${count} active ${count === 1 ? "filter" : "filters"}` : "Search filters";
}
feedFilterToggle.addEventListener("click", () => {
  const open = feedFilterToggle.getAttribute("aria-expanded") !== "true";
  feedFilterToggle.setAttribute("aria-expanded", String(open));
  feedFilters.hidden = !open;
});
function clearFeedFilters() {
  clearTimeout(feedFilterTimer);
  feedPlaceSearch.value = "";
  feedLocationSearch.value = "";
  feedExperienceCategory.value = "";
  feedIncidentCategory.value = "";
  feedPlaceCategory.value = "";
  updateFeedFilterToggle();
  loadFeed();
}
function scheduleFeedLoad() {
  clearTimeout(feedFilterTimer);
  feedFilterTimer = setTimeout(loadFeed, 260);
}
feedPlaceSearch.addEventListener("input", scheduleFeedLoad);
feedLocationSearch.addEventListener("input", scheduleFeedLoad);
[feedExperienceCategory, feedIncidentCategory, feedPlaceCategory].forEach((select) =>
  select.addEventListener("change", () => {
    updateFeedFilterToggle();
    loadFeed();
  }),
);
[feedPlaceSearch, feedLocationSearch].forEach((input) =>
  input.addEventListener("input", updateFeedFilterToggle),
);
document.getElementById("clear-feed-filters").addEventListener("click", clearFeedFilters);
async function loadFeed({ append = false } = {}) {
  const requestNumber = ++feedRequestNumber;
  if (!append) {
    feedNextCursor = "";
    feedLoadedCount = 0;
    feedLoadMore.hidden = true;
    feedList.replaceChildren();
  }
  if (append && !feedNextCursor) return;
  const params = new URLSearchParams();
  if (feedPlaceSearch.value.trim()) params.set("place", feedPlaceSearch.value.trim());
  if (feedLocationSearch.value.trim()) params.set("location", feedLocationSearch.value.trim());
  if (feedExperienceCategory.value) params.set("experienceCategory", feedExperienceCategory.value);
  if (feedIncidentCategory.value) params.set("incidentCategory", feedIncidentCategory.value);
  if (feedPlaceCategory.value) params.set("placeCategory", feedPlaceCategory.value);
  if (append && feedNextCursor) params.set("cursor", feedNextCursor);
  feedState.textContent = params.size ? "Looking for matching stories…" : "Looking for stories…";
  feedState.hidden = false;
  try {
    const response = await fetch(`/api/experiences${params.size ? `?${params}` : ""}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (requestNumber !== feedRequestNumber) return;
    if (!response.ok) throw new Error(result.error || "NFD couldn’t load the stories just now.");
    updateSuggestions(feedPlaceSuggestions, result.placeSuggestions);
    updateSuggestions(feedLocationSuggestions, result.locationSuggestions);
    updateSelectOptions(feedExperienceCategory, result.experienceCategoryOptions, "Any experience type");
    updateSelectOptions(feedIncidentCategory, result.incidentCategoryOptions, "Any incident type");
    updateSelectOptions(feedPlaceCategory, result.placeCategoryOptions, "Any place type");
    updateFeedFilterToggle();
    renderFeed(result.experiences || [], Number(result.total) || 0, {
      append,
      nextCursor: result.nextCursor || "",
    });
  } catch (error) {
    if (requestNumber !== feedRequestNumber) return;
    feedState.hidden = true;
    if (append) {
      feedState.textContent =
        error instanceof TypeError
          ? "More stories could not load. Check your connection and try again."
          : error.message;
      feedState.hidden = false;
    } else {
      feedResultCount.textContent = "";
      feedList.replaceChildren();
      addText(
        feedList,
        "div",
        "feed-error",
        error instanceof TypeError ? "The feed could not connect. Try refreshing this page." : error.message,
      );
    }
  }
}
feedLoadMore.addEventListener("click", async () => {
  if (feedLoadMore.disabled || !feedNextCursor) return;
  feedLoadMore.disabled = true;
  feedLoadMore.textContent = "Loading stories…";
  await loadFeed({ append: true });
  feedLoadMore.disabled = false;
  feedLoadMore.textContent = "Show more stories";
});
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
    category.textContent = `${post.experienceCategory} · ${post.incidentCategory} · ${post.place}`;
    copy.append(category);
    const story = document.createElement("details");
    story.className = "member-identifiers";
    addText(story, "summary", "", "Read full post");
    addText(story, "p", "", "" + (post.fullDescription || post.shortDescription || ""));
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
async function loadReviewModerationStatus() {
  aiReviewConsent.hidden = true;
  aiReviewConsentCheckbox.checked = false;
  try {
    const response = await fetch("/api/moderation/settings", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.enabled) aiReviewConsent.hidden = false;
  } catch {}
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
    admins: "Manage administrators",
  };
  const panels = [
    adminOverview,
    adminManagement,
    memberDirectory,
    ghostAccessPanel,
    activityAudit,
    moderationSettings,
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
  if (pageKey === "admins") {
    await loadAdminUsers();
    return;
  }
  adminOverview.hidden = false;
}
async function updateNavigation() {
  if (location.pathname === "/login") {
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
    startSessionActivityTracking();
    currentUserId = result.userId || currentUserId;
    adminNavLink.hidden = !result.isAdmin;
    accountAdminLink.hidden = !result.isAdmin;
    setMainNavigationVisible(true);
    currentGhostMode = result.ghostMode || { allowed: false, active: false, profile: null };
    const hasGhostProfile = Boolean(currentGhostMode.profile);
    ghostModeSetupLink.hidden = !currentGhostMode.allowed || hasGhostProfile;
    ghostModeToggle.hidden = !currentGhostMode.allowed || !hasGhostProfile;
    ghostModeToggle.textContent = currentGhostMode.active ? "Turn off Ghost mode" : "Turn on Ghost mode";
    ghostModeBanner.hidden = !currentGhostMode.active;
    ghostModeHandle.textContent = currentGhostMode.profile?.handle
      ? `@${currentGhostMode.profile.handle}`
      : "";
    await refreshMessageNavBadge();
    const pendingTrustScore = Number(result.trustScorePendingCount) || 0;
    trustScorePendingCount.hidden = pendingTrustScore < 1;
    trustScorePendingCount.textContent = pendingTrustScore > 99 ? "99+" : String(pendingTrustScore);
    clearInterval(messageNavRefreshTimer);
    messageNavRefreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") refreshMessageNavBadge();
    }, 15000);
  } catch {
    setMainNavigationVisible(false);
  }
}
updateNavigation();
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
if (location.pathname === "/login") {
  appLayout.hidden = true;
  loginPage.hidden = false;
  setMainNavigationVisible(false);
  document.title = "Sign in — NFD";
  const params = new URLSearchParams(location.search);
  document.getElementById("user-signin").href = "/auth/chatgpt-resume?return_to=%2Ffeed";
  if (params.get("idle") === "1") {
    const feedback = document.getElementById("google-feedback");
    feedback.style.display = "block";
    feedback.textContent = "You were signed out after 4 minutes without activity. Sign in again to continue.";
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
  appLayout.hidden = true;
  trustScorePage.hidden = false;
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
if (location.pathname === "/share") {
  updateIncidentCategoryOptions();
  loadFriendCount();
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  showReview();
});
document.getElementById("edit-experience").addEventListener("click", backToEdit);
document.getElementById("confirm-review").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Sharing…";
  reviewNotice.classList.remove("show", "error");
  reviewNotice.replaceChildren();
  const payload = new FormData();
  payload.append("experienceCategory", document.getElementById("experience-category").value);
  payload.append("incidentCategory", document.getElementById("incident-category").value);
  payload.append("place", document.getElementById("place").value.trim());
  payload.append("placeCategory", document.getElementById("place-category").value);
  payload.append("incidentTimeUtc", new Date(document.getElementById("incident-time").value).toISOString());
  if (incidentTimeRangeToggle.checked)
    payload.append("incidentTimeEndUtc", new Date(incidentTimeEndInput.value).toISOString());
  payload.append("incidentTimeZone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  payload.append("locationDetail", document.getElementById("location-detail").value.trim());
  payload.append("shortDescription", shortDescription.value.trim());
  payload.append("fullDescription", fullDescription.value.trim());
  payload.append("visibility", document.querySelector('input[name="visibility"]:checked')?.value || "public");
  if (!aiReviewConsent.hidden && aiReviewConsentCheckbox.checked) payload.append("aiReviewConsent", "yes");
  selectedFiles.forEach((file) => payload.append("evidence", file, file.name));
  try {
    button.textContent = "Preparing photos…";
    for (let index = 0; index < selectedFiles.length; index++) {
      const preview = await createFeedPreview(selectedFiles[index]);
      if (preview) payload.append(`evidencePreview-${index}`, preview, `nfd-photo-${index}.webp`);
    }
    button.textContent = "Sharing…";
    const response = await fetch("/api/experiences", { method: "POST", body: payload });
    const result = await response.json().catch(() => ({}));
    if (response.status === 422 && result.moderation) {
      reviewNotice.replaceChildren();
      const title = document.createElement("strong");
      title.textContent = "A quick edit needed before this goes live.";
      const note = document.createElement("p");
      note.textContent = result.error || "This draft needs an edit to meet the community guidelines.";
      reviewNotice.append(title, note);
      if (result.moderation.flaggedFiles?.length) {
        const files = document.createElement("p");
        files.textContent = `Remove or replace: ${result.moderation.flaggedFiles.join(", ")}.`;
        reviewNotice.append(files);
      }
      if (result.moderation.suggestedShortDescription || result.moderation.suggestedFullDescription) {
        const apply = document.createElement("button");
        apply.type = "button";
        apply.className = "secondary-button";
        apply.textContent = "Use the suggested wording";
        apply.addEventListener("click", () => {
          if (result.moderation.suggestedShortDescription)
            shortDescription.value = result.moderation.suggestedShortDescription;
          if (result.moderation.suggestedFullDescription)
            fullDescription.value = result.moderation.suggestedFullDescription;
          backToEdit();
        });
        reviewNotice.append(apply);
      }
      reviewNotice.classList.add("show", "error");
      button.disabled = false;
      button.innerHTML = "Try sharing again";
      reviewNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (!response.ok)
      throw new Error(result.error || "NFD couldn’t post your story just now. Please try again.");
    window.location.assign(`/feed?shared=${encodeURIComponent(result.id)}`);
  } catch (error) {
    const title = document.createElement("strong");
    title.textContent = "Your story hasn’t made it to the feed yet.";
    const detail = document.createElement("span");
    detail.textContent = ` ${error instanceof TypeError ? "Connection failed. Your details are still here; try again." : error.message}`;
    reviewNotice.append(title, detail);
    reviewNotice.classList.add("show", "error");
    button.innerHTML = "Try sharing again";
    button.disabled = false;
  }
  reviewNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
