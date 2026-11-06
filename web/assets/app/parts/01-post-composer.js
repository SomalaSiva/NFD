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
shortDescription.addEventListener("input", () => {
  if (shortDescription.value.length > 150) shortDescription.value = shortDescription.value.slice(0, 150);
  document.getElementById("short-char-count").textContent = shortDescription.value.length;
});
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
  const trustReportSection = document.getElementById("review-trust-report-section");
  trustReportSection.hidden = !trustClassificationInput.value;
  document.getElementById("review-trust-report").textContent = trustClassificationInput.value
    ? `${trustOutcomeInput.selectedOptions[0]?.dataset.polarity === "positive" ? "Positive recognition · unverified" : "Unverified allegation"} · ${selected("trust-classification")} · ${selected("trust-outcome")} · About ${trustSubjectSearchInput.value || "NFD friend"}`
    : "";
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
async function loadTrustPostOptions() {
  if (trustPostOptionsPromise) return trustPostOptionsPromise;
  trustPostOptionsPromise = (async () => {
    const [rulesResponse, friendsResponse] = await Promise.all([
      fetch("/api/trust-score/rules", { headers: { accept: "application/json" }, cache: "no-store" }),
      fetch("/api/friends", { headers: { accept: "application/json" }, cache: "no-store" }),
    ]);
    const rules = await rulesResponse.json().catch(() => ({}));
    const friends = await friendsResponse.json().catch(() => ({}));
    if (!rulesResponse.ok) throw new Error(rules.error || "Trust Score categories are unavailable.");
    trustClassificationInput.replaceChildren(new Option("Regular post — no Trust Score report", ""));
    for (const classification of rules.classifications || []) {
      trustClassificationInput.add(new Option(classification.label, classification.key));
    }
    const friendOptions = (friends.friends || []).map((friend) => ({
      value: friend.userId,
      label: friend.name,
    }));
    trustAcceptedFriendIds = new Set(friendOptions.map((friend) => friend.value));
    return { classifications: rules.classifications || [], friends: friendOptions };
  })().catch((error) => {
    trustClassificationInput.disabled = true;
    trustOutcomeInput.disabled = true;
    trustSubjectSearchInput.disabled = true;
    trustClassFeedback.textContent = error.message;
    throw error;
  });
  return trustPostOptionsPromise;
}
function hideTrustSubjectResults() {
  trustSubjectResults.hidden = true;
  trustSubjectSearchInput.setAttribute("aria-expanded", "false");
}
function showTrustSubjectResults() {
  trustSubjectResults.hidden = false;
  trustSubjectSearchInput.setAttribute("aria-expanded", "true");
}
function selectTrustSubject(person) {
  trustSubjectInput.value = person.userId;
  trustSubjectSearchInput.setCustomValidity("");
  trustSubjectSelectedName = person.name;
  trustSubjectSearchInput.value = person.name;
  trustSubjectSearchStatus.textContent = `Selected ${person.name}.`;
  trustClassFeedback.textContent = "";
  hideTrustSubjectResults();
}
function renderTrustSubjectResults(people, query) {
  trustSubjectResults.replaceChildren();
  const acceptedMatches = people.filter((person) => trustAcceptedFriendIds.has(person.userId));
  for (const person of acceptedMatches) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "trust-profile-search-option";
    option.setAttribute("role", "option");
    option.textContent = person.username ? `${person.name} · @${person.username}` : person.name;
    option.addEventListener("click", () => selectTrustSubject(person));
    trustSubjectResults.append(option);
  }
  if (people.length && !acceptedMatches.length) {
    const status = addText(
      trustSubjectResults,
      "p",
      "trust-score-hint",
      "An NFD profile matched, but only accepted friends can be linked. Send and accept a friend request first.",
    );
    status.setAttribute("role", "option");
    status.setAttribute("aria-disabled", "true");
  } else if (!people.length) {
    const status = addText(
      trustSubjectResults,
      "p",
      "trust-score-hint",
      "No NFD profile matched this search.",
    );
    status.setAttribute("role", "option");
    status.setAttribute("aria-disabled", "true");
    const notInNfdOption = document.createElement("button");
    notInNfdOption.type = "button";
    notInNfdOption.className = "trust-profile-search-option trust-profile-search-not-in-nfd";
    notInNfdOption.setAttribute("role", "option");
    notInNfdOption.textContent = "Not in NFD — continue without a profile link";
    notInNfdOption.addEventListener("click", chooseNotInNfd);
    trustSubjectResults.append(notInNfdOption);
  }
  if (acceptedMatches.length) {
    trustSubjectSearchStatus.textContent = `${acceptedMatches.length} accepted NFD ${acceptedMatches.length === 1 ? "friend" : "friends"} found.`;
  } else if (people.length) {
    trustSubjectSearchStatus.textContent = "This person has an NFD profile but is not an accepted friend.";
  } else {
    trustSubjectSearchStatus.textContent = `No NFD profile found for “${query}”.`;
  }
  showTrustSubjectResults();
}
function scheduleTrustSubjectSearch() {
  const query = trustSubjectSearchInput.value.trim();
  if (trustSubjectInput.value && query !== trustSubjectSelectedName) {
    trustSubjectInput.value = "";
    trustSubjectSelectedName = "";
  }
  trustSubjectSearchInput.setCustomValidity(
    trustClassificationInput.value && !trustSubjectInput.value
      ? "Select an accepted NFD friend, or choose Not in NFD to share without a Trust Score link."
      : "",
  );
  trustClassFeedback.textContent = "";
  window.clearTimeout(trustSubjectSearchTimer);
  trustSubjectSearchController?.abort();
  if (query.length < 2) {
    hideTrustSubjectResults();
    trustSubjectSearchStatus.textContent = "Type at least 2 letters to search NFD.";
    return;
  }
  trustSubjectSearchStatus.textContent = "Searching NFD…";
  trustSubjectSearchTimer = window.setTimeout(async () => {
    const controller = new AbortController();
    trustSubjectSearchController = controller;
    try {
      const response = await fetch(`/api/trust-score/people?q=${encodeURIComponent(query)}`, {
        headers: { accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "NFD profiles could not be searched right now.");
      if (!controller.signal.aborted) renderTrustSubjectResults(result.people || [], query);
    } catch (error) {
      if (error.name === "AbortError") return;
      hideTrustSubjectResults();
      trustSubjectSearchStatus.textContent = error.message || "NFD profiles could not be searched right now.";
    }
  }, 250);
}
function chooseNotInNfd() {
  const name = trustSubjectSearchInput.value.trim();
  if (name && !postPlaceInput.value.trim()) postPlaceInput.value = name;
  trustSubjectInput.value = "";
  trustSubjectSelectedName = "";
  trustClassificationInput.value = "";
  trustSubjectSearchInput.setCustomValidity("");
  updateTrustOutcomeOptions([], "");
  trustClassFeedback.textContent =
    "Not in NFD selected. This will be shared as a regular post and will not be linked to a Trust Score profile.";
  trustSubjectSearchStatus.textContent = "The person’s name was added to the optional post details.";
  hideTrustSubjectResults();
}
function updateTrustOutcomeOptions(classifications, selectedOutcome = "") {
  const selected = classifications.find((entry) => entry.key === trustClassificationInput.value);
  trustOutcomeInput.replaceChildren(
    new Option(selected ? "Choose an outcome" : "Choose a classification first", ""),
  );
  for (const outcome of selected?.outcomes || []) {
    const option = new Option(outcome.label, outcome.value);
    option.dataset.polarity = outcome.polarity || "negative";
    trustOutcomeInput.add(option);
  }
  trustOutcomeInput.disabled = !selected;
  trustOutcomeInput.required = Boolean(selected);
  trustSubjectField.hidden = !selected;
  trustSubjectSearchInput.required = Boolean(selected);
  trustSubjectSearchInput.setCustomValidity(
    selected && !trustSubjectInput.value
      ? "Select an accepted NFD friend, or choose Not in NFD to share without a Trust Score link."
      : "",
  );
  if (selectedOutcome) trustOutcomeInput.value = selectedOutcome;
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
    const trustOptions = await loadTrustPostOptions();
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
    trustClassificationInput.value = experience.trustClassification || "";
    updateTrustOutcomeOptions(trustOptions.classifications, experience.trustOutcome || "");
    trustSubjectInput.value = experience.trustSubjectUserId || "";
    trustSubjectSearchInput.setCustomValidity(
      trustClassificationInput.value && !trustSubjectInput.value
        ? "Select an accepted NFD friend, or choose Not in NFD to share without a Trust Score link."
        : "",
    );
    const selectedFriend = trustOptions.friends.find((friend) => friend.value === trustSubjectInput.value);
    trustSubjectSelectedName =
      selectedFriend?.label || (trustSubjectInput.value ? "Previously selected NFD profile" : "");
    trustSubjectSearchInput.value = trustSubjectSelectedName;
    trustSubjectSearchStatus.textContent = selectedFriend
      ? `Selected ${selectedFriend.label}.`
      : trustSubjectInput.value
        ? "This post’s existing NFD profile link is retained unless you choose another friend."
        : "Search by name or username. Only accepted NFD friends can be linked to a Trust Score report.";
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
