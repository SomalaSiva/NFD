import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(
  new URL("../web/assets/app/parts/04-stories-messages.js", import.meta.url),
  "utf8",
);
const handler = source.slice(
  source.indexOf('messageCompose.addEventListener("submit"'),
  source.indexOf("async function loadMessagesPage"),
);
function harness(fetch) {
  let submit;
  const appended = [];
  const feedback = [];
  const context = {
    currentMessageFriendId: "friend-a",
    messageConversationRevision: 0,
    messageInput: { value: "hello" },
    messageSend: { disabled: false, textContent: "Send" },
    messageList: { dataset: {}, scrollHeight: 100 },
    messageCompose: {
      addEventListener: (_, fn) => {
        submit = fn;
      },
    },
    fetch,
    AbortSignal,
    appendMessageBubble: (message, friend) => appended.push({ message, friend }),
    setMessageFeedback: (text) => feedback.push(text),
    loadMessageFriends: () => new Promise(() => {}),
    loadFriendMessages: async () => {},
  };
  vm.runInNewContext(handler, context);
  return { context, appended, feedback, submit: () => submit({ preventDefault() {} }) };
}
test("saved message appears and Send unlocks even when inbox refresh never resolves", async () => {
  const h = harness(async () => ({ ok: true, json: async () => ({ message: { id: "saved" } }) }));
  await h.submit();
  assert.equal(h.context.messageSend.disabled, false);
  assert.equal(h.context.messageInput.value, "");
  assert.equal(h.appended[0].message.id, "saved");
  assert.equal(h.context.messageConversationRevision, 1);
});
test("double submit sends only once and preserves a newly typed draft", async () => {
  let finish;
  let calls = 0;
  const h = harness(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const pending = h.submit();
  await h.submit();
  h.context.messageInput.value = "next message";
  finish({ ok: true, json: async () => ({ message: { id: "saved" } }) });
  await pending;
  assert.equal(calls, 1);
  assert.equal(h.context.messageInput.value, "next message");
});
test("switching conversations while sending never inserts into the wrong conversation", async () => {
  let finish;
  const h = harness(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = h.submit();
  h.context.currentMessageFriendId = "friend-b";
  finish({ ok: true, json: async () => ({ message: { id: "saved" } }) });
  await pending;
  assert.equal(h.appended.length, 0);
  assert.equal(h.feedback.length, 0);
});
test("uncertain delivery preserves draft, unlocks composer and does not automatically resend", async () => {
  let calls = 0;
  const h = harness(async () => {
    calls++;
    throw Object.assign(new Error("timeout"), { name: "TimeoutError" });
  });
  await h.submit();
  assert.equal(calls, 1);
  assert.equal(h.context.messageSend.disabled, false);
  assert.equal(h.context.messageInput.value, "hello");
  assert.match(h.feedback[0], /not confirmed/);
});
