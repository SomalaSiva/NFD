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
