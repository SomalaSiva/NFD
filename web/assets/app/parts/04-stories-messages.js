function refreshMessagesOnReturn() {
  if (document.visibilityState !== "visible") return;
  void refreshMessageNavBadge();
  if (location.pathname === "/messages") {
    void loadMessageFriends({ quiet: true });
    void loadFriendMessages({ quiet: true });
  }
}
window.addEventListener("focus", refreshMessagesOnReturn);
window.addEventListener("pageshow", refreshMessagesOnReturn);
window.addEventListener("online", refreshMessagesOnReturn);
document.addEventListener("visibilitychange", refreshMessagesOnReturn);
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
      signal: AbortSignal.timeout(15000),
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
  profilePhotoSave.hidden = !file;
});
profileBioInput.addEventListener("input", () => {
  profileBioCount.textContent = `${profileBioInput.value.length}/160`;
});
function markProfileDetailsEdited() {
  if (profileDetailsSave.textContent === "Saved") {
    profileDetailsSave.textContent = "Save profile";
    profileDetailsSave.disabled = false;
  }
}
profileDetailsForm.addEventListener("input", markProfileDetailsEdited);
profileDetailsForm.addEventListener("change", markProfileDetailsEdited);
profileDetailsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileDetailsSave.disabled = true;
  profileDetailsFeedback.hidden = false;
  profileDetailsFeedback.classList.remove("error");
  profileDetailsFeedback.textContent = "Saving your profile…";
  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        displayName: profileDisplayNameInput.value,
        username: profileUsernameInput.value,
        bio: profileBioInput.value,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your profile could not be updated.");
    const feedback = profileDetailsFeedback;
    await loadProfile();
    feedback.hidden = false;
    feedback.classList.remove("error");
    feedback.textContent = "Profile updated.";
    profileDetailsSave.textContent = "Saved";
    profileDetailsSave.disabled = true;
  } catch (error) {
    profileDetailsFeedback.hidden = false;
    profileDetailsFeedback.classList.add("error");
    profileDetailsFeedback.textContent = error.message;
  } finally {
    if (profileDetailsSave.textContent !== "Saved") profileDetailsSave.disabled = false;
  }
});
document.querySelector(".profile-photo-camera")?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  profilePhotoFile.click();
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
    profilePhotoSave.hidden = true;
    await loadStories();
  } catch (error) {
    profilePhotoFeedback.textContent = error.message;
    profilePhotoSave.disabled = false;
    profilePhotoSave.hidden = false;
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
async function loadMessageFriends({ quiet = false } = {}) {
  if (messageFriendsRefreshInFlight) return [];
  messageFriendsRefreshInFlight = true;
  if (!quiet) {
    messageInboxStatus.textContent = "Loading your friends…";
    messageInboxStatus.classList.remove("error");
  }
  try {
    const response = await fetch("/api/messages", {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your messages could not be loaded.");
    currentUserId = result.currentUserId || currentUserId;
    const friends = result.friends || [];
    messageThreadList.replaceChildren();
    if (!quiet) {
      messageInboxStatus.textContent = friends.length
        ? `${friends.length} ${friends.length === 1 ? "friend" : "friends"}`
        : "Your accepted friends will appear here.";
    }
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
    if (!quiet) {
      messageInboxStatus.textContent = error.message;
      messageInboxStatus.classList.add("error");
    }
    return [];
  } finally {
    messageFriendsRefreshInFlight = false;
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
let messageConversationRevision = 0;
function renderMessageConversation(result, friendId) {
  if (friendId !== currentMessageFriendId) return;
  messageFriendName.textContent = result.friend?.name || "NFD friend";
  messageThreadHeader.hidden = false;
  messageThreadEmpty.hidden = true;
  messageList.hidden = false;
  messageCompose.hidden = false;
  const nearBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 100;
  const messages = result.messages || [];
  const signature = JSON.stringify([friendId, messages]);
  if (messageList.dataset.signature === signature) return;
  messageList.dataset.signature = signature;
  messageSeenObserver?.disconnect();
  messageList.replaceChildren();
  if (!messages.length)
    addText(
      messageList,
      "p",
      "message-empty-conversation",
      "No messages here yet. Say hi when you’re ready.",
    );
  messages.forEach((message) => appendMessageBubble(message, friendId));
  if (!messages.length || nearBottom) messageList.scrollTop = messageList.scrollHeight;
}
function appendMessageBubble(message, friendId) {
  if (friendId !== currentMessageFriendId) return;
  if ([...messageList.children].some((child) => child.dataset.messageId === message.id)) return;
  messageList.querySelector(".message-empty-conversation")?.remove();
  const own = message.senderId === currentUserId;
  const bubble = document.createElement("article");
  bubble.className = `message-bubble${own ? " own" : ""}`;
  bubble.dataset.messageId = message.id;
  addText(bubble, "div", "message-bubble-text", message.body);
  const meta = addText(bubble, "div", "message-bubble-meta",
    `${formatMessageTime(message.createdAt)}${own ? ` · ${messageExpiryLabel(message)}` : ""}`);
  meta.title = own && message.seenAt ? `Seen at ${new Date(message.seenAt).toLocaleString()}` : "";
  messageList.append(bubble);
  if (!own && !message.seenAt) observeIncomingMessage(bubble, message, friendId);
}
async function loadFriendMessages({ quiet = false } = {}) {
  const friendId = currentMessageFriendId;
  if (!friendId || messageRefreshInFlight) return;
  messageRefreshInFlight = true;
  const revision = messageConversationRevision;
  if (!quiet) setMessageFeedback("Loading conversation…");
  try {
    const response = await fetch(`/api/messages/${encodeURIComponent(friendId)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This conversation could not be loaded.");
    if (friendId !== currentMessageFriendId || revision !== messageConversationRevision) return;
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
  messageConversationRevision++;
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
  if (messageSend.disabled || !currentMessageFriendId || !messageInput.value.trim()) return;
  const friendId = currentMessageFriendId;
  const body = messageInput.value;
  messageSend.disabled = true;
  messageSend.textContent = "Sending…";
  try {
    const response = await fetch(`/api/messages/${encodeURIComponent(friendId)}`, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ body }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your message could not be sent.");
    messageConversationRevision++;
    if (friendId === currentMessageFriendId) {
      if (messageInput.value === body) messageInput.value = "";
      appendMessageBubble(result.message, friendId);
      delete messageList.dataset.signature;
      messageList.scrollTop = messageList.scrollHeight;
      setMessageFeedback("Sent. The one-hour timer starts when your friend sees it.");
    }
    void loadMessageFriends({ quiet: true });
  } catch (error) {
    if (friendId === currentMessageFriendId) {
      setMessageFeedback(error.name === "TimeoutError" || error.name === "AbortError"
        ? "Delivery is not confirmed yet. Check the conversation before sending again."
        : error.message, true);
      void loadFriendMessages({ quiet: true });
    }
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
