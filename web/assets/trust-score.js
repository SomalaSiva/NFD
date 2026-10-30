(() => {
  if (location.pathname !== "/trust-score") return;

  const content = document.getElementById("trust-score-content");
  const status = document.getElementById("trust-score-status");
  const tabs = [...document.querySelectorAll("[data-trust-view]")];
  const labels = {
    scope: "Scope and deliverables",
    dates: "Dates and milestones",
    payment: "Payment or exchange",
    completion: "How completion is confirmed",
    changes: "Changes, cancellation, and disagreements",
  };
  const state = {
    view: "discover",
    userId: "",
    profile: null,
    summary: null,
    people: [],
    nfdSearch: "",
    nfdPeople: [],
    agreementSearch: "",
    agreementCandidates: [],
    agreementSelection: new Map(),
    commitments: [],
    agreements: [],
    search: "",
    category: "",
    editingAgreementId: "",
    busy: false,
  };
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
    );
  const prettyDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Date not set"
      : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  };
  const stateLabel = (value) =>
    ({
      awaiting_acceptance: "Waiting for participants",
      active: "In progress",
      awaiting_confirmation: "Awaiting confirmation",
      fulfilled_on_time: "Completed by due date",
      fulfilled_late: "Completed after due date",
      disputed: "Disputed · outcome pending",
      declined: "Declined",
      cancelled: "Cancelled",
      draft: "Draft",
      awaiting_approval: "Awaiting approval",
      changes_requested: "Changes requested",
      approved: "Approved",
      awaiting_fulfillment: "Awaiting fulfillment confirmation",
      fulfilled: "Fulfilled",
      previous_version: "Participant in an earlier version",
    })[value] || value;
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("error", isError);
  };
  async function api(path, options = {}) {
    const response = await fetch(`/api/trust-score${path}`, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...options.headers,
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Trust Score could not complete that request.");
    return result;
  }
  const send = (body) => ({ method: "POST", body: JSON.stringify(body) });
  const save = (body) => ({ method: "PUT", body: JSON.stringify(body) });
  function metric(label, value) {
    return `<div class="trust-score-metric"><strong>${Number(value) || 0}</strong><span>${esc(label)}</span></div>`;
  }
  function metrics(summary, showTotal = true) {
    return `<div class="trust-score-metrics">
      ${metric("On time", summary?.onTime)}${metric("Late", summary?.late)}${metric("Disputed", summary?.disputed)}${metric("In progress", summary?.inProgress)}${metric("Fulfilled agreements", summary?.agreementsFulfilled)}${showTotal ? metric("Recorded outcomes", summary?.total) : ""}
    </div>`;
  }
  async function loadNfdPeople(query) {
    if (query.length < 2) {
      state.nfdPeople = [];
      return;
    }
    const result = await api(`/nfd-members?q=${encodeURIComponent(query)}`);
    state.nfdPeople = result.people || [];
  }
  let agreementSearchRequest = 0;
  async function loadAgreementCandidates(query) {
    const request = ++agreementSearchRequest;
    state.agreementSearch = query;
    if (query.length < 2) {
      state.agreementCandidates = [];
      renderAgreementParticipantPicker();
    } else {
      const result = await api(`/nfd-members?q=${encodeURIComponent(query)}`);
      if (request !== agreementSearchRequest) return;
      state.agreementCandidates = result.people || [];
      renderAgreementParticipantPicker();
    }
  }
  function renderAgreementParticipantPicker() {
    const selected = document.getElementById("trust-score-agreement-selected");
    const candidates = document.getElementById("trust-score-agreement-candidates");
    if (!selected || !candidates) return;
    selected.innerHTML =
      [...state.agreementSelection.entries()]
        .map(
          ([id, person]) => `<label class="trust-score-check trust-score-selected-person">
          <input class="trust-score-agree-person" type="checkbox" value="${esc(id)}" checked>
          <span><strong>${esc(person.name)}</strong><small>Selected participant</small>
          <textarea class="trust-score-responsibility" data-user-id="${esc(id)}" maxlength="3000" required aria-label="${esc(person.name)} responsibility">${esc(person.responsibility)}</textarea></span>
        </label>`,
        )
        .join("") ||
      `<p class="trust-score-note">Search NFD members by display name, then select one or more participants.</p>`;
    const choices = state.agreementCandidates.filter((person) => !state.agreementSelection.has(person.id));
    candidates.innerHTML = choices.length
      ? choices
          .map(
            (person) => `<label class="trust-score-check trust-score-candidate-person">
              <input class="trust-score-agree-person" type="checkbox" value="${esc(person.id)}">
              <span><strong>${esc(person.name)}</strong><small>NFD member · agreement invitations appear in Trust Score</small></span>
            </label>`,
          )
          .join("")
      : state.agreementSearch.length < 2
        ? `<p class="trust-score-note">Enter at least two characters to find active NFD members.</p>`
        : `<p class="trust-score-note">No matching active NFD members found.</p>`;
  }
  async function loadPeople() {
    const params = new URLSearchParams();
    if (state.search) params.set("q", state.search);
    if (state.category) params.set("category", state.category);
    const result = await api(`/people?${params}`);
    state.people = result.people || [];
  }
  async function refreshAll() {
    setStatus("Loading your Trust Score…");
    try {
      const [profile, commitments, agreements, auth] = await Promise.all([
        api("/profile"),
        api("/commitments"),
        api("/agreements"),
        fetch("/api/auth-status", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
      ]);
      state.profile = profile.profile;
      state.summary = profile.summary;
      state.commitments = commitments.commitments || [];
      state.agreements = agreements.agreements || [];
      state.userId = auth.userId || "";
      if (state.view === "discover") await loadPeople();
      setStatus("");
      render();
      return true;
    } catch (error) {
      setStatus(error.message, true);
      content.innerHTML = `<div class="trust-score-empty"><h2>Trust Score is temporarily unavailable</h2><p>${esc(error.message)}</p><button class="trust-score-retry" type="button">Try again</button></div>`;
      return false;
    }
  }
  function renderDiscovery() {
    const people = state.people;
    return `<section class="trust-score-panel">
      <div class="trust-score-panel-head"><div><h2>People behind the promises</h2><p>Search member profiles that have chosen to be discoverable.</p></div></div>
      <form class="trust-score-filters" id="trust-score-search">
        <input id="trust-score-search-q" type="search" name="q" value="${esc(state.search)}" placeholder="Search by name, role, city, or about" aria-label="Search Trust Score people">
        <select name="category" aria-label="Filter by category"><option value="">All categories</option>${["Services", "Business", "Everyday commitments", "Other"].map((category) => `<option value="${category}" ${state.category === category ? "selected" : ""}>${category}</option>`).join("")}</select><button class="primary" type="submit">Search</button>
      </form>
      <p class="trust-score-note">Trust Score shows participant-confirmed outcomes. Disputed commitments stay separate until everyone agrees on a resolution. There is no single rating number.</p>
    </section>
    <section class="trust-score-panel">
      <div class="trust-score-panel-head"><div><h2>Find NFD members for an agreement</h2><p>Search active NFD accounts, including members who keep their Trust Score profile private.</p></div></div>
      <form class="trust-score-filters" id="trust-score-nfd-search">
        <input id="trust-score-nfd-query" type="search" name="q" value="${esc(state.nfdSearch)}" minlength="2" placeholder="Search by NFD display name" aria-label="Search active NFD members">
        <button class="primary" type="submit">Search NFD</button>
      </form>
      <p class="trust-score-note">Only active NFD member names are shown. Email addresses and private Trust Score details stay hidden. Agreement invitations appear in each person’s Trust Score page, where they can review and respond.</p>
      <div class="trust-score-nfd-results" aria-live="polite">${
        state.nfdPeople.length
          ? state.nfdPeople
              .map(
                (person) =>
                  `<article class="trust-score-nfd-result"><div><strong>${esc(person.name)}</strong><small>NFD member</small></div><button class="primary" type="button" data-trust-action="invite-agreement" data-user="${esc(person.id)}" data-name="${esc(person.name)}">Draft agreement</button></article>`,
              )
              .join("")
          : `<p class="trust-score-note">Enter at least two characters to search NFD members.</p>`
      }</div>
    </section>
    <section class="trust-score-grid" aria-label="Discoverable NFD members">
      ${
        people.length
          ? people
              .map(
                (person) => `<article class="trust-score-card">
        <div class="trust-score-card-head"><span class="trust-score-tag">${esc(person.category || "NFD member")}</span><span class="trust-score-state">NFD account</span></div>
        <h3>${esc(person.name)}</h3><p>${esc(person.role || "NFD member")}${person.city ? ` · ${esc(person.city)}` : ""}</p>
        ${person.bio ? `<p>${esc(person.bio)}</p>` : ""}${metrics(person.summary, false)}
        <div class="trust-score-card-foot"><small>${Number(person.summary?.total) || 0} recorded commitment outcome${Number(person.summary?.total) === 1 ? "" : "s"}</small><button type="button" data-trust-action="start-commitment" data-user="${esc(person.id)}">Start a commitment</button></div>
      </article>`,
              )
              .join("")
          : `<div class="trust-score-empty"><h2>No public Trust Score profiles found</h2><p>Try another search, or make your own Trust Score profile discoverable from My profile.</p><button type="button" data-trust-view-button="profile">Set up my profile</button></div>`
      }
    </section>${people.length === 100 ? `<p class="trust-score-note">Showing the first 100 matches. Narrow your search to find a specific person.</p>` : ""}`;
  }
  function commitmentActions(item) {
    const current = item.participants.find((person) => person.id === state.userId);
    const actions = [];
    if (item.status === "awaiting_acceptance" && current?.invitationStatus === "invited") {
      actions.push(
        `<button type="button" class="primary" data-trust-action="commitment" data-id="${item.id}" data-action="accept">Accept</button><button type="button" data-trust-action="commitment" data-id="${item.id}" data-action="decline">Decline</button>`,
      );
    }
    if (item.status === "active" && item.createdBy === state.userId)
      actions.push(
        `<button type="button" class="primary" data-trust-action="commitment" data-id="${item.id}" data-action="report">Report fulfillment</button>`,
      );
    if (
      item.status === "awaiting_confirmation" &&
      current?.invitationStatus === "accepted" &&
      !current.fulfillmentConfirmed
    )
      actions.push(
        `<button type="button" class="primary" data-trust-action="commitment" data-id="${item.id}" data-action="confirm">Confirm fulfillment</button>`,
      );
    if (["active", "awaiting_confirmation"].includes(item.status))
      actions.push(
        `<details class="trust-score-dispute"><summary>Dispute or propose another outcome</summary><form data-trust-form="dispute" data-id="${item.id}" class="trust-score-form"><label>Proposed outcome<select name="resolution"><option value="fulfilled_on_time">Completed by due date</option><option value="fulfilled_late">Completed after due date</option><option value="cancelled">Cancelled</option></select></label><label>What is disputed?<textarea name="note" required maxlength="2000"></textarea></label><button class="primary">Open dispute</button></form></details>`,
      );
    if (item.status === "disputed")
      actions.push(
        `<details class="trust-score-dispute"><summary>Propose or agree on a resolution</summary><form data-trust-form="resolve" data-id="${item.id}" class="trust-score-form"><label>Outcome<select name="resolution"><option value="fulfilled_on_time">Completed by due date</option><option value="fulfilled_late">Completed after due date</option><option value="cancelled">Cancelled</option></select></label><label>Resolution note<textarea name="note" maxlength="2000"></textarea></label><button class="primary">Submit resolution</button></form></details>`,
      );
    if (item.createdBy === state.userId && ["active", "awaiting_acceptance"].includes(item.status))
      actions.push(
        `<button type="button" class="danger" data-trust-action="commitment" data-id="${item.id}" data-action="cancel">Cancel commitment</button>`,
      );
    return actions.join("");
  }
  function renderCommitments() {
    return `<section class="trust-score-panel"><div class="trust-score-panel-head"><div><h2>Commitments</h2><p>Record clear expectations, dates, changes, and mutually confirmed outcomes.</p></div><button class="primary" type="button" data-trust-action="new-commitment">New commitment</button></div>${metrics(state.summary)}</section>
      <section id="trust-score-commitment-form" class="trust-score-panel" hidden></section>
      <section class="trust-score-grid">${
        state.commitments.length
          ? state.commitments
              .map(
                (item) => `<article class="trust-score-card">
        <div class="trust-score-card-head"><span class="trust-score-tag">${esc(item.category)}</span><span class="trust-score-state ${item.status.includes("disputed") ? "disputed" : item.status.includes("awaiting") ? "pending" : ""}">${esc(stateLabel(item.status))}</span></div>
        <h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><p>Due ${prettyDate(item.dueAt)} · Started ${prettyDate(item.createdAt)}</p>
        <ul class="trust-score-members">${item.participants.map((person) => `<li><span>${esc(person.name)}${person.role === "creator" ? " · creator" : ""}</span><span>${esc(person.invitationStatus)}${person.fulfillmentConfirmed ? " · confirmed" : ""}</span></li>`).join("")}</ul>
        ${item.events.length ? `<details class="trust-score-history"><summary>Activity history</summary><ul class="trust-score-events">${item.events.map((event) => `<li><span>${esc(event.actorName)} · ${esc(event.action)}${event.details?.note ? ` — ${esc(event.details.note)}` : ""}</span><time>${prettyDate(event.createdAt)}</time></li>`).join("")}</ul></details>` : ""}
        <div class="trust-score-actions">${commitmentActions(item)}</div>
      </article>`,
              )
              .join("")
          : `<div class="trust-score-empty"><h2>No commitments yet</h2><p>Create one with another discoverable NFD member to get started.</p><button type="button" class="primary" data-trust-action="new-commitment">Create a commitment</button></div>`
      }</section>`;
  }
  function agreementActions(agreement) {
    const me = agreement.participants.find((person) => person.id === state.userId);
    const controls = [];
    if (
      agreement.isOwner &&
      ["draft", "changes_requested", "declined", "awaiting_approval", "approved"].includes(agreement.status)
    ) {
      controls.push(
        `<button type="button" data-trust-action="edit-agreement" data-id="${agreement.id}">${agreement.status === "draft" ? "Edit draft" : "Create a new version"}</button>`,
      );
    }
    if (agreement.isOwner && agreement.status === "draft")
      controls.push(
        `<button type="button" class="primary" data-trust-action="agreement" data-id="${agreement.id}" data-action="request">Request approval</button>`,
      );
    if (
      agreement.status === "awaiting_approval" &&
      me &&
      me.decision !== "approved" &&
      me.decision !== "changes" &&
      me.decision !== "declined"
    ) {
      controls.push(
        `<button type="button" class="primary" data-trust-action="agreement" data-id="${agreement.id}" data-action="approve">Approve version</button>`,
      );
      controls.push(
        `<details class="trust-score-dispute"><summary>Request changes or decline</summary><form data-trust-form="agreement-response" data-id="${agreement.id}" class="trust-score-form"><label>Response<select name="decision"><option value="changes">Request changes</option><option value="declined">Decline</option></select></label><label>Note<textarea name="note" required maxlength="2000"></textarea></label><button>Submit response</button></form></details>`,
      );
    }
    if (agreement.isOwner && agreement.status === "approved")
      controls.push(
        `<button type="button" class="primary" data-trust-action="agreement" data-id="${agreement.id}" data-action="fulfillment">Report fulfillment</button>`,
      );
    if (agreement.status === "awaiting_fulfillment" && me && !me.fulfillmentConfirmed)
      controls.push(
        `<button type="button" class="primary" data-trust-action="agreement" data-id="${agreement.id}" data-action="confirm">Confirm fulfillment</button>`,
      );
    controls.push(
      `<button type="button" data-trust-action="download-agreement" data-id="${agreement.id}">Download record</button>`,
    );
    return controls.join("");
  }
  function renderAgreements() {
    return `<section class="trust-score-panel"><div class="trust-score-panel-head"><div><h2>Agreements</h2><p>Draft terms, invite NFD participants, collect each version’s approvals, and confirm fulfillment together.</p></div><button class="primary" type="button" data-trust-action="new-agreement">New agreement</button></div><p class="trust-score-note">Invitations appear in each participant’s Trust Score page. NFD does not send agreement emails yet. Registration or joining NFD never counts as approval.</p></section>
      <section id="trust-score-agreement-form" class="trust-score-panel" hidden></section>
      <section class="trust-score-grid">${
        state.agreements.length
          ? state.agreements
              .map(
                (agreement) => `<article class="trust-score-card">
        <div class="trust-score-card-head"><span class="trust-score-tag">Version ${agreement.version} · ${agreement.approvals.approved}/${agreement.approvals.total} approved</span><span class="trust-score-state ${agreement.status.includes("awaiting") ? "pending" : agreement.status === "declined" || agreement.status === "changes_requested" ? "changes_requested" : ""}">${esc(stateLabel(agreement.status))}</span></div>
        <h3>${esc(agreement.title)}</h3><p>${esc(agreement.description)}</p>
        <ul class="trust-score-members">${agreement.participants.map((person) => `<li><span>${esc(person.name)} · ${esc(person.responsibility)}</span><span>${esc(person.decision || "Awaiting response")}${person.fulfillmentConfirmed ? " · confirmed" : ""}</span></li>`).join("")}</ul>
        <details class="trust-score-history"><summary>Terms and version history</summary><p><strong>Scope:</strong> ${esc(agreement.terms.scope || "")}</p><p><strong>Dates:</strong> ${esc(agreement.terms.dates || "")}</p><p><strong>Payment:</strong> ${esc(agreement.terms.payment || "")}</p><p><strong>Completion:</strong> ${esc(agreement.terms.completion || "")}</p><p><strong>Changes and disagreements:</strong> ${esc(agreement.terms.changes || "")}</p>
          ${agreement.history.map((entry) => `<details><summary>Version ${entry.version} · ${prettyDate(entry.createdAt)}${entry.reason ? ` · ${esc(entry.reason)}` : ""}</summary><p>${esc(entry.content.description)}</p><ul>${(entry.content.participants || []).map((person) => `<li>${esc(person.name || "NFD member")} · ${esc(person.responsibility)}</li>`).join("")}</ul><p>Changed by ${esc(entry.changedBy)}</p></details>`).join("")}
          <ul class="trust-score-events">${agreement.events.map((event) => `<li><span>${esc(event.actorName)} · ${esc(event.action)}</span><time>${prettyDate(event.createdAt)}</time></li>`).join("")}</ul>
        </details>
        <div class="trust-score-actions">${agreementActions(agreement)}</div>
      </article>`,
              )
              .join("")
          : `<div class="trust-score-empty"><h2>No agreements yet</h2><p>Draft an agreement with any active NFD member. Everyone can review each version before it is approved.</p><button type="button" class="primary" data-trust-action="new-agreement">Create an agreement</button></div>`
      }</section>`;
  }
  function agreementForm(existing = null) {
    const currentContent = existing?.history.find((entry) => entry.version === existing.version)?.content;
    const terms = currentContent?.terms || existing?.terms || {};
    const fields = Object.entries(labels)
      .map(
        ([key, label]) =>
          `<label>${label}<textarea name="${key}" required maxlength="4000" placeholder="[To agree: ${esc(label.toLowerCase())}]">${esc(terms[key] || "")}</textarea></label>`,
      )
      .join("");
    return `<form id="trust-score-agreement-editor" data-id="${existing?.id || ""}" data-version="${existing?.version || 1}" class="trust-score-form">
      <div class="trust-score-form-grid"><label>Agreement title<input name="title" required maxlength="160" value="${esc(currentContent?.title || existing?.title || "")}"></label><label>Summary<input name="description" required maxlength="4000" value="${esc(currentContent?.description || existing?.description || "")}"></label></div>
      <fieldset class="trust-score-form trust-score-participant-picker"><legend>Participants and responsibilities</legend><label class="trust-score-check"><input type="checkbox" checked disabled><span><strong>You</strong><input value="Coordinate and uphold the agreed terms." disabled aria-label="Your responsibility"></span></label><label>Find an active NFD member<input id="trust-score-agreement-search" type="search" value="${esc(state.agreementSearch)}" minlength="2" placeholder="Type at least two characters" autocomplete="off"></label><div id="trust-score-agreement-selected" class="trust-score-selected-list"></div><div id="trust-score-agreement-candidates" class="trust-score-candidate-list"></div></fieldset>
      ${fields}${existing ? `<label>Reason for this revision<input name="reason" required maxlength="2000" placeholder="Explain what changed"></label>` : ""}
      <div class="trust-score-actions"><button class="primary">${existing ? "Save new version" : "Save agreement draft"}</button><button type="button" data-trust-action="close-form">Cancel</button></div>
    </form>`;
  }
  function renderProfile() {
    const profile = state.profile || {};
    return `<section class="trust-score-panel"><h2>Your Trust Score profile</h2><p>Keep your public profile accurate. Private profiles are still available to you and people already included in your agreements.</p>${metrics(state.summary)}</section>
      <section class="trust-score-panel"><form id="trust-score-profile-form" class="trust-score-form">
        <div class="trust-score-form-grid"><label>Display name<input value="${esc(profile.name || "NFD member")}" disabled></label><label>Role<input name="role" maxlength="80" value="${esc(profile.role)}" placeholder="e.g. Independent designer"></label></div>
        <div class="trust-score-form-grid"><label>City<input name="city" maxlength="80" value="${esc(profile.city)}" placeholder="City or region"></label><label>Category<select name="category">${["Services", "Business", "Everyday commitments", "Other"].map((category) => `<option ${profile.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></label></div>
        <label>About<textarea name="bio" maxlength="500" placeholder="A short description for your Trust Score profile">${esc(profile.bio)}</textarea></label>
        <label class="trust-score-check"><input type="checkbox" name="directoryVisible" ${profile.directoryVisible ? "checked" : ""}><span>Show my role, city, about text, and Trust Score outcomes in the public Trust Score directory. This also lets discoverable members invite me to commitments. Agreement invitations can be sent to any active NFD account.</span></label>
        <p class="trust-score-note">Only your display name, role, city, category, about text, and participant-confirmed commitment summary are shown in the public directory. Your NFD email address is never included.</p>
        <div class="trust-score-actions"><button class="primary">Save profile</button></div>
      </form></section>`;
  }
  function render() {
    tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.trustView === state.view)));
    if (state.view === "discover") content.innerHTML = renderDiscovery();
    else if (state.view === "commitments") content.innerHTML = renderCommitments();
    else if (state.view === "agreements") content.innerHTML = renderAgreements();
    else content.innerHTML = renderProfile();
  }
  function setView(view) {
    state.view = view;
    if (view === "discover")
      loadPeople()
        .then(render)
        .catch((error) => setStatus(error.message, true));
    else render();
  }
  async function refreshAfterMutation(message) {
    state.editingAgreementId = "";
    if (await refreshAll()) setStatus(message);
  }
  function openNewCommitment(personId = "") {
    setView("commitments");
    const form = document.getElementById("trust-score-commitment-form");
    form.hidden = false;
    const selects = state.people
      .map(
        (person) =>
          `<option value="${esc(person.id)}" ${person.id === personId ? "selected" : ""}>${esc(person.name)}${person.role ? ` · ${esc(person.role)}` : ""}</option>`,
      )
      .join("");
    form.innerHTML = `<h2>Make a clear commitment</h2><p>Everyone must accept before it becomes active. Outcomes count only after every participant confirms fulfillment.</p>
      <form id="trust-score-create-commitment" class="trust-score-form"><div class="trust-score-form-grid"><label>Title<input name="title" required maxlength="160" placeholder="What are you agreeing to do?"></label><label>Category<select name="category">${["Services", "Business", "Everyday commitments", "Other"].map((x) => `<option>${x}</option>`).join("")}</select></label></div><label>Description<textarea name="description" required maxlength="4000" placeholder="Describe the promise and expectations."></textarea></label><div class="trust-score-form-grid"><label>Due date<input type="datetime-local" name="dueAt" required></label><label>Invite NFD people<select name="participantIds" multiple required size="6">${selects}</select><small>Only public Trust Score profiles can be invited.</small></label></div><div class="trust-score-actions"><button class="primary">Save and invite</button><button type="button" data-trust-action="close-form">Cancel</button></div></form>`;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function openAgreement(existing = null, initialPerson = null) {
    state.agreementSelection = new Map();
    state.agreementSearch = "";
    state.agreementCandidates = [];
    if (existing) {
      const currentContent = existing.history.find((entry) => entry.version === existing.version)?.content;
      const participants =
        currentContent?.participants ||
        existing.participants.map((person) => ({
          userId: person.id,
          name: person.name,
          responsibility: person.responsibility,
        }));
      participants.forEach((person) => {
        if (person.userId !== state.userId)
          state.agreementSelection.set(person.userId, {
            name: person.name || "NFD member",
            responsibility:
              person.responsibility || "Fulfill the responsibilities described in this agreement.",
          });
      });
    }
    if (initialPerson?.id && initialPerson.id !== state.userId)
      state.agreementSelection.set(initialPerson.id, {
        name: initialPerson.name || "NFD member",
        responsibility: "Fulfill the responsibilities described in this agreement.",
      });
    state.view = "agreements";
    state.editingAgreementId = existing?.id || "";
    render();
    const form = document.getElementById("trust-score-agreement-form");
    form.hidden = false;
    form.innerHTML = `<h2>${existing ? "Revise agreement · all participants review again" : "Draft an agreement"}</h2><p>Use concrete terms. Replace each [To agree: …] prompt before requesting approval. Each revision is saved as a new version.</p>${agreementForm(existing)}`;
    renderAgreementParticipantPicker();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  tabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.trustView)));
  content.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    const submitButton = form.querySelector("button[type=submit], button:not([type])");
    if (submitButton) submitButton.disabled = true;
    try {
      if (form.id === "trust-score-search") {
        const values = new FormData(form);
        state.search = String(values.get("q") || "").trim();
        state.category = String(values.get("category") || "");
        await loadPeople();
        render();
      } else if (form.id === "trust-score-nfd-search") {
        const values = new FormData(form);
        state.nfdSearch = String(values.get("q") || "").trim();
        await loadNfdPeople(state.nfdSearch);
        render();
      } else if (form.id === "trust-score-profile-form") {
        const values = new FormData(form);
        const result = await api(
          "/profile",
          save({
            role: values.get("role"),
            city: values.get("city"),
            category: values.get("category"),
            bio: values.get("bio"),
            directoryVisible: values.get("directoryVisible") === "on",
          }),
        );
        state.profile = result.profile;
        state.summary = result.summary;
        setStatus("Trust Score profile saved.");
        render();
      } else if (form.id === "trust-score-create-commitment") {
        const values = new FormData(form);
        const participantIds = values.getAll("participantIds").map(String);
        await api(
          "/commitments",
          send({
            title: values.get("title"),
            description: values.get("description"),
            category: values.get("category"),
            dueAt: new Date(String(values.get("dueAt"))).toISOString(),
            participantIds,
          }),
        );
        await refreshAfterMutation("Commitment created. Invitees can respond from their Trust Score page.");
        state.view = "commitments";
        render();
      } else if (form.id === "trust-score-agreement-editor") {
        const values = new FormData(form);
        const selected = [...state.agreementSelection.entries()].map(([userId, person]) => ({
          userId,
          responsibility: person.responsibility.trim(),
        }));
        const body = {
          title: values.get("title"),
          description: values.get("description"),
          participants: [
            { userId: state.userId, responsibility: "Coordinate and uphold the agreed terms." },
            ...selected,
          ],
          terms: Object.fromEntries(Object.keys(labels).map((key) => [key, values.get(key)])),
        };
        if (form.dataset.id) {
          body.version = Number(form.dataset.version);
          body.reason = values.get("reason");
          await api(`/agreements/${form.dataset.id}/revise`, send(body));
          await refreshAfterMutation(
            "New agreement version saved. All participants need to review it again.",
          );
        } else {
          await api("/agreements", send(body));
          await refreshAfterMutation("Draft saved. No invitations were sent yet.");
        }
        state.view = "agreements";
        render();
      } else if (form.dataset.trustForm === "dispute" || form.dataset.trustForm === "resolve") {
        const values = new FormData(form);
        const action = form.dataset.trustForm;
        await api(
          `/commitments/${form.dataset.id}/${action}`,
          send({ resolution: values.get("resolution"), note: values.get("note") }),
        );
        await refreshAfterMutation(
          action === "dispute"
            ? "Dispute opened. The outcome will stay separate until all participants agree."
            : "Resolution recorded. It becomes final only if all participants choose the same outcome.",
        );
        state.view = "commitments";
        render();
      } else if (form.dataset.trustForm === "agreement-response") {
        const values = new FormData(form);
        await api(
          `/agreements/${form.dataset.id}/respond`,
          send({ decision: values.get("decision"), note: values.get("note") }),
        );
        await refreshAfterMutation("Your response was saved for this version.");
        state.view = "agreements";
        render();
      }
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
  content.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".trust-score-agree-person");
    if (!checkbox) return;
    if (checkbox.checked) {
      const person = state.agreementCandidates.find((candidate) => candidate.id === checkbox.value);
      if (person)
        state.agreementSelection.set(person.id, {
          name: person.name,
          responsibility: "Fulfill the responsibilities described in this agreement.",
        });
    } else state.agreementSelection.delete(checkbox.value);
    renderAgreementParticipantPicker();
  });
  let agreementSearchTimer;
  content.addEventListener("input", (event) => {
    if (event.target.id === "trust-score-agreement-search") {
      const query = event.target.value.trim();
      clearTimeout(agreementSearchTimer);
      agreementSearchTimer = setTimeout(() => {
        loadAgreementCandidates(query).catch((error) => setStatus(error.message, true));
      }, 220);
    }
    const responsibility = event.target.closest(".trust-score-responsibility[data-user-id]");
    if (responsibility) {
      const selected = state.agreementSelection.get(responsibility.dataset.userId);
      if (selected) selected.responsibility = responsibility.value;
    }
  });
  content.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-trust-view-button]");
    if (tab) return setView(tab.dataset.trustViewButton);
    if (event.target.closest(".trust-score-retry")) return refreshAll();
    const button = event.target.closest("[data-trust-action]");
    if (!button) return;
    const action = button.dataset.trustAction;
    try {
      if (action === "new-commitment") {
        if (!state.people.length) await loadPeople();
        openNewCommitment();
      } else if (action === "start-commitment") {
        if (!state.people.length) await loadPeople();
        openNewCommitment(button.dataset.user);
      } else if (action === "close-form") {
        document
          .querySelectorAll("#trust-score-commitment-form, #trust-score-agreement-form")
          .forEach((form) => {
            form.hidden = true;
            form.replaceChildren();
          });
      } else if (action === "new-agreement") {
        openAgreement();
      } else if (action === "invite-agreement") {
        openAgreement(null, { id: button.dataset.user, name: button.dataset.name });
      } else if (action === "edit-agreement") {
        const agreement = state.agreements.find((item) => item.id === button.dataset.id);
        openAgreement(agreement);
      } else if (action === "commitment") {
        await api(`/commitments/${button.dataset.id}/${button.dataset.action}`, send({}));
        await refreshAfterMutation(
          `Commitment ${button.dataset.action === "report" ? "reported for fulfillment" : `${button.dataset.action}ed`}.`,
        );
        state.view = "commitments";
        render();
      } else if (action === "agreement" && button.dataset.action === "approve") {
        await api(`/agreements/${button.dataset.id}/respond`, send({ decision: "approved" }));
        await refreshAfterMutation("Your approval was saved for this version.");
        state.view = "agreements";
        render();
      } else if (action === "agreement") {
        await api(`/agreements/${button.dataset.id}/${button.dataset.action}`, send({}));
        await refreshAfterMutation(
          button.dataset.action === "request"
            ? "Approval requested. Participants can review this version in Trust Score."
            : "Agreement status updated.",
        );
        state.view = "agreements";
        render();
      } else if (action === "download-agreement") {
        const agreement = state.agreements.find((item) => item.id === button.dataset.id);
        if (!agreement) return;
        const downloadUrl = URL.createObjectURL(
          new Blob([JSON.stringify(agreement, null, 2)], { type: "application/json" }),
        );
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `nfd-agreement-${agreement.id}-history.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
    } catch (error) {
      setStatus(error.message, true);
    }
  });
  refreshAll();
})();
