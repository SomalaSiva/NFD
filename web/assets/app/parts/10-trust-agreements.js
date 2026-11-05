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
  payload.append("trustClassification", trustClassificationInput.value);
  payload.append("trustOutcome", trustOutcomeInput.value);
  payload.append("trustSubjectUserId", trustSubjectInput.value);
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
          if (result.moderation.suggestedShortDescription) {
            shortDescription.value = result.moderation.suggestedShortDescription;
            shortDescription.dispatchEvent(new Event("input", { bubbles: true }));
          }
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
