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
const trustClassificationInput = document.getElementById("trust-classification");
const trustOutcomeInput = document.getElementById("trust-outcome");
const trustSubjectInput = document.getElementById("trust-subject");
const trustSubjectSearchInput = document.getElementById("trust-subject-search");
const trustSubjectResults = document.getElementById("trust-subject-results");
const trustSubjectSearchStatus = document.getElementById("trust-subject-search-status");
const trustSubjectField = document.getElementById("trust-subject-field");
const trustClassFeedback = document.getElementById("trust-classification-feedback");
let trustPostOptionsPromise;
let trustSubjectSearchTimer;
let trustSubjectSearchController;
let trustSubjectSelectedName = "";
let trustAcceptedFriendIds = new Set();
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
const photoViewer = document.getElementById("photo-viewer");
const photoViewerImage = document.getElementById("photo-viewer-image");
const photoViewerClose = document.getElementById("photo-viewer-close");
const profilePhotoForm = document.getElementById("profile-photo-form");
const profilePhotoFile = document.getElementById("profile-photo-file");
const profilePhotoSave = document.getElementById("profile-photo-save");
const profilePhotoRemove = document.getElementById("profile-photo-remove");
const profilePhotoFeedback = document.getElementById("profile-photo-feedback");
const profilePhotoPreview = document.getElementById("profile-photo-preview");
const profileSummaryContent = document.getElementById("profile-summary-content");
const profileSummaryScore = document.getElementById("profile-summary-score");
const profileDetailsPanel = document.getElementById("profile-details-panel");
const profileDetailsForm = document.getElementById("profile-details-form");
const profileDisplayNameInput = document.getElementById("profile-display-name");
const profileUsernameInput = document.getElementById("profile-username");
const profileBioInput = document.getElementById("profile-bio");
const profileBioCount = document.getElementById("profile-bio-count");
const profileDetailsSave = document.getElementById("profile-details-save");
const profileDetailsFeedback = document.getElementById("profile-details-feedback");
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
const mobileBottomNav = document.getElementById("mobile-bottom-nav");
const accountMenuWrap = document.getElementById("account-menu-wrap");
const accountAdminLink = document.getElementById("account-admin-link");
const ghostModeSetupLink = document.getElementById("ghost-mode-setup");
const ghostModeToggle = document.getElementById("ghost-mode-toggle");
const ghostModeBanner = document.getElementById("ghost-mode-banner");
const ghostModeHandle = document.getElementById("ghost-mode-handle");
const ghostModeExit = document.getElementById("ghost-mode-exit");
const messagesNavLink = document.getElementById("messages-nav-link");
const navUnreadCount = document.getElementById("account-notification-count");
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
  mobileBottomNav.hidden = !visible;
  document.body.classList.toggle("has-mobile-bottom-nav", visible);
  updateMobileBottomNavigation();
}
function updateMobileBottomNavigation() {
  if (!mobileBottomNav) return;
  const path = location.pathname.replace(/\/$/, "") || "/";
  const params = new URLSearchParams(location.search);
  let active = "feed";
  if (path === "/share") active = "post";
  else if (path === "/profile" && (params.get("tab") === "friends" || params.has("friend")))
    active = "friends";
  else if (path === "/profile") active = "you";
  mobileBottomNav.querySelectorAll("[data-mobile-nav]").forEach((link) => {
    const selected = link.dataset.mobileNav === active;
    if (selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
function openPhotoViewer(source, alt) {
  if (!photoViewer || !photoViewerImage || !source) return;
  photoViewerImage.src = source;
  photoViewerImage.alt = alt || "Photo";
  photoViewer.showModal();
}
photoViewerClose?.addEventListener("click", () => photoViewer.close());
photoViewer?.addEventListener("click", (event) => {
  if (event.target === photoViewer) photoViewer.close();
});
let messageNavRefreshTimer;
let messageNavRefreshInFlight = false;
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
const soundFeedbackToggle = document.getElementById("sound-feedback-toggle");
const hapticFeedbackToggle = document.getElementById("haptic-feedback-toggle");
const TOUCH_FEEDBACK_STORAGE_KEY = "nfd-touch-feedback-v1";
const prefersTouchFeedback = window.matchMedia?.("(pointer: coarse)").matches ?? false;
const supportsTouchVibration = typeof navigator.vibrate === "function";
let touchFeedbackPreferences = {
  sound: prefersTouchFeedback,
  haptics: prefersTouchFeedback && supportsTouchVibration,
};
let touchFeedbackAudioContext;
try {
  const savedPreferences = JSON.parse(localStorage.getItem(TOUCH_FEEDBACK_STORAGE_KEY) || "null");
  if (savedPreferences && typeof savedPreferences === "object") {
    touchFeedbackPreferences = {
      sound: typeof savedPreferences.sound === "boolean" ? savedPreferences.sound : prefersTouchFeedback,
      haptics:
        supportsTouchVibration && typeof savedPreferences.haptics === "boolean"
          ? savedPreferences.haptics
          : prefersTouchFeedback && supportsTouchVibration,
    };
  }
} catch {
  // Keep device-appropriate defaults when browser storage is unavailable.
}
function saveTouchFeedbackPreferences() {
  try {
    localStorage.setItem(TOUCH_FEEDBACK_STORAGE_KEY, JSON.stringify(touchFeedbackPreferences));
  } catch {
    // The controls still work for this page when browser storage is unavailable.
  }
  soundFeedbackToggle.setAttribute("aria-pressed", String(touchFeedbackPreferences.sound));
  soundFeedbackToggle.textContent = `Tap sounds: ${touchFeedbackPreferences.sound ? "On" : "Off"}`;
  hapticFeedbackToggle.disabled = !supportsTouchVibration;
  hapticFeedbackToggle.setAttribute(
    "aria-pressed",
    String(supportsTouchVibration && touchFeedbackPreferences.haptics),
  );
  hapticFeedbackToggle.textContent = supportsTouchVibration
    ? `Touch vibration: ${touchFeedbackPreferences.haptics ? "On" : "Off"}`
    : "Touch vibration unavailable";
}
function playTouchFeedback(kind = "tap") {
  if (!touchFeedbackPreferences.sound) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    touchFeedbackAudioContext ??= new AudioContextClass();
    if (touchFeedbackAudioContext.state === "suspended") {
      touchFeedbackAudioContext.resume().catch(() => {});
    }
    const now = touchFeedbackAudioContext.currentTime;
    const oscillator = touchFeedbackAudioContext.createOscillator();
    const gain = touchFeedbackAudioContext.createGain();
    const duration = kind === "swipe" ? 0.12 : 0.055;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(kind === "swipe" ? 360 : 620, now);
    if (kind === "swipe") oscillator.frequency.exponentialRampToValueAtTime(540, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "swipe" ? 0.018 : 0.012, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(touchFeedbackAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  } catch {
    // Sound is optional; audio restrictions must never block app interactions.
  }
}
function vibrateForTouch(kind = "tap") {
  if (!touchFeedbackPreferences.haptics || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(kind === "swipe" ? 16 : 9);
  } catch {
    // Unsupported haptics are silently ignored.
  }
}
soundFeedbackToggle.addEventListener("click", () => {
  touchFeedbackPreferences.sound = !touchFeedbackPreferences.sound;
  saveTouchFeedbackPreferences();
});
hapticFeedbackToggle.addEventListener("click", () => {
  touchFeedbackPreferences.haptics = !touchFeedbackPreferences.haptics;
  saveTouchFeedbackPreferences();
  vibrateForTouch("tap");
});
saveTouchFeedbackPreferences();
let swipeStartPoint;
document.addEventListener(
  "pointerdown",
  (event) => {
    if (event.isPrimary && event.pointerType === "touch")
      swipeStartPoint = { x: event.clientX, y: event.clientY };
  },
  { passive: true },
);
document.addEventListener(
  "pointerup",
  (event) => {
    if (!swipeStartPoint) return;
    const distanceX = event.clientX - swipeStartPoint.x;
    const distanceY = event.clientY - swipeStartPoint.y;
    swipeStartPoint = undefined;
    if (Math.abs(distanceX) < 56 || Math.abs(distanceX) < Math.abs(distanceY) * 1.35) return;
    playTouchFeedback("swipe");
    vibrateForTouch("swipe");
  },
  { passive: true },
);
document.addEventListener("pointercancel", () => (swipeStartPoint = undefined), { passive: true });
document.addEventListener(
  "click",
  (event) => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    if (
      event.target.closest("button, a[href], [role='button'], input[type='checkbox'], input[type='radio']")
    ) {
      playTouchFeedback("tap");
      vibrateForTouch("tap");
    }
  },
  true,
);
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
const trustScoreOverviewMeter = document.getElementById("trust-score-overview-meter");
const trustOverviewClassifications = document.getElementById("trust-overview-classifications");
const trustProfileSearch = document.getElementById("trust-profile-search");
const trustProfileSearchResults = document.getElementById("trust-profile-search-results");
const trustProfileHeading = document.getElementById("trust-profile-heading");
const trustProfileClassifications = document.getElementById("trust-profile-classifications");
const trustProfileActivityList = document.getElementById("trust-profile-activity-list");
const trustAdminSummary = document.getElementById("trust-admin-summary");
const trustScoreTabs = [...document.querySelectorAll("[data-trust-tab]")];
const trustScorePanels = [...document.querySelectorAll(".trust-score-panel")];
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
let messageFriendsRefreshInFlight = false;
let messageSeenPending = new Set();
let storedAgreementsLoading = false;
const profileSummary = document.getElementById("profile-summary");
const profilePostCount = document.getElementById("profile-post-count");
const profilePostList = document.getElementById("profile-post-list");
const profilePostLoadMore = document.getElementById("profile-post-load-more");
let profilePostCursor = null;
let profileTotalPosts = 0;
let profilePostsLoading = false;
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

const prettySize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
