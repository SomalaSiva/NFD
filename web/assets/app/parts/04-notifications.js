const notificationList = document.getElementById("notification-list");
const notificationStatus = document.getElementById("notifications-status");
const notificationRead = document.getElementById("notifications-read");
const notificationMore = document.getElementById("notifications-more");
const notificationRefresh = document.getElementById("notifications-refresh");
let notificationCursor = null;
let notificationSnapshot = "";
let notificationsLoading = false;
async function loadNotifications(append = false) {
  if (notificationsLoading) return;
  notificationsLoading = true;
  notificationRefresh.disabled = true;
  notificationMore.disabled = true;
  notificationRead.disabled = true;
  notificationStatus.textContent = "Loading notifications…";
  try {
    const response = await fetch(
      `/api/notifications${append && notificationCursor ? `?cursor=${encodeURIComponent(notificationCursor)}` : ""}`,
      {
        headers: { accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Notifications could not be loaded.");
    if (!append) {
      notificationList.replaceChildren();
      notificationSnapshot = result.snapshotAt;
    }
    for (const item of result.items) {
      const row = document.createElement("li");
      row.className = `notification-item${item.unread ? " unread" : ""}`;
      const link = document.createElement("a");
      link.href = item.href;
      const label =
        item.kind === "request"
          ? `${item.name} sent you a friend request`
          : item.kind === "accepted"
            ? `${item.name} accepted your friend request`
            : `${item.name} sent you a message`;
      addText(link, "span", "notification-title", label);
      addText(link, "span", "notification-date", new Date(item.createdAt).toLocaleString());
      if (item.unread) addText(link, "span", "notification-unread", "Unread");
      if (item.unread) {
        link.addEventListener("click", () => {
          row.classList.remove("unread");
          row.querySelector(".notification-unread")?.remove();
          void fetch("/api/notifications", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ notificationId: item.id }),
            keepalive: true,
          })
            .then((response) => {
              if (response.ok) void refreshMessageNavBadge();
            })
            .catch(() => {});
        });
      }
      row.append(link);
      notificationList.append(row);
    }
    notificationCursor = result.nextCursor;
    notificationMore.hidden = !notificationCursor;
    notificationStatus.textContent = notificationList.children.length
      ? ""
      : "You’re all caught up. New updates will appear here.";
    void refreshMessageNavBadge();
  } catch (error) {
    notificationStatus.textContent = error.message || "Notifications could not be loaded. Please try again.";
  } finally {
    notificationsLoading = false;
    notificationRefresh.disabled = false;
    notificationMore.disabled = false;
    notificationRead.disabled = !notificationSnapshot || !notificationList.children.length;
  }
}
notificationRefresh.addEventListener("click", () => loadNotifications());
notificationMore.addEventListener("click", () => loadNotifications(true));
notificationRead.addEventListener("click", async () => {
  notificationRead.disabled = true;
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ readAt: notificationSnapshot }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Notifications could not be marked read. Please try again.");
    notificationList.querySelectorAll(".unread").forEach((row) => row.classList.remove("unread"));
    notificationList.querySelectorAll(".notification-unread").forEach((label) => label.remove());
    notificationStatus.textContent = "Notifications marked read.";
    void refreshMessageNavBadge();
  } catch (error) {
    notificationStatus.textContent = error.message;
  } finally {
    notificationRead.disabled = false;
  }
});
