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
              if (video.dataset.videoSrc) {
                video.src = video.dataset.videoSrc;
                delete video.dataset.videoSrc;
                video.load();
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
    const categoryHeading = addText(
      titleGroup,
      "h2",
      "feed-category",
      String(experience.shortDescription || experience.experienceCategory || "NFD post").slice(0, 150),
    );
    categoryHeading.title = experience.shortDescription || experience.experienceCategory || "NFD post";
    const headerLabels = document.createElement("div");
    headerLabels.className = "feed-header-labels";
    addText(headerLabels, "span", "feed-experience-type", experience.experienceCategory || "Not provided");
    addText(headerLabels, "span", "feed-incident", experience.incidentCategory || "Not provided");
    header.append(titleGroup, headerLabels);
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
      experience.visibility === "anonymous" ? "Anonymous" : experience.authorName || "NFD member",
    );
    titleGroup.append(author);
    const postContext = document.createElement("div");
    postContext.className = "feed-post-context";
    const contextDetails = document.createElement("div");
    contextDetails.className = "feed-post-context-details";
    const shared = document.createElement("span");
    shared.className = "feed-post-context-item";
    shared.innerHTML = "<strong>Shared</strong> ";
    shared.append(document.createTextNode(prettyDate(experience.createdAt)));
    contextDetails.append(shared);
    if (experience.locationDetails) {
      const area = document.createElement("span");
      area.className = "feed-post-context-item feed-post-location";
      area.innerHTML = "<strong>Area</strong> ";
      area.append(document.createTextNode(experience.locationDetails));
      contextDetails.append(area);
    }
    postContext.append(contextDetails);
    main.append(postContext);
    if (experience.trustReport) {
      const trustNotice = document.createElement("div");
      trustNotice.className = `trust-feed-report${experience.trustReport.polarity === "positive" ? " trust-feed-recognition" : ""}`;
      addText(trustNotice, "strong", "", experience.trustReport.typeLabel || "Unverified allegation");
      addText(
        trustNotice,
        "span",
        "trust-feed-report-detail",
        `${experience.trustReport.classificationLabel} · ${experience.trustReport.outcomeLabel} · About: ${experience.trustReport.subjectName || "NFD member"}`,
      );
      main.append(trustNotice);
    }
    const meta = document.createElement("div");
    meta.className = "feed-meta";
    const place = document.createElement("span");
    place.innerHTML = "<strong>Where</strong> ";
    const placeSummary = [experience.place, experience.placeCategory].filter(Boolean).join(" · ");
    place.append(document.createTextNode(placeSummary || "Not provided"));
    meta.append(place);
    const occurred = document.createElement("span");
    occurred.innerHTML = "<strong>When</strong> ";
    occurred.append(document.createTextNode(experienceTimeText(experience)));
    meta.append(occurred);
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
        link.setAttribute("aria-label", `Open photo: ${file.originalFilename || "attached photo"}`);
        link.addEventListener("click", (event) => {
          event.preventDefault();
          openPhotoViewer(link.href, image.alt);
        });
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
        const videoSource = `/api/evidence/${encodeURIComponent(file.id)}`;
        if (feedVideoPosterObserver) video.dataset.videoSrc = videoSource;
        else video.src = videoSource;
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
    full.append(meta);
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
  const allegationPoll =
    experience.trustReport && experience.trustReport.polarity !== "positive" ? experience.trustReport : null;
  const section = document.createElement("section");
  section.className = "feed-engagement";
  section.setAttribute(
    "aria-label",
    allegationPoll ? "Allegation poll and comments" : "Reactions and comments",
  );
  const controls = document.createElement("div");
  controls.className = "feed-reactions";
  const reactionButtons = new Map();
  const labelButton = (choice) => `${choice[1]} ${choice[2]} · ${counts[choice[0]]}`;
  if (!allegationPoll)
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
  if (allegationPoll) {
    const poll = document.createElement("div");
    poll.className = "feed-allegation-poll";
    addText(poll, "h3", "feed-allegation-poll-question", "Do you believe this allegation?");
    let pollState = {
      total: Number(allegationPoll.poll?.total) || 0,
      believe: Number(allegationPoll.poll?.believe) || 0,
      notBelieve: Number(allegationPoll.poll?.notBelieve) || 0,
    };
    let myVote = allegationPoll.myVote || "";
    const pollResult = addText(poll, "p", "feed-allegation-poll-result", "");
    const options = document.createElement("div");
    options.className = "feed-allegation-poll-options";
    const pollSummary = document.createElement("div");
    pollSummary.className = "feed-allegation-poll-summary";
    const pollBar = document.createElement("div");
    pollBar.className = "feed-allegation-poll-bar";
    pollBar.setAttribute("role", "img");
    const believeBar = document.createElement("span");
    believeBar.className = "feed-allegation-poll-believe";
    const notBelieveBar = document.createElement("span");
    notBelieveBar.className = "feed-allegation-poll-disbelieve";
    pollBar.append(believeBar, notBelieveBar);
    pollSummary.append(pollBar, pollResult);
    const pollRow = document.createElement("div");
    pollRow.className = "feed-allegation-poll-row";
    pollRow.append(options, pollSummary);
    const updatePoll = () => {
      const believePercent = pollState.total ? Math.round((pollState.believe * 100) / pollState.total) : 0;
      const notBelievePercent = pollState.total ? 100 - believePercent : 0;
      believeBar.style.width = `${believePercent}%`;
      notBelieveBar.style.width = `${notBelievePercent}%`;
      pollBar.setAttribute(
        "aria-label",
        `Believe ${believePercent} percent; don’t believe ${notBelievePercent} percent`,
      );
      pollResult.textContent = pollState.total
        ? `${pollState.believe} believe (${believePercent}%) · ${pollState.notBelieve} don’t believe (${notBelievePercent}%) · ${pollState.total} votes · Private`
        : "No votes yet · Private";
      pollButtons.forEach(({ button, choice, label }) => {
        const count = choice === "believe" ? pollState.believe : pollState.notBelieve;
        button.textContent = pollState.total ? `${label} · ${count}` : label;
        button.setAttribute("aria-pressed", String(myVote === choice));
        button.setAttribute("aria-label", `${label}, ${count} votes`);
        button.classList.toggle("is-selected", myVote === choice);
        button.hidden = !allegationPoll.canVote;
      });
    };
    const pollButtons = [];
    for (const [choice, label] of [
      ["believe", "Believe"],
      ["not_believe", "Don’t believe"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "feed-allegation-poll-option";
      button.addEventListener("click", async () => {
        pollButtons.forEach((item) => (item.button.disabled = true));
        try {
          const response = await fetch(
            `/api/trust-score/allegations/${encodeURIComponent(allegationPoll.id)}/vote`,
            {
              method: "POST",
              headers: { "content-type": "application/json", accept: "application/json" },
              body: JSON.stringify({ choice }),
            },
          );
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "Your poll response could not be saved.");
          pollState = {
            total: Number(result.poll?.total) || 0,
            believe: Number(result.poll?.believe) || 0,
            notBelieve: Number(result.poll?.notBelieve) || 0,
          };
          myVote = choice;
          updatePoll();
          feedback.textContent = "Your response is private. Only poll totals are shown.";
        } catch (error) {
          feedback.textContent = error.message;
        } finally {
          pollButtons.forEach((item) => (item.button.disabled = false));
        }
      });
      pollButtons.push({ button, choice, label });
      options.append(button);
    }
    poll.append(pollRow);
    if (!allegationPoll.canVote) {
      addText(
        poll,
        "p",
        "feed-allegation-poll-privacy",
        "The person named in this allegation can’t vote. Voter identities stay private.",
      );
    }
    section.append(poll);
    updatePoll();
  }
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
