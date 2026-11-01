const picker = document.getElementById("evidence-files");
const cameraPhotoPicker = document.getElementById("camera-photo");
const cameraVideoPicker = document.getElementById("camera-video");
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
const postPlaceInput = document.getElementById("place");
const postPlaceSuggestions = document.getElementById("post-place-suggestions");
const postLocationInput = document.getElementById("location-detail");
const postLocationSuggestions = document.getElementById("post-location-suggestions");
const reviewPage = document.getElementById("review-page");
const reviewFiles = document.getElementById("review-files");
const reviewNotice = document.getElementById("review-notice");
const aiReviewConsent = document.getElementById("ai-review-consent");
const aiReviewConsentCheckbox = document.getElementById("ai-review-consent-checkbox");
const feedPage = document.getElementById("feed-page");
const feedTagline = feedPage.querySelector(".feed-heading .eyebrow");
const feedList = document.getElementById("feed-list");
const storiesTray = document.getElementById("stories-tray");
const storyFriends = document.getElementById("story-friends");
const myStoryButton = document.getElementById("my-story-button");
const myStoryPhoto = document.getElementById("my-story-photo");
const myStoryInitials = document.getElementById("my-story-initials");
const storyCreateButton = document.getElementById("story-create-button");
const storyComposer = document.getElementById("story-composer");
const storyForm = document.getElementById("story-form");
const storyMediaPreview = document.getElementById("story-media-preview");
const storyMediaFile = document.getElementById("story-media-file");
const storyCameraFile = document.getElementById("story-camera-file");
const storyCaption = document.getElementById("story-caption");
const storyComposeFeedback = document.getElementById("story-compose-feedback");
const storyShareButton = document.getElementById("story-share-button");
const storyViewer = document.getElementById("story-viewer");
const storyViewerProgress = document.getElementById("story-viewer-progress");
const storyViewerName = document.getElementById("story-viewer-name");
const storyViewerTime = document.getElementById("story-viewer-time");
const storyViewerAvatar = document.getElementById("story-viewer-avatar");
const storyViewerStage = document.getElementById("story-viewer-stage");
const storyViewerCaption = document.getElementById("story-viewer-caption");
const storyPreviousButton = document.getElementById("story-previous-button");
const storyNextButton = document.getElementById("story-next-button");
const storyDeleteButton = document.getElementById("story-delete-button");
const storySoundButton = document.getElementById("story-sound-button");
const profilePhotoForm = document.getElementById("profile-photo-form");
const profilePhotoFile = document.getElementById("profile-photo-file");
const profilePhotoSave = document.getElementById("profile-photo-save");
const profilePhotoRemove = document.getElementById("profile-photo-remove");
const profilePhotoFeedback = document.getElementById("profile-photo-feedback");
const profilePhotoPreview = document.getElementById("profile-photo-preview");
const accountProfilePhoto = document.getElementById("account-profile-photo");
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
const accountAdminLink = document.getElementById("account-admin-link");
const ghostModeSetupLink = document.getElementById("ghost-mode-setup");
const ghostModeToggle = document.getElementById("ghost-mode-toggle");
const ghostModeBanner = document.getElementById("ghost-mode-banner");
const ghostModeHandle = document.getElementById("ghost-mode-handle");
const ghostModeExit = document.getElementById("ghost-mode-exit");
const messagesNavLink = document.getElementById("messages-nav-link");
const navUnreadCount = document.getElementById("nav-unread-count");
const FEED_TAGLINES = [
  "Good days. Bad calls. Plot twists.",
  "Small moments. Stories that stay.",
  "Life happens. Share what matters.",
  "Real moments, honestly told.",
  "Every experience has a story.",
  "The moments that bring us closer.",
  "A little kindness goes a long way.",
  "From awkward to unforgettable.",
  "Good people. Better stories.",
];
const FEED_TAGLINE_LOGIN_PENDING_KEY = "nfd:feed-tagline-login-pending";
function syncFeedTagline(userId) {
  if (!feedTagline) return;
  const taglineKey = `nfd:feed-tagline:${encodeURIComponent(userId || "member")}`;
  try {
    const previousIndex = Number(localStorage.getItem(taglineKey));
    const isNewLogin = sessionStorage.getItem(FEED_TAGLINE_LOGIN_PENDING_KEY) === "1";
    let index = previousIndex;
    if (isNewLogin || !Number.isInteger(index) || index < 0 || index >= FEED_TAGLINES.length) {
      const choices = FEED_TAGLINES.map((_, option) => option).filter((option) => option !== previousIndex);
      index = choices[Math.floor(Math.random() * choices.length)];
      localStorage.setItem(taglineKey, String(index));
    }
    if (isNewLogin) sessionStorage.removeItem(FEED_TAGLINE_LOGIN_PENDING_KEY);
    feedTagline.textContent = FEED_TAGLINES[index];
  } catch {
    feedTagline.textContent = FEED_TAGLINES[Math.floor(Math.random() * FEED_TAGLINES.length)];
  }
}
function setMainNavigationVisible(visible) {
  mainNav.hidden = !visible;
  mainNavRow.hidden = !visible;
  accountMenuWrap.hidden = !visible;
  storiesTray.hidden = !visible;
}
let messageNavRefreshTimer;
let SESSION_IDLE_LIMIT_MS = 4 * 60 * 1000;
const SESSION_ACTIVITY_STORAGE_KEY = "nfd:last-active-at";
let inactivityLogoutTimer;
let sessionTimeoutRefreshTimer;
let lastSessionActivityAt = 0;
let lastSessionActivitySavedAt = 0;
let sessionActivityTrackingStarted = false;
let storyGroups = [];
let activeStoryGroupIndex = -1;
let activeStoryIndex = 0;
let storyAdvanceTimer;
let storyPreviewUrl = "";
let selectedStoryFile = null;
let storyTrayRefreshTimer;
function setAvatarPhoto(image, photoUrl, fallbackElement) {
  if (!image || !fallbackElement) return;
  if (!photoUrl) {
    image.hidden = true;
    image.removeAttribute("src");
    fallbackElement.hidden = false;
    return;
  }
  image.onload = () => {
    image.hidden = false;
    fallbackElement.hidden = true;
  };
  image.onerror = () => {
    image.hidden = true;
    fallbackElement.hidden = false;
  };
  image.src = photoUrl;
}
function setProfilePhotoEverywhere(photoUrl, displayName = "NFD member") {
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "N";
  if (accountProfilePhoto) {
    if (photoUrl) {
      accountProfilePhoto.onload = () => {
        accountProfilePhoto.hidden = false;
      };
      accountProfilePhoto.onerror = () => {
        accountProfilePhoto.hidden = true;
        accountMenuButton.classList.remove("has-profile-photo");
      };
      accountProfilePhoto.src = photoUrl;
    } else {
      accountProfilePhoto.hidden = true;
      accountProfilePhoto.removeAttribute("src");
    }
    accountMenuButton.classList.toggle("has-profile-photo", Boolean(photoUrl));
  }
  profilePhotoPreview.replaceChildren();
  if (photoUrl) {
    const image = document.createElement("img");
    image.alt = "";
    image.src = photoUrl;
    image.onerror = () => {
      profilePhotoPreview.textContent = initials;
    };
    profilePhotoPreview.append(image);
    profilePhotoRemove.hidden = false;
  } else {
    profilePhotoPreview.textContent = initials;
    profilePhotoRemove.hidden = true;
  }
  const avatar = profileSummary.querySelector(".profile-avatar");
  if (avatar) {
    avatar.replaceChildren();
    if (photoUrl) {
      const image = document.createElement("img");
      image.alt = "";
      image.src = photoUrl;
      avatar.append(image);
    } else avatar.textContent = initials;
  }
  myStoryInitials.textContent = initials.slice(0, 1) || "N";
  setAvatarPhoto(myStoryPhoto, photoUrl, myStoryInitials);
}
function readSharedSessionActivity() {
  try {
    const value = Number(localStorage.getItem(SESSION_ACTIVITY_STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}
function applySessionIdleMinutes(value) {
  const minutes = Number(value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) return;
  SESSION_IDLE_LIMIT_MS = minutes * 60 * 1000;
  if (sessionActivityTrackingStarted) scheduleInactivityLogout();
}
async function refreshSessionIdleMinutes() {
  try {
    const response = await fetch("/api/session-timeout", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return;
    const result = await response.json().catch(() => ({}));
    applySessionIdleMinutes(result.minutes);
  } catch {
    // Keep using the last value if the settings endpoint is temporarily unavailable.
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
  let signedInAfterLogin = false;
  try {
    signedInAfterLogin = sessionStorage.getItem(FEED_TAGLINE_LOGIN_PENDING_KEY) === "1";
  } catch {
    // A blocked sessionStorage must not disable activity tracking.
  }
  const previousActivity = readSharedSessionActivity();
  if (!signedInAfterLogin && previousActivity && Date.now() - previousActivity >= SESSION_IDLE_LIMIT_MS) {
    location.replace("/auth/signout?idle=1&return_to=%2Flogin%3Fidle%3D1");
    return;
  }
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
const profileOwnView = document.getElementById("profile-own-view");
const friendProfileView = document.getElementById("friend-profile-view");
const profileTabs = [...document.querySelectorAll("[data-profile-tab]")];
const profileTabPanels = [...document.querySelectorAll(".profile-tab-panel")];
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
const trustScorePage = document.getElementById("trust-score-page");
const trustScoreTabs = [...document.querySelectorAll("[data-trust-tab]")];
const trustScorePanels = [...document.querySelectorAll(".trust-score-panel")];
const openAgreementTabButton = document.getElementById("open-agreement-tab");
const agreementForm = document.getElementById("agreement-form");
const agreementDescription = document.getElementById("agreement-description");
const agreementDescriptionCount = document.getElementById("agreement-description-count");
const agreementGeminiConsent = document.getElementById("agreement-gemini-consent");
const agreementGenerateButton = document.getElementById("agreement-generate");
const agreementFeedback = document.getElementById("agreement-feedback");
const agreementResult = document.getElementById("agreement-result");
const agreementDraft = document.getElementById("agreement-draft");
const agreementDownloadButton = document.getElementById("agreement-download");
const agreementDownloadFeedback = document.getElementById("agreement-download-feedback");
const agreementSaveTitle = document.getElementById("agreement-save-title");
const agreementFriendsList = document.getElementById("agreement-friends-list");
const agreementPeopleSearch = document.getElementById("agreement-people-search");
const agreementPeopleSearchStatus = document.getElementById("agreement-people-search-status");
const agreementSelectedPeople = document.getElementById("agreement-selected-people");
const agreementSaveButton = document.getElementById("agreement-save");
const agreementSaveFeedback = document.getElementById("agreement-save-feedback");
const myAgreementsList = document.getElementById("my-agreements-list");
const myAgreementsFeedback = document.getElementById("my-agreements-feedback");
const myAgreementsSummary = document.getElementById("my-agreements-summary");
const trustRecordDisputedCount = document.getElementById("trust-record-disputed-count");
const trustRecordCompletedCount = document.getElementById("trust-record-completed-count");
const trustRecordAwaitingCount = document.getElementById("trust-record-awaiting-count");
const agreementRefreshButton = document.getElementById("agreement-refresh");
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
let storedAgreementsLoading = false;
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
const detailsProgressStep = document.getElementById("step-details");
const reviewStep = document.getElementById("step-review");
const storyEntryStep = document.getElementById("story-entry-step");
const experienceDetailsStep = document.getElementById("experience-details-step");
const storyStepFooter = document.getElementById("story-step-footer");
const detailsStepFooter = document.getElementById("details-step-footer");
const formStepTitle = document.getElementById("form-step-title");
const formStepIntro = document.getElementById("form-step-intro");
const formStepCount = document.getElementById("form-step-count");
let activeStoryFormStep = "story";
let selectedFiles = [];
let editingPostId = "";
let editingPostLoaded = false;
let editingEvidence = [];
let removedEditingEvidenceIds = new Set();
let editingPostLoadController;
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
cameraPhotoPicker.addEventListener("change", (event) => {
  addFiles(event.target.files);
  cameraPhotoPicker.value = "";
});
cameraVideoPicker.addEventListener("change", (event) => {
  addFiles(event.target.files);
  cameraVideoPicker.value = "";
});
document.getElementById("capture-photo-button").addEventListener("click", () => cameraPhotoPicker.click());
document.getElementById("capture-video-button").addEventListener("click", () => cameraVideoPicker.click());
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
  document.getElementById("incident-time-label").innerHTML = incidentTimeRangeToggle.checked
    ? 'When did it start? <span class="optional">Optional</span>'
    : 'When did it happen? <span class="optional">Optional</span>';
  if (!incidentTimeRangeToggle.checked) incidentTimeEndInput.value = "";
});
function showReview() {
  const value = (id) => document.getElementById(id).value.trim();
  const selected = (id) =>
    document.getElementById(id).value
      ? document.getElementById(id).selectedOptions[0]?.textContent || "Not provided"
      : "Not provided";
  document.getElementById("review-experience-category").textContent = selected("experience-category");
  document.getElementById("review-incident-category").textContent = selected("incident-category");
  document.getElementById("review-place").textContent = value("place") || "Not provided";
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
  const endLabel = formatDate(end);
  document.getElementById("review-time").textContent = startLabel
    ? endLabel
      ? `${startLabel} – ${endLabel}`
      : startLabel
    : endLabel
      ? `Ended ${endLabel}`
      : "Not provided";
  document.getElementById("review-location-detail").textContent = value("location-detail") || "Not provided";
  document.getElementById("review-short-description").textContent = shortDescription.value.trim();
  document.getElementById("review-full-description").textContent =
    fullDescription.value.trim() || "Not provided";
  const audience = document.querySelector('input[name="visibility"]:checked')?.value || "public";
  document.getElementById("review-audience").textContent = {
    public: "Public in NFD · your name is shown",
    friends: "Friends only · visible to accepted NFD friends",
    anonymous: "Anonymous · your name and profile are hidden",
  }[audience];
  const retainedEditingEvidence = editingEvidence.filter((file) => !removedEditingEvidenceIds.has(file.id));
  const removedEditingEvidence = editingEvidence.filter((file) => removedEditingEvidenceIds.has(file.id));
  document.getElementById("review-file-count").textContent = editingPostId
    ? `${retainedEditingEvidence.length} kept · ${removedEditingEvidence.length} to remove`
    : selectedFiles.length
      ? `${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"} attached`
      : "No files attached";
  reviewFiles.innerHTML = "";
  retainedEditingEvidence.forEach((file) => {
    const item = document.createElement("div");
    item.className = "review-file-reference";
    const link = document.createElement("a");
    link.href = `/api/evidence/${encodeURIComponent(file.id)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = file.originalFilename;
    item.append(link);
    reviewFiles.append(item);
  });
  removedEditingEvidence.forEach((file) => {
    const item = document.createElement("div");
    item.className = "review-file-reference is-removing";
    item.textContent = `Will be removed: ${file.originalFilename}`;
    reviewFiles.append(item);
  });
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
  detailsProgressStep.classList.remove("active");
  detailsProgressStep.classList.add("done");
  reviewStep.classList.add("active");
  reviewNotice.classList.remove("show", "error");
  reviewNotice.replaceChildren();
  aiReviewConsentCheckbox.checked = false;
  document.getElementById("edit-experience").disabled = false;
  const confirmButton = document.getElementById("confirm-review");
  confirmButton.disabled = !editingPostLoaded && Boolean(editingPostId);
  confirmButton.textContent = editingPostId ? "Save changes" : "Share";
  void loadReviewModerationStatus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function validateStep(container) {
  for (const control of container.querySelectorAll("input, select, textarea")) {
    if (!control.disabled && !control.checkValidity()) {
      control.reportValidity();
      control.focus();
      return false;
    }
  }
  return true;
}
function showStoryFormStep(step) {
  activeStoryFormStep = step;
  const showDetails = step === "details";
  storyEntryStep.hidden = showDetails;
  experienceDetailsStep.hidden = !showDetails;
  storyStepFooter.hidden = showDetails;
  detailsStepFooter.hidden = !showDetails;
  formStepTitle.textContent = editingPostId
    ? "Edit your post"
    : showDetails
      ? "The who, where, and when"
      : "What happened?";
  formStepIntro.textContent = editingPostId
    ? "Update your post details. Existing attachments will stay on the post."
    : showDetails
      ? "Add the person, place, and timing so readers can understand the context."
      : "Good, bad, or complicated—share it in your own words. No need to make it sound like a press release.";
  formStepCount.lastChild.textContent = showDetails ? " Step 2 of 3" : " Step 1 of 3";
  experienceStep.classList.toggle("active", !showDetails);
  experienceStep.classList.toggle("done", showDetails);
  detailsProgressStep.classList.toggle("active", showDetails);
  detailsProgressStep.classList.remove("done");
  reviewStep.classList.remove("active", "done");
  window.scrollTo({ top: 0, behavior: "smooth" });
  formStepTitle.focus({ preventScroll: true });
}
document.getElementById("continue-to-details").addEventListener("click", () => {
  if (validateStep(storyEntryStep)) showStoryFormStep("details");
});
document.getElementById("back-to-story").addEventListener("click", () => showStoryFormStep("story"));
function updateIncidentCategoryOptions() {
  const options = incidentCategoriesByExperience[experienceCategoryInput.value] || [];
  incidentCategoryInput.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.selected = true;
  placeholder.textContent = options.length
    ? "Optional — choose an incident"
    : "Optional — choose an experience category first";
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
    : "Optional. Choose an experience category to see incident options.";
}
function backToEdit() {
  reviewPage.hidden = true;
  form.hidden = false;
  showStoryFormStep("details");
}
function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function renderEditingEvidence() {
  const section = document.getElementById("evidence-section");
  const retainedCount = editingEvidence.filter((file) => !removedEditingEvidenceIds.has(file.id)).length;
  const removedCount = editingEvidence.length - retainedCount;
  document.getElementById("evidence-heading").textContent = "Current attachments";
  section.querySelector(".section-hint").textContent = editingEvidence.length
    ? `${retainedCount} kept${removedCount ? ` · ${removedCount} marked to remove` : ""}`
    : "None";
  document.getElementById("upload-zone").hidden = true;
  document.getElementById("camera-photo").hidden = true;
  document.getElementById("camera-video").hidden = true;
  section.querySelector(".camera-actions").hidden = true;
  section.querySelector(":scope > .helper:not(#edit-attachments-note)").hidden = true;
  section.querySelector(".privacy-note").hidden = true;
  document.getElementById("file-list").hidden = true;
  const note = document.getElementById("edit-attachments-note");
  note.hidden = false;
  note.textContent = editingEvidence.length
    ? "Choose Remove beside an attachment. It will be deleted when you save changes."
    : "This post has no attachments. Attachments cannot be added while editing.";
  const list = document.getElementById("edit-evidence-list");
  list.replaceChildren();
  list.hidden = !editingEvidence.length;
  editingEvidence.forEach((file) => {
    const item = document.createElement("div");
    item.className = "file-item";
    const isRemoving = removedEditingEvidenceIds.has(file.id);
    if (isRemoving) item.classList.add("is-removing");
    const icon = document.createElement("span");
    icon.className = "file-thumb";
    icon.textContent = file.contentType?.startsWith("video/") ? "▶" : "▧";
    const meta = document.createElement("div");
    meta.className = "file-meta";
    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = file.originalFilename;
    const size = document.createElement("div");
    size.className = "file-size";
    size.textContent = prettySize(file.sizeBytes);
    meta.append(name, size);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "secondary-button edit-evidence-toggle";
    toggle.textContent = isRemoving ? "Keep" : "Remove";
    toggle.setAttribute("aria-pressed", String(isRemoving));
    toggle.setAttribute(
      "aria-label",
      `${isRemoving ? "Keep" : "Remove"} attachment ${file.originalFilename}`,
    );
    toggle.addEventListener("click", () => {
      if (removedEditingEvidenceIds.has(file.id)) removedEditingEvidenceIds.delete(file.id);
      else removedEditingEvidenceIds.add(file.id);
      renderEditingEvidence();
    });
    item.append(icon, meta, toggle);
    list.append(item);
  });
}
async function loadPostForEditing() {
  const intro = document.getElementById("form-step-intro");
  document.querySelector("#form-heading .eyebrow").textContent = "Edit your post";
  intro.textContent = "Loading your post…";
  const continueButton = document.getElementById("continue-to-details");
  const saveButton = document.getElementById("confirm-review");
  continueButton.disabled = true;
  saveButton.disabled = true;
  editingPostLoadController?.abort();
  const controller = new AbortController();
  editingPostLoadController = controller;
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15000);
  try {
    const response = await fetch(`/api/experiences/${encodeURIComponent(editingPostId)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This post could not be loaded for editing.");
    const experience = result.experience;
    if (!experience) throw new Error("This post could not be loaded for editing.");
    experienceCategoryInput.value =
      experience.experienceCategory === "Not provided" ? "" : experience.experienceCategory;
    updateIncidentCategoryOptions();
    incidentCategoryInput.value =
      experience.incidentCategory === "Not provided" ? "" : experience.incidentCategory;
    postPlaceInput.value = experience.place === "Not provided" ? "" : experience.place;
    document.getElementById("place-category").value =
      experience.placeCategory === "Not provided" ? "" : experience.placeCategory;
    const incidentTimeEndValue = toLocalDateTimeInput(experience.incidentTimeEnd);
    incidentTimeRangeToggle.checked = Boolean(incidentTimeEndValue);
    incidentTimeRangeToggle.dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("incident-time").value = toLocalDateTimeInput(experience.incidentTime);
    incidentTimeEndInput.value = incidentTimeEndValue;
    postLocationInput.value = experience.locationDetails || "";
    shortDescription.value = experience.shortDescription || "";
    fullDescription.value = experience.fullDescription || "";
    shortDescription.dispatchEvent(new Event("input", { bubbles: true }));
    fullDescription.dispatchEvent(new Event("input", { bubbles: true }));
    const audience = document.querySelector(`input[name="visibility"][value="${experience.visibility}"]`);
    if (audience) audience.checked = true;
    editingEvidence = experience.evidence || [];
    removedEditingEvidenceIds = new Set();
    renderEditingEvidence();
    document.querySelector("#form-heading .eyebrow").textContent = "Edit your post";
    document.title = "Edit post — NFD";
    editingPostLoaded = true;
    continueButton.disabled = false;
    saveButton.disabled = false;
    showStoryFormStep("story");
  } catch (error) {
    if (editingPostLoadController !== controller) return;
    const message = timedOut
      ? "This post is taking too long to load. Check your connection and try again."
      : error.message || "This post could not be loaded for editing.";
    intro.replaceChildren(document.createTextNode(`${message} `));
    const retryButton = document.createElement("button");
    retryButton.className = "secondary-button";
    retryButton.type = "button";
    retryButton.textContent = "Try again";
    retryButton.addEventListener("click", () => void loadPostForEditing(), { once: true });
    intro.append(retryButton);
    formStepTitle.textContent = "Couldn’t load this post";
    continueButton.disabled = true;
    saveButton.disabled = true;
    document.getElementById("confirm-review").disabled = true;
  } finally {
    window.clearTimeout(timeoutId);
    if (editingPostLoadController === controller) editingPostLoadController = undefined;
  }
}
function prettyDate(value, timeZone) {
  const date = new Date(value);
  if (!value) return "Not provided";
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
function experienceTimeText(experience) {
  const start = experience.incidentTime
    ? prettyDate(experience.incidentTime, experience.incidentTimeZone)
    : "";
  const end = experience.incidentTimeEnd
    ? prettyDate(experience.incidentTimeEnd, experience.incidentTimeZone)
    : "";
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return `Ended ${end}`;
  return "Not provided";
}
async function createFeedPreview(file) {
  if (file.type.startsWith("video/")) return createVideoFeedPreview(file);
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
async function createVideoFeedPreview(file) {
  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = objectUrl;
  try {
    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Video preview timed out")), 10000);
      const finish = (error) => {
        window.clearTimeout(timeout);
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("loadedmetadata", onMetadata);
        video.removeEventListener("error", onError);
        error ? reject(error) : resolve();
      };
      const onError = () => finish(new Error("Video preview could not be decoded"));
      const onSeeked = () => finish();
      const onMetadata = () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) {
          finish(new Error("Video duration is unavailable"));
          return;
        }
        video.addEventListener("seeked", onSeeked, { once: true });
        video.currentTime = Math.min(1, video.duration * 0.1);
      };
      video.addEventListener("loadedmetadata", onMetadata, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.load();
    });
    if (!video.videoWidth || !video.videoHeight) return null;
    const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const preview = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.78));
    return preview?.type === "image/webp" && preview.size <= 1024 * 1024 ? preview : null;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
function captureFirstVideoFrame(video) {
  if (
    video.dataset.posterCaptured ||
    video.error ||
    !video.paused ||
    !Number.isFinite(video.duration) ||
    video.duration <= 0
  )
    return;
  video.dataset.posterCaptured = "pending";
  const originalTime = video.currentTime;
  const frameTime = Math.min(1, video.duration * 0.1);
  const onSeeked = () => {
    if (!video.paused) {
      video.dataset.posterCaptured = "skipped";
      return;
    }
    try {
      if (!video.videoWidth || !video.videoHeight) return;
      const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const poster = canvas.toDataURL("image/webp", 0.78);
      if (poster.startsWith("data:image/webp")) video.poster = poster;
    } catch {
      // Keep the designed fallback poster if this browser cannot capture a frame.
    } finally {
      video.dataset.posterCaptured = "done";
      if (video.paused) video.currentTime = originalTime;
    }
  };
  video.addEventListener("seeked", onSeeked, { once: true });
  video.currentTime = frameTime;
}
const videoFallbackPoster =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540"><rect width="960" height="540" fill="#e9f1ec"/><circle cx="480" cy="250" r="66" fill="#0d7058"/><path d="M462 210v80l68-40z" fill="#fff"/><text x="480" y="390" text-anchor="middle" fill="#155b49" font-family="Arial,sans-serif" font-size="34" font-weight="700">Video story</text></svg>',
  );
const feedVideoPosterObserver =
  typeof IntersectionObserver === "function"
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const video = entry.target.querySelector("video");
            if (video) {
              if (video.dataset.previewPoster) {
                video.poster = video.dataset.previewPoster;
                delete video.dataset.previewPoster;
              }
              if (video.dataset.capturePreview === "true") {
                video.preload = "metadata";
                delete video.dataset.capturePreview;
              }
            }
            feedVideoPosterObserver.unobserve(entry.target);
          });
        },
        { rootMargin: "300px 0px" },
      )
    : null;
function addText(parent, tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value || "";
  parent.append(element);
  return element;
}
function fitIncidentBadge(badge) {
  badge.style.removeProperty("font-size");
  const initialSize = Number.parseFloat(getComputedStyle(badge).fontSize);
  if (!badge.clientWidth || !Number.isFinite(initialSize)) return;
  let fontSize = initialSize;
  while (badge.scrollWidth > badge.clientWidth + 1 && fontSize > 7) {
    fontSize = Math.max(7, fontSize - 0.25);
    badge.style.fontSize = `${fontSize}px`;
  }
}
function fitAllIncidentBadges() {
  feedList.querySelectorAll(".feed-incident").forEach(fitIncidentBadge);
}
window.addEventListener("resize", fitAllIncidentBadges);
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
let feedLoadedCount = 0;
let feedNextCursor = "";
function renderFeed(experiences, { append = false, nextCursor = "" } = {}) {
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
  const countLabel = filterActive ? "Matching stories" : "Stories in the feed";
  if (!experiences.length) {
    if (append) {
      feedLoadMore.hidden = true;
      feedResultCount.textContent = `${countLabel} · Showing ${feedLoadedCount}`;
      return;
    }
    feedResultCount.textContent = filterActive ? "No matching stories" : "No stories in the feed";
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
      label.textContent = "Drop your post";
      link.append(icon, label);
      empty.append(link);
    }
    feedList.append(empty);
    feedLoadMore.hidden = true;
    return;
  }
  experiences.forEach((experience, experienceIndex) => {
    const card = document.createElement("article");
    card.className = "feed-card";
    const main = document.createElement("div");
    main.className = "feed-card-main";
    const header = document.createElement("div");
    header.className = "feed-card-head";
    const titleGroup = document.createElement("div");
    titleGroup.className = "feed-title-group";
    addText(titleGroup, "h2", "feed-category", experience.shortDescription || experience.experienceCategory);
    addText(titleGroup, "span", "feed-experience-type", experience.experienceCategory || "Not provided");
    header.append(titleGroup);
    addText(header, "span", "feed-incident", experience.incidentCategory || "Not provided");
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
    const placeSummary = [experience.place, experience.placeCategory].filter(Boolean).join(" · ");
    place.append(document.createTextNode(placeSummary || "Not provided"));
    meta.append(place);
    if (experience.locationDetails) {
      const area = document.createElement("span");
      area.innerHTML = "<strong>Area</strong> ";
      area.append(document.createTextNode(experience.locationDetails));
      meta.append(area);
    }
    const occurred = document.createElement("span");
    occurred.innerHTML = "<strong>When</strong> ";
    occurred.append(document.createTextNode(experienceTimeText(experience)));
    meta.append(occurred);
    const shared = document.createElement("span");
    shared.innerHTML = "<strong>Shared</strong> ";
    shared.append(document.createTextNode(prettyDate(experience.createdAt)));
    meta.append(shared);
    main.append(meta);
    card.append(main);
    if (experience.isMine) {
      const actions = document.createElement("div");
      actions.className = "feed-owner-actions";
      const editLink = addText(actions, "a", "feed-edit-post", "Edit post");
      editLink.href = `/share?edit=${encodeURIComponent(experience.id)}`;
      card.append(actions);
    }
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
        image.alt = `Photo attached to ${experience.experienceCategory} experience`;
        image.loading = !append && experienceIndex === 0 && index === 0 ? "eager" : "lazy";
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
        const videoItem = document.createElement("div");
        videoItem.className = "feed-video-item";
        const video = document.createElement("video");
        video.className = "feed-video";
        video.controls = true;
        video.preload = "none";
        video.playsInline = true;
        video.title = file.originalFilename;
        video.addEventListener("loadedmetadata", () => {
          videoItem.classList.toggle("is-portrait", video.videoHeight > video.videoWidth);
        });
        video.poster = videoFallbackPoster;
        if (file.hasPreview) {
          video.dataset.previewPoster = `/api/evidence/${encodeURIComponent(file.id)}?variant=preview`;
          if (feedVideoPosterObserver) feedVideoPosterObserver.observe(videoItem);
          else {
            video.poster = video.dataset.previewPoster;
            delete video.dataset.previewPoster;
          }
        }
        video.src = `/api/evidence/${encodeURIComponent(file.id)}`;
        if (!file.hasPreview) {
          video.dataset.capturePreview = "true";
          if (feedVideoPosterObserver) feedVideoPosterObserver.observe(videoItem);
          else video.preload = "metadata";
          video.addEventListener("loadedmetadata", () => captureFirstVideoFrame(video), { once: true });
          if (video.readyState >= 1) captureFirstVideoFrame(video);
        }
        const playbackMessage = addText(
          gallery,
          "p",
          "feed-video-error",
          "This video could not be played. Its format or codec may not be supported by this browser.",
        );
        playbackMessage.hidden = true;
        playbackMessage.setAttribute("role", "status");
        video.addEventListener("error", () => {
          playbackMessage.hidden = false;
        });
        videoItem.append(video, playbackMessage);
        gallery.append(videoItem);
      });
      card.append(gallery);
    }
    const full = document.createElement("details");
    full.className = "feed-full";
    addText(full, "summary", "", "Read the full story");
    addText(full, "p", "", experience.fullDescription || "No additional details were provided.");
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
    fitIncidentBadge(card.querySelector(".feed-incident"));
  });
  feedLoadedCount += experiences.length;
  feedResultCount.textContent = `${countLabel} · Showing ${feedLoadedCount}${feedNextCursor ? "+" : ""}`;
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
  setProfilePhotoEverywhere(user.photoUrl || "", displayName);
  const identity = addText(profileSummary, "div", "profile-identity", "");
  addText(identity, "h2", "", displayName);
  if (user.provider === "ghost" && user.ghostHandle) {
    addText(identity, "p", "", `@${user.ghostHandle}`);
  }
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
  const profileParams = new URLSearchParams(location.search);
  const friendId = profileParams.get("friend");
  if (friendId) {
    profileOwnView.hidden = true;
    friendProfileView.hidden = false;
    await loadFriendProfile(friendId);
    return;
  }
  profileOwnView.hidden = false;
  friendProfileView.hidden = true;
  activateProfileTab(profileParams.get("tab") || "posts", false);
  if (profileParams.has("removed")) setFriendsFeedback("Friend removed.");
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
    if (profileParams.has("updated")) setProfileMessage("Your post was updated.");
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
}
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
openAgreementTabButton?.addEventListener("click", () => {
  activateTrustScoreTab("agreements");
  document.getElementById("trust-tab-agreements")?.focus();
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
      friend.provider === "ghost" ? `Ghost profile · @${friend.ghostHandle}` : "NFD friend",
    );
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
    friendProfileView.append(postsHeading, posts);
    document.title = `${friend.name || "Friend"} — NFD`;
  } catch (error) {
    friendProfileView.replaceChildren();
    const back = addText(friendProfileView, "a", "friend-profile-back", "← Back to friends");
    back.href = "/profile?tab=friends";
    const message = addText(friendProfileView, "p", "profile-error", error.message);
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
    messagesNavLink.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
  } catch {}
}
function personInitials(name) {
  return (
    (name || "NFD member")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "N"
  );
}
function renderStoryTray(result) {
  const own = result.own || null;
  myStoryButton.classList.toggle("has-unseen", Boolean(own?.stories?.some((story) => !story.viewed)));
  myStoryButton.classList.toggle("story-seen", Boolean(own));
  myStoryInitials.textContent = personInitials(own?.name || "NFD member").slice(0, 1);
  setAvatarPhoto(myStoryPhoto, own?.photoUrl || "", myStoryInitials);
  myStoryButton.setAttribute(
    "aria-label",
    own?.stories?.length
      ? `View your ${own.stories.length} active ${own.stories.length === 1 ? "story" : "stories"}`
      : "Add your first story",
  );
  storyFriends.replaceChildren();
  (result.friends || []).forEach((friend) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `story-bubble${friend.hasUnseen ? " has-unseen" : " story-seen"}`;
    button.setAttribute(
      "aria-label",
      `${friend.name}’s ${friend.stories.length} active ${friend.stories.length === 1 ? "story" : "stories"}`,
    );
    const avatar = document.createElement("span");
    avatar.className = "story-avatar";
    const initials = document.createElement("span");
    initials.textContent = personInitials(friend.name).slice(0, 1);
    if (friend.photoUrl) {
      const image = document.createElement("img");
      image.alt = "";
      setAvatarPhoto(image, friend.photoUrl, initials);
      avatar.append(image, initials);
    } else avatar.append(initials);
    addText(button, "span", "story-name", friend.name);
    button.prepend(avatar);
    button.addEventListener("click", () => openStoryViewer(friend.userId, 0));
    storyFriends.append(button);
  });
}
async function loadStories() {
  try {
    const activeUserId = currentStoryGroup()?.userId;
    const response = await fetch("/api/stories", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Stories could not be loaded.");
    if (result.enabled === false) {
      storyGroups = [];
      storiesTray.hidden = true;
      if (storyViewer.open) closeStoryViewer();
      renderStoryTray({ own: null, friends: [] });
      return;
    }
    storiesTray.hidden = false;
    storyGroups = [...(result.own ? [result.own] : []), ...(result.friends || [])];
    if (storyViewer.open && activeUserId) {
      activeStoryGroupIndex = storyGroups.findIndex((group) => group.userId === activeUserId);
      if (activeStoryGroupIndex < 0) closeStoryViewer();
      else
        activeStoryIndex = Math.min(activeStoryIndex, storyGroups[activeStoryGroupIndex].stories.length - 1);
    }
    renderStoryTray(result);
  } catch (error) {
    console.warn("NFD story tray could not be refreshed", error.message);
  }
}
function currentStoryGroup() {
  return storyGroups[activeStoryGroupIndex] || null;
}
function closeStoryViewer() {
  clearTimeout(storyAdvanceTimer);
  storyViewerStage.replaceChildren();
  if (storyViewer.open) storyViewer.close();
}
function showStoryAtCurrentIndex() {
  clearTimeout(storyAdvanceTimer);
  const group = currentStoryGroup();
  const story = group?.stories?.[activeStoryIndex];
  if (!group || !story) return closeStoryViewer();
  storyViewerName.textContent = group.name;
  storyViewerTime.textContent = new Date(story.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  storyViewerAvatar.replaceChildren();
  if (group.photoUrl) {
    const image = document.createElement("img");
    image.alt = "";
    image.src = group.photoUrl;
    image.onerror = () => {
      storyViewerAvatar.textContent = personInitials(group.name).slice(0, 1);
    };
    storyViewerAvatar.append(image);
  } else storyViewerAvatar.textContent = personInitials(group.name).slice(0, 1);
  storyViewerCaption.textContent = story.caption || "";
  storyViewerProgress.replaceChildren();
  group.stories.forEach((_, index) => {
    const segment = document.createElement("span");
    if (index <= activeStoryIndex) segment.classList.add("active");
    storyViewerProgress.append(segment);
  });
  storyViewerStage.replaceChildren();
  storyDeleteButton.hidden = !group.own;
  storySoundButton.hidden = !story.contentType.startsWith("video/");
  storySoundButton.textContent = "Turn sound on";
  storyPreviousButton.disabled = activeStoryGroupIndex === 0 && activeStoryIndex === 0;
  storyNextButton.textContent =
    activeStoryIndex < group.stories.length - 1 || activeStoryGroupIndex < storyGroups.length - 1
      ? "Next"
      : "Close";
  let media;
  if (story.contentType.startsWith("video/")) {
    media = document.createElement("video");
    media.autoplay = true;
    media.muted = true;
    media.playsInline = true;
    media.controls = true;
    media.addEventListener("ended", nextStory);
  } else {
    media = document.createElement("img");
    media.alt = `Story shared by ${group.name}`;
    storyAdvanceTimer = setTimeout(nextStory, 5000);
  }
  media.src = story.mediaUrl;
  storyViewerStage.append(media);
  if (!group.own && !story.viewed) {
    story.viewed = true;
    renderStoryTray({
      own: storyGroups.find((item) => item.own) || null,
      friends: storyGroups
        .filter((item) => !item.own)
        .map((item) => ({
          ...item,
          hasUnseen: item.stories.some((entry) => !entry.viewed),
        })),
    });
    void fetch(`/api/stories/${encodeURIComponent(story.id)}/view`, { method: "POST" });
  }
}
function openStoryViewer(userId, storyIndex = 0) {
  activeStoryGroupIndex = storyGroups.findIndex((group) => group.userId === userId);
  if (activeStoryGroupIndex < 0) return;
  activeStoryIndex = Math.max(0, Math.min(storyIndex, storyGroups[activeStoryGroupIndex].stories.length - 1));
  showStoryAtCurrentIndex();
  if (!storyViewer.open) storyViewer.showModal();
}
function nextStory() {
  clearTimeout(storyAdvanceTimer);
  const group = currentStoryGroup();
  if (!group) return closeStoryViewer();
  if (activeStoryIndex < group.stories.length - 1) activeStoryIndex++;
  else if (activeStoryGroupIndex < storyGroups.length - 1) {
    activeStoryGroupIndex++;
    activeStoryIndex = 0;
  } else return closeStoryViewer();
  showStoryAtCurrentIndex();
}
function previousStory() {
  clearTimeout(storyAdvanceTimer);
  if (activeStoryIndex > 0) activeStoryIndex--;
  else if (activeStoryGroupIndex > 0) {
    activeStoryGroupIndex--;
    activeStoryIndex = storyGroups[activeStoryGroupIndex].stories.length - 1;
  } else return;
  showStoryAtCurrentIndex();
}
function openStoryComposer() {
  storyComposeFeedback.textContent = "";
  storyForm.reset();
  storyShareButton.disabled = true;
  selectedStoryFile = null;
  storyMediaPreview.replaceChildren();
  storyMediaPreview.hidden = true;
  if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
  storyPreviewUrl = "";
  storyComposer.showModal();
}
function previewStoryFile(file) {
  selectedStoryFile = file || null;
  storyComposeFeedback.textContent = "";
  storyMediaPreview.replaceChildren();
  storyMediaPreview.hidden = !file;
  storyShareButton.disabled = !file;
  if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
  storyPreviewUrl = "";
  if (!file) return;
  if (file.size > 25 * 1024 * 1024 || !(file.type.startsWith("image/") || file.type.startsWith("video/"))) {
    storyComposeFeedback.textContent = "Choose one image or video no larger than 25 MB.";
    storyShareButton.disabled = true;
    selectedStoryFile = null;
    storyMediaPreview.hidden = true;
    return;
  }
  storyPreviewUrl = URL.createObjectURL(file);
  const media = document.createElement(file.type.startsWith("video/") ? "video" : "img");
  media.src = storyPreviewUrl;
  if (media instanceof HTMLVideoElement) {
    media.controls = true;
    media.muted = true;
    media.playsInline = true;
  } else media.alt = "Preview of your story";
  storyMediaPreview.append(media);
}
myStoryButton.addEventListener("click", () => {
  const own = storyGroups.find((group) => group.own);
  if (own?.stories.length) openStoryViewer(own.userId, 0);
  else openStoryComposer();
});
storyCreateButton.addEventListener("click", openStoryComposer);
storyMediaFile.addEventListener("change", () => previewStoryFile(storyMediaFile.files?.[0]));
storyCameraFile.addEventListener("change", () => previewStoryFile(storyCameraFile.files?.[0]));
document.getElementById("story-camera-button").addEventListener("click", () => storyCameraFile.click());
storyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedStoryFile) return;
  storyShareButton.disabled = true;
  storyComposeFeedback.textContent = "Sharing your story…";
  const body = new FormData();
  body.append("media", selectedStoryFile, selectedStoryFile.name);
  body.append("caption", storyCaption.value.trim());
  try {
    const response = await fetch("/api/stories", { method: "POST", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your story could not be shared.");
    if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
    storyPreviewUrl = "";
    storyComposer.close();
    await loadStories();
    const own = storyGroups.find((group) => group.own);
    if (own?.stories.length) openStoryViewer(own.userId, own.stories.length - 1);
  } catch (error) {
    storyComposeFeedback.textContent = error.message;
    storyShareButton.disabled = false;
  }
});
document.querySelectorAll("[data-close-story-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    if (storyComposer.open) storyComposer.close();
    if (storyViewer.open) closeStoryViewer();
  });
});
storyComposer.addEventListener("close", () => {
  if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
  storyPreviewUrl = "";
});
storyViewer.addEventListener("close", () => {
  clearTimeout(storyAdvanceTimer);
  storyViewerStage.replaceChildren();
});
storyNextButton.addEventListener("click", nextStory);
storyPreviousButton.addEventListener("click", previousStory);
storySoundButton.addEventListener("click", () => {
  const video = storyViewerStage.querySelector("video");
  if (!video) return;
  video.muted = !video.muted;
  storySoundButton.textContent = video.muted ? "Turn sound on" : "Mute sound";
});
storyDeleteButton.addEventListener("click", async () => {
  const story = currentStoryGroup()?.stories?.[activeStoryIndex];
  if (!story || !window.confirm("Delete this story now? It will disappear for your friends too.")) return;
  storyDeleteButton.disabled = true;
  try {
    const response = await fetch(`/api/stories/${encodeURIComponent(story.id)}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "The story could not be deleted.");
    await loadStories();
    const own = storyGroups.find((group) => group.own);
    if (own?.stories.length) openStoryViewer(own.userId, Math.min(activeStoryIndex, own.stories.length - 1));
    else closeStoryViewer();
  } catch (error) {
    storyViewerCaption.textContent = error.message;
  } finally {
    storyDeleteButton.disabled = false;
  }
});
profilePhotoFile.addEventListener("change", () => {
  const file = profilePhotoFile.files?.[0];
  profilePhotoFeedback.textContent = "";
  profilePhotoSave.disabled = !file;
});
profilePhotoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = profilePhotoFile.files?.[0];
  if (!file) return;
  profilePhotoSave.disabled = true;
  profilePhotoFeedback.textContent = "Saving photo…";
  const body = new FormData();
  body.append("photo", file, file.name);
  try {
    const response = await fetch("/api/profile/photo", { method: "PUT", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your profile photo could not be saved.");
    setProfilePhotoEverywhere(
      result.photoUrl,
      profileSummary.querySelector(".profile-identity h2")?.textContent,
    );
    profilePhotoFeedback.textContent = "Profile photo updated.";
    profilePhotoFile.value = "";
    await loadStories();
  } catch (error) {
    profilePhotoFeedback.textContent = error.message;
    profilePhotoSave.disabled = false;
  }
});
profilePhotoRemove.addEventListener("click", async () => {
  profilePhotoRemove.disabled = true;
  profilePhotoFeedback.textContent = "Removing photo…";
  try {
    const response = await fetch("/api/profile/photo", { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your profile photo could not be removed.");
    setProfilePhotoEverywhere("", profileSummary.querySelector(".profile-identity h2")?.textContent);
    profilePhotoFeedback.textContent = "Profile photo removed.";
    await loadStories();
  } catch (error) {
    profilePhotoFeedback.textContent = error.message;
  } finally {
    profilePhotoRemove.disabled = false;
  }
});
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
let feedAbortController;
let postPlaceSuggestionTimer;
let postPlaceSuggestionRequest = 0;
let postPlaceSuggestionAbort;
let postLocationSuggestionTimer;
let postLocationSuggestionAbort;
let postLocationSuggestionRequest = 0;
let activeLocationSuggestionIndex = -1;
const postPlaceValues = [];
const postLocationValues = [];
const photonSuggestionCache = new Map();
function updateSuggestions(list, values) {
  list.replaceChildren();
  [...new Set((values || []).filter(Boolean))].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    list.append(option);
  });
}
function rememberFeedSuggestions(list, values, { append = false } = {}) {
  const previous = append ? [...list.options].map((option) => option.value) : [];
  updateSuggestions(list, [...previous, ...(values || [])].slice(0, 100));
}
function updatePostAutocomplete(list, suggestions) {
  if (!list) return;
  const seen = new Set();
  list.replaceChildren();
  for (const suggestion of suggestions) {
    const value = typeof suggestion === "string" ? suggestion.trim() : suggestion?.value?.trim();
    if (!value || seen.has(value.toLocaleLowerCase())) continue;
    seen.add(value.toLocaleLowerCase());
    const option = document.createElement("option");
    option.value = value;
    if (suggestion?.label) option.label = suggestion.label;
    list.append(option);
    if (seen.size >= 60) break;
  }
}
async function loadPostFieldSuggestions() {
  try {
    const response = await fetch("/api/experiences", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return;
    const result = await response.json().catch(() => ({}));
    for (const experience of result.experiences || []) {
      if (experience.place) postPlaceValues.push(experience.place);
      if (experience.locationDetails) postLocationValues.push(experience.locationDetails);
    }
    updatePostAutocomplete(postPlaceSuggestions, postPlaceValues);
  } catch {
    // Suggestions are optional; users can always enter the value themselves.
  }
}
function schedulePostPlaceSuggestions() {
  clearTimeout(postPlaceSuggestionTimer);
  postPlaceSuggestionAbort?.abort();
  const requestNumber = ++postPlaceSuggestionRequest;
  const query = postPlaceInput?.value.trim() || "";
  if (query.length < 2) {
    updatePostAutocomplete(postPlaceSuggestions, postPlaceValues);
    return;
  }
  postPlaceSuggestionTimer = setTimeout(async () => {
    const controller = new AbortController();
    postPlaceSuggestionAbort = controller;
    try {
      const response = await fetch(`/api/people/suggestions?q=${encodeURIComponent(query)}`, {
        headers: { accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return;
      if (requestNumber !== postPlaceSuggestionRequest) return;
      updatePostAutocomplete(postPlaceSuggestions, [
        ...postPlaceValues.map((value) => ({ value, label: "From stories you can view" })),
        ...(result.suggestions || []),
      ]);
    } catch (error) {
      if (error?.name !== "AbortError") updatePostAutocomplete(postPlaceSuggestions, postPlaceValues);
    }
  }, 280);
}
function schedulePostLocationSuggestions() {
  clearTimeout(postLocationSuggestionTimer);
  postLocationSuggestionAbort?.abort();
  const requestNumber = ++postLocationSuggestionRequest;
  const query = postLocationInput?.value.trim() || "";
  if (query.length < 3 || /^(https?:\/\/|www\.)/i.test(query)) {
    hidePostLocationSuggestions();
    return;
  }
  const cacheKey = query.toLocaleLowerCase();
  if (photonSuggestionCache.has(cacheKey)) {
    renderPostLocationSuggestions(photonSuggestionCache.get(cacheKey), query);
    return;
  }
  renderPostLocationSuggestionStatus("Searching worldwide places…", "loading");
  postLocationSuggestionTimer = setTimeout(async () => {
    const controller = new AbortController();
    postLocationSuggestionAbort = controller;
    try {
      const params = new URLSearchParams({ q: query, limit: "8", lang: "en" });
      const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
        headers: { accept: "application/json" },
        credentials: "omit",
        mode: "cors",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Place suggestions unavailable");
      const result = await response.json();
      if (
        requestNumber !== postLocationSuggestionRequest ||
        postLocationInput?.value.trim().toLocaleLowerCase() !== cacheKey
      )
        return;
      const places = (result.features || [])
        .map(({ properties = {} }) => {
          const name =
            properties.name || [properties.housenumber, properties.street].filter(Boolean).join(" ");
          const details = [
            properties.street && properties.street !== name ? properties.street : "",
            properties.city || properties.locality || properties.district || properties.county,
            properties.state,
            properties.country,
            properties.postcode,
          ]
            .filter(Boolean)
            .filter(
              (part, index, parts) =>
                parts.findIndex((candidate) => candidate.toLocaleLowerCase() === part.toLocaleLowerCase()) ===
                  index && part.toLocaleLowerCase() !== name.toLocaleLowerCase(),
            );
          const value = [name, ...details].filter(Boolean).join(", ");
          if (!value) return null;
          return {
            id: `${properties.osm_type || properties.type || "place"}-${properties.osm_id || value}`,
            name: name || value,
            details,
            value,
            type: locationTypeLabel(properties),
          };
        })
        .filter(Boolean);
      photonSuggestionCache.set(cacheKey, places);
      renderPostLocationSuggestions(places, query);
    } catch (error) {
      if (error?.name !== "AbortError" && requestNumber === postLocationSuggestionRequest) {
        renderPostLocationSuggestionStatus(
          "Place search is unavailable right now. You can still enter a location.",
          "error",
        );
      }
    }
  }, 350);
}
function locationTypeLabel(properties) {
  const type = properties.osm_value || properties.type || properties.osm_key || "place";
  return type
    .split(/[ _-]+/)
    .filter(Boolean)
    .map((part) => part[0].toLocaleUpperCase() + part.slice(1))
    .join(" ");
}
function hidePostLocationSuggestions() {
  if (!postLocationSuggestions || !postLocationInput) return;
  postLocationSuggestions.hidden = true;
  postLocationSuggestions.replaceChildren();
  postLocationInput.setAttribute("aria-expanded", "false");
  postLocationInput.removeAttribute("aria-activedescendant");
  activeLocationSuggestionIndex = -1;
}
function renderPostLocationSuggestionStatus(message, state) {
  if (!postLocationSuggestions || !postLocationInput) return;
  postLocationSuggestions.replaceChildren();
  const status = document.createElement("div");
  status.className = `location-suggestion-status ${state}`;
  status.setAttribute("role", "status");
  status.textContent = message;
  postLocationSuggestions.append(status);
  postLocationSuggestions.hidden = false;
  postLocationInput.setAttribute("aria-expanded", "true");
  postLocationInput.removeAttribute("aria-activedescendant");
  activeLocationSuggestionIndex = -1;
}
function renderPostLocationSuggestions(places, query) {
  if (!postLocationSuggestions || !postLocationInput) return;
  postLocationSuggestions.replaceChildren();
  const heading = document.createElement("div");
  heading.className = "location-suggestions-heading";
  heading.textContent = "WORLDWIDE PLACES";
  postLocationSuggestions.append(heading);
  const visiblePlaces = places.slice(0, 8);
  if (!visiblePlaces.length) {
    const status = document.createElement("div");
    status.className = "location-suggestion-status";
    status.textContent = `No worldwide matches for “${query}”. Try a city, venue, street, or business name.`;
    postLocationSuggestions.append(status);
  }
  visiblePlaces.forEach((place, index) => {
    const option = document.createElement("div");
    option.className = "location-suggestion-option";
    option.id = `location-suggestion-${index}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.dataset.locationValue = place.value;
    const icon = document.createElement("span");
    icon.className = "location-suggestion-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none"><path d="M19 10.2c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.3" stroke="currentColor" stroke-width="1.7"/></svg>';
    const copy = document.createElement("span");
    copy.className = "location-suggestion-copy";
    const name = document.createElement("strong");
    name.textContent = place.name;
    const details = document.createElement("small");
    details.textContent = place.details.join(", ") || "Worldwide place";
    copy.append(name, details);
    const type = document.createElement("span");
    type.className = "location-suggestion-type";
    type.textContent = place.type;
    option.append(icon, copy, type);
    option.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      choosePostLocationSuggestion(place);
    });
    postLocationSuggestions.append(option);
  });
  if (postLocationValues.length) {
    const matchingNfdValues = [...new Set(postLocationValues)]
      .filter((value) => value.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
      .slice(0, 3);
    if (matchingNfdValues.length) {
      const divider = document.createElement("div");
      divider.className = "location-suggestions-heading secondary";
      divider.textContent = "ALSO USED IN NFD STORIES";
      postLocationSuggestions.append(divider);
      matchingNfdValues.forEach((value, index) => {
        const place = { id: `nfd-location-${index}`, name: value, details: [], value, type: "NFD" };
        const option = document.createElement("div");
        option.className = "location-suggestion-option";
        option.id = `location-suggestion-nfd-${index}`;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.dataset.locationValue = place.value;
        const icon = document.createElement("span");
        icon.className = "location-suggestion-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "N";
        const copy = document.createElement("span");
        copy.className = "location-suggestion-copy";
        const name = document.createElement("strong");
        name.textContent = value;
        const details = document.createElement("small");
        details.textContent = "Used in a story visible to you";
        copy.append(name, details);
        const type = document.createElement("span");
        type.className = "location-suggestion-type";
        type.textContent = "NFD";
        option.append(icon, copy, type);
        option.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          choosePostLocationSuggestion(place);
        });
        postLocationSuggestions.append(option);
      });
    }
  }
  postLocationSuggestions.hidden = false;
  postLocationInput.setAttribute("aria-expanded", "true");
  postLocationInput.removeAttribute("aria-activedescendant");
  activeLocationSuggestionIndex = -1;
}
function choosePostLocationSuggestion(place) {
  postLocationInput.value = place.value;
  hidePostLocationSuggestions();
}
function movePostLocationSuggestion(direction) {
  const options = [...(postLocationSuggestions?.querySelectorAll('[role="option"]') || [])];
  if (!options.length) return false;
  activeLocationSuggestionIndex =
    activeLocationSuggestionIndex < 0
      ? direction > 0
        ? 0
        : options.length - 1
      : Math.max(0, Math.min(options.length - 1, activeLocationSuggestionIndex + direction));
  options.forEach((option, index) => {
    const active = index === activeLocationSuggestionIndex;
    option.classList.toggle("active", active);
    option.setAttribute("aria-selected", String(active));
  });
  const active = options[activeLocationSuggestionIndex];
  postLocationInput.setAttribute("aria-activedescendant", active.id);
  active.scrollIntoView({ block: "nearest" });
  return true;
}
function selectActivePostLocationSuggestion() {
  const options = postLocationSuggestions?.querySelectorAll('[role="option"]');
  const active = options?.[activeLocationSuggestionIndex];
  if (!active) return false;
  postLocationInput.value = active.dataset.locationValue || "";
  hidePostLocationSuggestions();
  return true;
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
function updateFeedTaxonomyFilters() {
  const experienceCategories = Object.keys(incidentCategoriesByExperience);
  const incidentCategories = [...new Set(Object.values(incidentCategoriesByExperience).flat())].sort((a, b) =>
    a.localeCompare(b),
  );
  const placeCategories = [...document.getElementById("place-category").options]
    .map((option) => option.value.trim())
    .filter(Boolean);
  updateSelectOptions(feedExperienceCategory, experienceCategories, "Any experience type");
  updateSelectOptions(feedIncidentCategory, incidentCategories, "Any incident type");
  updateSelectOptions(feedPlaceCategory, placeCategories, "Any place type");
}
updateFeedTaxonomyFilters();
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
  feedAbortController?.abort();
  const controller = new AbortController();
  feedAbortController = controller;
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
    let result;
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      const attemptController = new AbortController();
      const abortAttempt = () => attemptController.abort();
      controller.signal.addEventListener("abort", abortAttempt, { once: true });
      const timeoutId = setTimeout(abortAttempt, 10000);
      try {
        const response = await fetch(`/api/experiences${params.size ? `?${params}` : ""}`, {
          headers: { accept: "application/json" },
          cache: "no-store",
          signal: attemptController.signal,
        });
        const payload = await response.json().catch(() => null);
        if (requestNumber !== feedRequestNumber || controller.signal.aborted) return;
        if (response.ok && payload && typeof payload === "object") {
          result = payload;
          break;
        }
        lastError = new Error(
          payload?.error || "The feed service is temporarily unavailable. Try again in a moment.",
        );
        if (attempt === 0 && (response.status >= 500 || !payload)) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        throw lastError;
      } catch (error) {
        if (requestNumber !== feedRequestNumber || controller.signal.aborted) return;
        const timedOut = error?.name === "AbortError";
        lastError = timedOut ? new Error("The feed request timed out. Try again in a moment.") : error;
        if (attempt === 0 && (error instanceof TypeError || timedOut)) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        throw lastError;
      } finally {
        clearTimeout(timeoutId);
        controller.signal.removeEventListener("abort", abortAttempt);
      }
    }
    if (!result)
      throw lastError || new Error("The feed service is temporarily unavailable. Try again in a moment.");
    const experiences = result.experiences || [];
    rememberFeedSuggestions(
      feedPlaceSuggestions,
      experiences.map((experience) => experience.place),
      { append },
    );
    rememberFeedSuggestions(
      feedLocationSuggestions,
      experiences.map((experience) => experience.locationDetails),
      { append },
    );
    updateFeedTaxonomyFilters();
    updateFeedFilterToggle();
    renderFeed(experiences, { append, nextCursor: result.nextCursor || "" });
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
      const errorBox = addText(
        feedList,
        "div",
        "feed-error",
        error instanceof TypeError
          ? "The feed could not connect. Check your connection and try again."
          : error.message,
      );
      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.className = "secondary-button";
      retryButton.textContent = "Try again";
      retryButton.addEventListener("click", () => void loadFeed());
      errorBox.append(retryButton);
    }
  } finally {
    if (feedAbortController === controller) feedAbortController = null;
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
  activateTrustScoreTab(new URLSearchParams(location.search).get("tab"), false);
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
  const editId = new URLSearchParams(location.search).get("edit");
  if (editId) {
    editingPostId = editId;
    void loadPostForEditing();
  } else {
    loadFriendCount();
    void loadPostFieldSuggestions();
  }
  postPlaceInput?.addEventListener("input", schedulePostPlaceSuggestions);
  postLocationInput?.addEventListener("input", schedulePostLocationSuggestions);
  postLocationInput?.addEventListener("focus", schedulePostLocationSuggestions);
  postLocationInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (movePostLocationSuggestion(event.key === "ArrowDown" ? 1 : -1)) event.preventDefault();
    } else if (event.key === "Enter" && selectActivePostLocationSuggestion()) {
      event.preventDefault();
    } else if (event.key === "Escape") {
      hidePostLocationSuggestions();
    }
  });
  postLocationInput?.addEventListener("blur", () => {
    setTimeout(hidePostLocationSuggestions, 120);
  });
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (activeStoryFormStep === "story") {
    if (validateStep(storyEntryStep)) showStoryFormStep("details");
    return;
  }
  if (validateStep(experienceDetailsStep)) showReview();
});
document.getElementById("edit-experience").addEventListener("click", backToEdit);
agreementDescription?.addEventListener("input", () => {
  agreementDescriptionCount.textContent = `${agreementDescription.value.length} / 3000`;
});
const selectedAgreementPeople = new Map();
let agreementPeopleSearchTimer;
let agreementPeopleSearchController;

function renderSelectedAgreementPeople() {
  if (!agreementSelectedPeople) return;
  agreementSelectedPeople.replaceChildren();
  for (const [userId, person] of selectedAgreementPeople) {
    const chip = document.createElement("span");
    chip.className = "agreement-selected-person";
    const name = document.createElement("span");
    name.textContent = person.handle ? `${person.name} · Ghost @${person.handle}` : person.name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${person.name} from approvers`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      selectedAgreementPeople.delete(userId);
      for (const checkbox of agreementFriendsList?.querySelectorAll('input[name="agreement-participant"]') ||
        []) {
        if (checkbox.value === userId) checkbox.checked = false;
      }
      renderSelectedAgreementPeople();
    });
    chip.append(name, remove);
    agreementSelectedPeople.append(chip);
  }
}

function renderAgreementPeopleResults(people) {
  if (!agreementFriendsList) return;
  agreementFriendsList.replaceChildren();
  if (!people.length) {
    const empty = document.createElement("p");
    empty.className = "agreement-friends-status";
    empty.textContent =
      agreementPeopleSearch?.value.trim().length >= 2
        ? "No active NFD members matched that search."
        : "Search for an NFD member to add an approver.";
    agreementFriendsList.append(empty);
    return;
  }
  for (const person of people) {
    if (!person?.userId) continue;
    const label = document.createElement("label");
    label.className = "agreement-friend-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "agreement-participant";
    checkbox.value = person.userId;
    checkbox.checked = selectedAgreementPeople.has(person.userId);
    const name = document.createElement("span");
    name.textContent = person.handle
      ? `${person.name} · Ghost @${person.handle}`
      : person.name || "NFD member";
    label.append(checkbox, name);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (selectedAgreementPeople.size >= 19) {
          checkbox.checked = false;
          if (agreementPeopleSearchStatus)
            agreementPeopleSearchStatus.textContent = "You can choose up to 19 approvers.";
          return;
        }
        selectedAgreementPeople.set(person.userId, {
          name: person.name || "NFD member",
          handle: person.handle || "",
        });
      } else selectedAgreementPeople.delete(person.userId);
      if (agreementPeopleSearchStatus) agreementPeopleSearchStatus.textContent = "";
      renderSelectedAgreementPeople();
    });
    agreementFriendsList.append(label);
  }
}

async function searchAgreementPeople() {
  if (!agreementFriendsList || !agreementPeopleSearch) return;
  const query = agreementPeopleSearch.value.trim();
  if (agreementPeopleSearchController) agreementPeopleSearchController.abort();
  if (query.length < 2) {
    renderAgreementPeopleResults([]);
    if (agreementPeopleSearchStatus) agreementPeopleSearchStatus.textContent = "";
    return;
  }
  agreementPeopleSearchController = new AbortController();
  agreementFriendsList.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "agreement-friends-status";
  loading.textContent = "Searching NFD members…";
  agreementFriendsList.append(loading);
  try {
    const response = await fetch(`/api/trust-score/agreement-people?q=${encodeURIComponent(query)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: agreementPeopleSearchController.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "NFD members could not be searched.");
    if (agreementPeopleSearch.value.trim() !== query) return;
    renderAgreementPeopleResults(Array.isArray(result.people) ? result.people : []);
    if (agreementPeopleSearchStatus) agreementPeopleSearchStatus.textContent = "";
  } catch (error) {
    if (error.name === "AbortError") return;
    agreementFriendsList.replaceChildren();
    const failure = document.createElement("p");
    failure.className = "agreement-friends-status error";
    failure.textContent = error.message || "NFD members could not be searched right now.";
    agreementFriendsList.append(failure);
  }
}

function resetAgreementApprovers() {
  selectedAgreementPeople.clear();
  if (agreementPeopleSearch) agreementPeopleSearch.value = "";
  if (agreementPeopleSearchStatus) agreementPeopleSearchStatus.textContent = "";
  renderSelectedAgreementPeople();
  renderAgreementPeopleResults([]);
}

agreementPeopleSearch?.addEventListener("input", () => {
  clearTimeout(agreementPeopleSearchTimer);
  agreementPeopleSearchTimer = setTimeout(searchAgreementPeople, 180);
});

function agreementStatusLabel(status) {
  return status === "active"
    ? "Approved by everyone"
    : status === "declined"
      ? "Declined"
      : "Waiting for approval";
}

const outcomeLabels = {
  completed: "Completed",
  partially_completed: "Partially completed",
  delayed: "Delayed",
  not_completed: "Not completed",
};

const outcomeStatusLabels = {
  awaiting: "Awaiting responses",
  confirmed: "Confirmed by all other participants",
  disputed: "Disagreement recorded",
};

async function submitAgreementOutcome(agreementId, form, button) {
  const feedback = form.querySelector("[data-outcome-feedback]");
  const select = form.querySelector("select");
  const note = form.querySelector("textarea");
  button.disabled = true;
  try {
    const response = await fetch(`/api/trust-score/agreements/${encodeURIComponent(agreementId)}/outcome`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome: select.value, note: note.value }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "The outcome could not be saved.");
    await loadStoredAgreements();
  } catch (error) {
    feedback.textContent = error.message || "The outcome could not be saved.";
    feedback.classList.add("error");
    button.disabled = false;
  }
}

async function submitAgreementOutcomeResponse(agreementId, outcomeId, decision, form, button) {
  const feedback = form.querySelector("[data-outcome-feedback]");
  const note = form.querySelector("textarea");
  button.disabled = true;
  try {
    const response = await fetch(
      `/api/trust-score/agreements/${encodeURIComponent(agreementId)}/outcome-response`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcomeId, decision, note: note.value }),
      },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your response could not be saved.");
    await loadStoredAgreements();
  } catch (error) {
    feedback.textContent = error.message || "Your response could not be saved.";
    feedback.classList.add("error");
    button.disabled = false;
  }
}

function renderAgreementOutcome(agreement, outcome) {
  const section = document.createElement("section");
  section.className = `agreement-outcome agreement-outcome-${outcome.status}`;
  const heading = document.createElement("div");
  heading.className = "agreement-outcome-heading";
  const title = document.createElement("h4");
  title.textContent = `${outcomeLabels[outcome.result] || "Reported outcome"} · ${outcomeStatusLabels[outcome.status] || "In review"}`;
  heading.append(title);
  section.append(heading);
  if (outcome.note) {
    const note = document.createElement("p");
    note.className = "agreement-outcome-note";
    note.textContent = outcome.note;
    section.append(note);
  }
  const responses = outcome.responses || [];
  const disputedResponses = responses.filter((response) => response.decision === "dispute");
  const responseSummary = document.createElement("p");
  responseSummary.className = "agreement-outcome-response-summary";
  if (outcome.status === "disputed") {
    responseSummary.textContent = `Disagreement recorded by ${disputedResponses.length} participant${disputedResponses.length === 1 ? "" : "s"}. This is a disputed report, not a verified finding.`;
  } else if (outcome.status === "confirmed") {
    responseSummary.textContent = "Every other participant confirmed this outcome.";
  } else {
    responseSummary.textContent = `${responses.length} of ${Math.max(0, agreement.participants.length - 1)} participant responses received.`;
  }
  section.append(responseSummary);
  if (responses.length) {
    const responseList = document.createElement("ul");
    responseList.className = "agreement-outcome-response-list";
    for (const response of responses) {
      const item = document.createElement("li");
      const decisionLabel = response.decision === "dispute" ? "disagrees" : "confirms";
      item.textContent = `${response.name} ${decisionLabel}${response.note ? `: ${response.note}` : ""}`;
      responseList.append(item);
    }
    section.append(responseList);
  }
  const myResponse = responses.find((response) => response.userId === currentUserId);
  const mayRespond =
    agreement.status === "active" &&
    outcome.status !== "confirmed" &&
    outcome.reportedBy !== currentUserId &&
    !myResponse &&
    agreement.myStatus === "accepted";
  if (mayRespond) {
    const form = document.createElement("form");
    form.className = "agreement-outcome-response-form";
    const label = document.createElement("label");
    label.textContent = "Your response";
    const note = document.createElement("textarea");
    note.className = "control";
    note.rows = 2;
    note.maxLength = 2000;
    note.placeholder = "Optional to confirm; required to disagree";
    label.append(note);
    const actions = document.createElement("div");
    actions.className = "agreement-actions";
    for (const [decision, text, className] of [
      ["confirm", "Confirm", "submit"],
      ["dispute", "Disagree", "secondary-button"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = text;
      button.addEventListener("click", () =>
        submitAgreementOutcomeResponse(agreement.id, outcome.id, decision, form, button),
      );
      actions.append(button);
    }
    const feedback = document.createElement("p");
    feedback.dataset.outcomeFeedback = "";
    feedback.className = "agreement-feedback";
    form.append(label, actions, feedback);
    section.append(form);
  }
  return section;
}

async function sendAgreementResponse(agreementId, decision, button) {
  button.disabled = true;
  try {
    const response = await fetch(`/api/trust-score/agreements/${encodeURIComponent(agreementId)}/respond`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your response could not be saved.");
    if (myAgreementsFeedback)
      myAgreementsFeedback.textContent = decision === "accept" ? "Approval saved." : "Agreement declined.";
    await loadStoredAgreements();
  } catch (error) {
    if (myAgreementsFeedback) {
      myAgreementsFeedback.textContent = error.message || "Your response could not be saved.";
      myAgreementsFeedback.classList.add("error");
    }
    button.disabled = false;
  }
}

function renderStoredAgreement(agreement) {
  const card = document.createElement("article");
  card.className = "stored-agreement-card";
  const heading = document.createElement("div");
  heading.className = "stored-agreement-heading";
  const title = document.createElement("h3");
  title.textContent = agreement.title || "Agreement";
  const badge = document.createElement("span");
  badge.className = `agreement-status-badge status-${agreement.status}`;
  badge.textContent = agreementStatusLabel(agreement.status);
  heading.append(title, badge);
  const version = document.createElement("p");
  version.className = "stored-agreement-version";
  version.textContent = `Version ${agreement.currentVersion} · ${agreement.role === "creator" ? "Created by you" : "Shared with you"}`;
  const people = document.createElement("p");
  people.className = "stored-agreement-people";
  people.textContent = (agreement.participants || [])
    .map(
      (participant) =>
        `${participant.name}: ${participant.status === "accepted" && participant.acceptedVersion === agreement.currentVersion ? "approved" : participant.status === "declined" ? "declined" : "awaiting approval"}`,
    )
    .join(" · ");
  const disclosure = document.createElement("details");
  disclosure.className = "stored-agreement-text";
  const summary = document.createElement("summary");
  summary.textContent = "Review agreement text";
  const agreementText = document.createElement("pre");
  agreementText.textContent = agreement.body || "";
  disclosure.append(summary, agreementText);
  card.append(heading, version, people, disclosure);

  const outcomes = agreement.outcomes || [];
  for (const outcome of outcomes) card.append(renderAgreementOutcome(agreement, outcome));

  if (agreement.status === "pending" && agreement.myStatus === "pending") {
    const actions = document.createElement("div");
    actions.className = "agreement-actions";
    const approve = document.createElement("button");
    approve.className = "submit";
    approve.type = "button";
    approve.textContent = "Approve this version";
    approve.addEventListener("click", () => sendAgreementResponse(agreement.id, "accept", approve));
    const decline = document.createElement("button");
    decline.className = "secondary-button";
    decline.type = "button";
    decline.textContent = "Decline";
    decline.addEventListener("click", () => sendAgreementResponse(agreement.id, "decline", decline));
    actions.append(approve, decline);
    card.append(actions);
  }

  if (agreement.status === "active" && agreement.myStatus === "accepted") {
    if (!outcomes.some((outcome) => outcome.version === agreement.currentVersion)) {
      const outcomeForm = document.createElement("form");
      outcomeForm.className = "agreement-outcome-form";
      const label = document.createElement("label");
      label.textContent = "Report this agreement’s outcome";
      const select = document.createElement("select");
      select.className = "control";
      for (const [value, text] of Object.entries(outcomeLabels)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.append(option);
      }
      label.append(select);
      const noteLabel = document.createElement("label");
      noteLabel.textContent = "Short note (optional)";
      const note = document.createElement("textarea");
      note.className = "control";
      note.rows = 2;
      note.maxLength = 2000;
      noteLabel.append(note);
      const submit = document.createElement("button");
      submit.className = "secondary-button";
      submit.type = "submit";
      submit.textContent = "Report outcome";
      const feedback = document.createElement("p");
      feedback.dataset.outcomeFeedback = "";
      feedback.className = "agreement-feedback";
      const explanation = document.createElement("p");
      explanation.className = "agreement-outcome-guidance";
      explanation.textContent =
        "Your report will update this agreement’s tracker after every other participant confirms it. Any disagreement will be shown separately.";
      outcomeForm.append(label, noteLabel, explanation, submit, feedback);
      outcomeForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitAgreementOutcome(agreement.id, outcomeForm, submit);
      });
      card.append(outcomeForm);
    }
    const changeButton = document.createElement("button");
    changeButton.className = "secondary-button";
    changeButton.type = "button";
    changeButton.textContent = "Propose a change";
    const form = document.createElement("form");
    form.className = "agreement-change-form";
    form.hidden = true;
    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Updated title";
    const titleInput = document.createElement("input");
    titleInput.className = "control";
    titleInput.maxLength = 160;
    titleInput.value = agreement.title || "";
    titleLabel.append(titleInput);
    const bodyLabel = document.createElement("label");
    bodyLabel.textContent = "Complete proposed version";
    const bodyInput = document.createElement("textarea");
    bodyInput.className = "control agreement-draft";
    bodyInput.maxLength = 30000;
    bodyInput.rows = 12;
    bodyInput.value = agreement.body || "";
    bodyLabel.append(bodyInput);
    const submit = document.createElement("button");
    submit.className = "submit";
    submit.type = "submit";
    submit.textContent = "Request approval for change";
    form.append(titleLabel, bodyLabel, submit);
    changeButton.addEventListener("click", () => {
      form.hidden = !form.hidden;
      changeButton.textContent = form.hidden ? "Propose a change" : "Cancel change";
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submit.disabled = true;
      try {
        const response = await fetch(
          `/api/trust-score/agreements/${encodeURIComponent(agreement.id)}/propose-change`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title: titleInput.value, body: bodyInput.value }),
          },
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "The change could not be submitted.");
        if (myAgreementsFeedback)
          myAgreementsFeedback.textContent = `Version ${result.version} was saved and sent to all participants for approval.`;
        await loadStoredAgreements();
      } catch (error) {
        if (myAgreementsFeedback) {
          myAgreementsFeedback.textContent = error.message || "The change could not be submitted.";
          myAgreementsFeedback.classList.add("error");
        }
        submit.disabled = false;
      }
    });
    card.append(changeButton, form);
  }
  return card;
}

async function loadStoredAgreements() {
  if (!myAgreementsList || storedAgreementsLoading) return;
  storedAgreementsLoading = true;
  if (myAgreementsFeedback) {
    myAgreementsFeedback.textContent = "";
    myAgreementsFeedback.classList.remove("error");
  }
  if (myAgreementsSummary) myAgreementsSummary.hidden = true;
  if (agreementRefreshButton) agreementRefreshButton.disabled = true;
  try {
    const response = await fetch("/api/trust-score/agreements", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Agreements could not be loaded.");
    myAgreementsList.replaceChildren();
    const agreements = Array.isArray(result.agreements) ? result.agreements : [];
    if (myAgreementsSummary) {
      const summary = result.summary || {};
      if (trustRecordDisputedCount)
        trustRecordDisputedCount.textContent = String(Number(summary.disputed || 0));
      if (trustRecordCompletedCount)
        trustRecordCompletedCount.textContent = String(Number(summary.completed || 0));
      if (trustRecordAwaitingCount)
        trustRecordAwaitingCount.textContent = String(Number(summary.awaiting || 0));
      myAgreementsSummary.replaceChildren();
      const disputed = document.createElement("strong");
      disputed.textContent = `Disputed outcomes: ${Number(summary.disputed || 0)}`;
      const otherCounts = document.createElement("span");
      otherCounts.textContent = `Completed agreements: ${Number(summary.completed || 0)} · Confirmed outcomes: ${Number(summary.confirmed || 0)} · Awaiting responses: ${Number(summary.awaiting || 0)}`;
      const note = document.createElement("small");
      note.textContent =
        "Each count is one agreement outcome, even when the same people have several agreements. An outcome is confirmed only after all other participants respond; a disagreement does not by itself prove a broken commitment.";
      myAgreementsSummary.append(disputed, otherCounts, note);
      myAgreementsSummary.hidden = false;
    }
    if (!agreements.length) {
      const empty = document.createElement("p");
      empty.className = "agreement-friends-status";
      empty.textContent =
        "No agreements saved yet. Generate a draft, search for NFD members, then request their approval.";
      myAgreementsList.append(empty);
      return;
    }
    for (const agreement of agreements) myAgreementsList.append(renderStoredAgreement(agreement));
  } catch (error) {
    myAgreementsList.replaceChildren();
    const failure = document.createElement("p");
    failure.className = "agreement-friends-status error";
    failure.textContent = error.message || "Agreements could not be loaded right now.";
    myAgreementsList.append(failure);
  } finally {
    storedAgreementsLoading = false;
    if (agreementRefreshButton) agreementRefreshButton.disabled = false;
  }
}

agreementSaveButton?.addEventListener("click", async () => {
  agreementSaveFeedback.textContent = "";
  agreementSaveFeedback.classList.remove("error");
  const title = agreementSaveTitle.value.trim();
  const body = agreementDraft.value.trim();
  const participantIds = [...selectedAgreementPeople.keys()];
  if (!title || !body || !participantIds.length) {
    agreementSaveFeedback.textContent =
      "Add a title, agreement text, and at least one NFD member who can approve it.";
    agreementSaveFeedback.classList.add("error");
    return;
  }
  agreementSaveButton.disabled = true;
  agreementSaveButton.textContent = "Saving…";
  try {
    const response = await fetch("/api/trust-score/agreements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, body, participantIds }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "The agreement could not be saved.");
    agreementSaveFeedback.textContent =
      "Saved in NFD. The selected NFD members can review it from My agreements.";
    activateTrustScoreTab("my-agreements");
    document.getElementById("trust-tab-my-agreements")?.focus();
  } catch (error) {
    agreementSaveFeedback.textContent = error.message || "The agreement could not be saved right now.";
    agreementSaveFeedback.classList.add("error");
  } finally {
    agreementSaveButton.disabled = false;
    agreementSaveButton.textContent = "Save in NFD & request approval";
  }
});
agreementRefreshButton?.addEventListener("click", loadStoredAgreements);
agreementForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  agreementFeedback.textContent = "";
  agreementFeedback.classList.remove("error");
  agreementDownloadFeedback.textContent = "";
  if (!agreementDescription.value.trim()) {
    agreementFeedback.textContent = "Describe the agreement you want to draft.";
    agreementFeedback.classList.add("error");
    agreementDescription.focus();
    return;
  }
  if (!agreementGeminiConsent.checked) {
    agreementFeedback.textContent = "Confirm that your description can be sent to Google Gemini.";
    agreementFeedback.classList.add("error");
    agreementGeminiConsent.focus();
    return;
  }

  agreementGenerateButton.disabled = true;
  agreementGenerateButton.setAttribute("aria-busy", "true");
  agreementGenerateButton.textContent = "Generating…";
  agreementFeedback.textContent = "Creating your draft…";
  try {
    const response = await fetch("/api/trust-score/agreement-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ description: agreementDescription.value.trim(), geminiConsent: true }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "NFD couldn’t generate a draft right now.");
    if (typeof result.draft !== "string" || !result.draft.trim())
      throw new Error("Gemini returned an empty draft. Please try again.");
    agreementDraft.value = result.draft;
    agreementSaveTitle.value =
      result.draft
        .split("\n")
        .find((line) => line.trim())
        ?.replace(/^#+\s*/, "")
        .slice(0, 160) || "Agreement";
    agreementResult.hidden = false;
    agreementSaveFeedback.textContent = "";
    agreementFeedback.textContent =
      "Draft ready. Review and edit it before downloading or requesting approval.";
    resetAgreementApprovers();
    agreementResult.scrollIntoView({ behavior: "smooth", block: "start" });
    agreementDraft.focus({ preventScroll: true });
  } catch (error) {
    agreementFeedback.textContent = error.message || "NFD couldn’t generate a draft right now.";
    agreementFeedback.classList.add("error");
  } finally {
    agreementGenerateButton.disabled = false;
    agreementGenerateButton.removeAttribute("aria-busy");
    agreementGenerateButton.textContent = "Generate draft";
  }
});
agreementDownloadButton?.addEventListener("click", () => {
  const draft = agreementDraft.value.trim();
  if (!draft) {
    agreementDownloadFeedback.textContent = "Add agreement text before downloading.";
    return;
  }
  const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "NFD-agreement-draft.txt";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  agreementDownloadFeedback.textContent = "Downloaded your edited agreement draft.";
});
document.getElementById("confirm-review").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (!aiReviewConsent.hidden && !aiReviewConsentCheckbox.checked) {
    reviewNotice.textContent = "Check the Automatic review box to share while automatic review is enabled.";
    reviewNotice.classList.add("show", "error");
    aiReviewConsentCheckbox.focus();
    aiReviewConsent.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  button.disabled = true;
  const savingEdit = Boolean(editingPostId);
  button.textContent = savingEdit ? "Saving…" : "Sharing…";
  reviewNotice.classList.remove("show", "error");
  reviewNotice.replaceChildren();
  const payload = new FormData();
  payload.append("experienceCategory", experienceCategoryInput.value);
  payload.append("incidentCategory", incidentCategoryInput.value);
  payload.append("place", document.getElementById("place").value.trim());
  payload.append("placeCategory", document.getElementById("place-category").value);
  if (document.getElementById("incident-time").value)
    payload.append("incidentTimeUtc", new Date(document.getElementById("incident-time").value).toISOString());
  if (incidentTimeRangeToggle.checked && incidentTimeEndInput.value)
    payload.append("incidentTimeEndUtc", new Date(incidentTimeEndInput.value).toISOString());
  payload.append("incidentTimeZone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  payload.append("locationDetail", document.getElementById("location-detail").value.trim());
  payload.append("shortDescription", shortDescription.value.trim());
  payload.append("fullDescription", fullDescription.value.trim());
  payload.append("visibility", document.querySelector('input[name="visibility"]:checked')?.value || "public");
  if (!aiReviewConsent.hidden && aiReviewConsentCheckbox.checked) payload.append("aiReviewConsent", "yes");
  selectedFiles.forEach((file) => payload.append("evidence", file, file.name));
  if (savingEdit) removedEditingEvidenceIds.forEach((id) => payload.append("removeEvidence", id));
  try {
    if (!savingEdit) {
      button.textContent = "Preparing media…";
      for (let index = 0; index < selectedFiles.length; index++) {
        const preview = await createFeedPreview(selectedFiles[index]);
        if (preview) payload.append(`evidencePreview-${index}`, preview, `nfd-preview-${index}.webp`);
      }
    }
    button.textContent = savingEdit ? "Saving…" : "Sharing…";
    const response = await fetch(
      savingEdit ? `/api/experiences/${encodeURIComponent(editingPostId)}` : "/api/experiences",
      { method: savingEdit ? "PUT" : "POST", body: payload },
    );
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
      button.textContent = savingEdit ? "Try saving again" : "Try sharing again";
      reviewNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (!response.ok)
      throw new Error(
        result.error ||
          (savingEdit
            ? "NFD couldn’t save your post just now. Please try again."
            : "NFD couldn’t post your story just now. Please try again."),
      );
    window.location.assign(
      savingEdit ? "/profile?tab=posts&updated=1" : `/feed?shared=${encodeURIComponent(result.id)}`,
    );
  } catch (error) {
    const title = document.createElement("strong");
    title.textContent = savingEdit
      ? "Your changes haven’t been saved yet."
      : "Your story hasn’t made it to the feed yet.";
    const detail = document.createElement("span");
    detail.textContent = ` ${error instanceof TypeError ? "Connection failed. Your details are still here; try again." : error.message}`;
    reviewNotice.append(title, detail);
    reviewNotice.classList.add("show", "error");
    button.textContent = savingEdit ? "Try saving again" : "Try sharing again";
    button.disabled = false;
  }
  reviewNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
