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
let messageInboxCursor = null;
let messageInboxEtag = "";
let messageInboxRefreshedAt = 0;
let messageInboxFriends = [];
const messageInboxMore = document.createElement("button");
messageInboxMore.type = "button";
messageInboxMore.className = "secondary-button message-pagination";
messageInboxMore.textContent = "Load more conversations";
messageInboxMore.hidden = true;
messageThreadList.after(messageInboxMore);
messageInboxMore.addEventListener("click", () => loadMessageFriends({ append: true }));
async function loadMessageFriends({ quiet = false, append = false } = {}) {
  if (messageFriendsRefreshInFlight) return [];
  messageFriendsRefreshInFlight = true;
  if (!quiet) {
    messageInboxStatus.textContent = "Loading your friends…";
    messageInboxStatus.classList.remove("error");
  }
  try {
    const response = await fetch(
      `/api/messages${append && messageInboxCursor ? `?cursor=${encodeURIComponent(messageInboxCursor)}` : ""}`,
      {
        headers: {
          accept: "application/json",
          ...(!append && messageInboxEtag ? { "if-none-match": messageInboxEtag } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (response.status === 304) {
      messageInboxRefreshedAt = Date.now();
      return messageInboxFriends;
    }
    if (!append) messageInboxEtag = response.headers.get("etag") || "";
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your messages could not be loaded.");
    currentUserId = result.currentUserId || currentUserId;
    messageInboxRefreshedAt = Date.now();
    const page = result.friends || [];
    if (!append && !quiet) messageInboxFriends = [];
    const merged = new Map(messageInboxFriends.map((friend) => [friend.id, friend]));
    page.forEach((friend) => merged.set(friend.id, friend));
    messageInboxFriends = [...merged.values()];
    if (!quiet || !messageInboxCursor) messageInboxCursor = result.nextCursor || null;
    messageInboxMore.hidden = !messageInboxCursor;
    const friends = messageInboxFriends;
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
let messageHistoryCursor = null;
let messageResponseEtag = "";
let messageHistory = new Map();
const messageHistoryMore = document.createElement("button");
messageHistoryMore.type = "button";
messageHistoryMore.className = "secondary-button message-pagination";
messageHistoryMore.textContent = "Load older messages";
messageHistoryMore.hidden = true;
messageList.before(messageHistoryMore);
messageHistoryMore.addEventListener("click", () => loadFriendMessages({ older: true }));
function renderMessageConversation(result, friendId) {
  if (friendId !== currentMessageFriendId) return;
  messageFriendName.textContent = result.friend?.name || "NFD friend";
  messageThreadHeader.hidden = false;
  messageThreadEmpty.hidden = true;
  messageList.hidden = false;
  messageCompose.hidden = false;
  const nearBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 100;
  for (const message of result.messages || []) messageHistory.set(message.id, message);
  const now = Date.now();
  for (const [id, message] of messageHistory)
    if (
      (message.expiresAt && Date.parse(message.expiresAt) <= now) ||
      Date.parse(message.createdAt) <= now - 90 * 86400000
    )
      messageHistory.delete(id);
  const messages = [...messageHistory.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
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
  const meta = addText(
    bubble,
    "div",
    "message-bubble-meta",
    `${formatMessageTime(message.createdAt)}${own ? ` · ${messageExpiryLabel(message)}` : ""}`,
  );
  meta.title = own && message.seenAt ? `Seen at ${new Date(message.seenAt).toLocaleString()}` : "";
  messageList.append(bubble);
  if (!own && !message.seenAt) observeIncomingMessage(bubble, message, friendId);
}
async function loadFriendMessages({ quiet = false, older = false } = {}) {
  const friendId = currentMessageFriendId;
  if (!friendId || messageRefreshInFlight) return;
  messageRefreshInFlight = true;
  const revision = messageConversationRevision;
  if (!quiet) setMessageFeedback("Loading conversation…");
  try {
    const response = await fetch(
      `/api/messages/${encodeURIComponent(friendId)}${older && messageHistoryCursor ? `?before=${encodeURIComponent(messageHistoryCursor)}` : ""}`,
      {
        headers: {
          accept: "application/json",
          ...(!older && messageResponseEtag ? { "if-none-match": messageResponseEtag } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (response.status === 304) return;
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This conversation could not be loaded.");
    if (friendId !== currentMessageFriendId || revision !== messageConversationRevision) return;
    messageSeenPending = new Set(
      (result.messages || []).filter((message) => message.seenAt).map((message) => message.id),
    );
    if (!older) messageResponseEtag = response.headers.get("etag") || "";
    if (older || messageHistory.size === 0) messageHistoryCursor = result.nextCursor || null;
    messageHistoryMore.hidden = !messageHistoryCursor;
    const previousHeight = messageList.scrollHeight;
    const previousTop = messageList.scrollTop;
    renderMessageConversation(result, friendId);
    if (older) messageList.scrollTop = previousTop + messageList.scrollHeight - previousHeight;
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
  messageHistory = new Map();
  messageHistoryCursor = null;
  messageResponseEtag = "";
  messageHistoryMore.hidden = true;
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
      messageHistory.set(result.message.id, result.message);
      appendMessageBubble(result.message, friendId);
      delete messageList.dataset.signature;
      messageList.scrollTop = messageList.scrollHeight;
      setMessageFeedback("Sent. The one-hour timer starts when your friend sees it.");
    }
    void loadMessageFriends({ quiet: true });
  } catch (error) {
    if (friendId === currentMessageFriendId) {
      setMessageFeedback(
        error.name === "TimeoutError" || error.name === "AbortError"
          ? "Delivery is not confirmed yet. Check the conversation before sending again."
          : error.message,
        true,
      );
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
  messageRefreshTimer = setInterval(
    () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - messageInboxRefreshedAt >= 60000) void loadMessageFriends({ quiet: true });
        void loadFriendMessages({ quiet: true });
      }
    },
    navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || "")
      ? 30000
      : 15000,
  );
}
