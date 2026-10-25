import { registeredPath } from "@/domain/site-routes";
import type {
  BrowserAction,
  BrowserOperation,
  UIContext,
} from "@/domain/concierge";

let identity: string;
const handles = new Map<string, Window>();
const controls = new Map<string, HTMLElement>();
export function browserTabId() {
  if (!identity) {
    identity = /^dale:[0-9a-f-]{36}$/.test(window.name)
      ? window.name.slice(5)
      : crypto.randomUUID();
    window.name = `dale:${identity}`;
  }
  return identity;
}
function hash(value: string) {
  let h = 2166136261;
  for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}
/** Only registered links and explicitly opted-in component controls are executable.
 * No model selectors, script execution, credential fields or approval buttons. */
export function observeControls(): UIContext["controls"] {
  controls.clear();
  const result: UIContext["controls"] = [];
  const elements = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-agent-control], [data-agent-customer] form input, [data-agent-customer] form select, [data-agent-customer] form textarea, main details",
    ),
    ...document.querySelectorAll<HTMLElement>("main a[href]"),
  ];
  for (const el of elements) {
    if (
      el.closest("[data-copilot-panel], [inert], [aria-hidden='true']") ||
      el.hasAttribute("disabled") ||
      el.getAttribute("aria-hidden") === "true" ||
      el.getClientRects().length === 0
    )
      continue;
    const href =
      el instanceof HTMLAnchorElement ? el.getAttribute("href") : undefined;
    if (href && !registeredPath(href)) continue;
    if (
      el instanceof HTMLInputElement &&
      ["password", "hidden"].includes(el.type)
    )
      continue;
    const label = (
      el.getAttribute("aria-label") ||
      el.getAttribute("data-agent-control") ||
      el.closest("label")?.textContent ||
      el.textContent ||
      ""
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 160);
    if (!label) continue;
    const id = hash(
      `${window.location.pathname}:${href || el.getAttribute("data-agent-control") || `${el.getAttribute("name") || ""}:${label}`}`,
    );
    if (controls.has(id)) continue;
    const kind =
      el instanceof HTMLInputElement && el.type === "file"
        ? "file"
        : el instanceof HTMLAnchorElement
          ? "link"
          : el instanceof HTMLSelectElement
            ? "select"
            : el instanceof HTMLInputElement ||
                el instanceof HTMLTextAreaElement
              ? "input"
              : el instanceof HTMLDetailsElement
                ? "details"
                : "button";
    controls.set(id, el);
    result.push({
      id,
      label,
      kind,
      ...(el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
        ? { required: el.required, valid: el.validity.valid }
        : {}),
      ...(el instanceof HTMLInputElement && el.type === "file"
        ? {
            value: Array.from(el.files || [])
              .map((f) => f.name)
              .join(", ")
              .slice(0, 500),
            options: el.accept.split(",").filter(Boolean),
          }
        : el instanceof HTMLDetailsElement
          ? { value: el.open ? "open" : "closed" }
          : el instanceof HTMLInputElement &&
              ["checkbox", "radio"].includes(el.type)
            ? { value: String(el.checked), options: ["true", "false"] }
            : "value" in el
              ? { value: String(el.value).slice(0, 500) }
              : {}),
      ...(el instanceof HTMLSelectElement
        ? {
            options: Array.from(el.options)
              .map((o) => `${o.value}: ${o.label}`.slice(0, 160))
              .slice(0, 100),
          }
        : {}),
    });
    if (result.length >= 80) break;
  }
  return result;
}
export async function waitForPage(path: string, signal: AbortSignal) {
  const url = new URL(path, location.origin);
  const until = Date.now() + 20000;
  while (Date.now() < until) {
    signal.throwIfAborted();
    const page = document.querySelector<HTMLElement>("[data-concierge-page]");
    const id = url.pathname.startsWith("/product/")
      ? decodeURIComponent(url.pathname.slice(9))
      : null;
    const product = id
      ? Array.from(
          document.querySelectorAll<HTMLElement>(".pdp-page[data-product-id]"),
        ).some((el) => el.dataset.productId === id)
      : true;
    const needsReady =
      ["/", "/shop", "/search", "/compare", "/cart", "/wishlist"].includes(
        url.pathname,
      ) || url.pathname.startsWith("/category/");
    const ready = needsReady
      ? page?.dataset.conciergePage === url.pathname &&
        page.dataset.ready === "true"
      : Boolean(document.querySelector("main h1"));
    if (
      location.pathname === url.pathname &&
      location.search === url.search &&
      product &&
      ready
    )
      return;
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error("The requested page did not finish rendering.");
}
export async function localBrowserOperation(
  operation: Exclude<BrowserOperation, { type: "tabs" } | { type: "tab" }>,
  push: (path: string) => void,
  signal: AbortSignal,
) {
  if (operation.type === "navigate") {
    if (!registeredPath(operation.path))
      throw new Error("Unregistered destination.");
    push(operation.path);
    await waitForPage(operation.path, signal);
    return "Requested page rendered.";
  }
  if (operation.type === "history") {
    const before = location.href;
    if (operation.direction === "back") history.back();
    else history.forward();
    for (let i = 0; i < 40 && location.href === before; i++) {
      signal.throwIfAborted();
      await new Promise((r) => setTimeout(r, 50));
    }
    if (location.href === before)
      throw new Error("No browser history destination was observed.");
    if (!registeredPath(location.pathname + location.search))
      throw new Error("Browser left the registered DALE pages.");
    await waitForPage(location.pathname + location.search, signal);
    return "Browser history destination rendered.";
  }
  if (operation.type === "scroll") {
    if (operation.product_id) {
      const el = Array.from(
        document.querySelectorAll<HTMLElement>("[data-product-id]"),
      ).find((el) => el.dataset.productId === operation.product_id);
      if (!el)
        throw new Error("This product is not rendered on the current page.");
      el.scrollIntoView({ block: "center", behavior: "instant" });
      el.focus({ preventScroll: true });
    } else {
      const target =
        operation.direction === "top"
          ? 0
          : operation.direction === "bottom"
            ? document.documentElement.scrollHeight
            : window.scrollY +
              window.innerHeight *
                (operation.direction === "previous" ? -0.8 : 0.8);
      window.scrollTo({ top: target, behavior: "instant" });
    }
    return "Page scroll completed.";
  }
  const el = controls.get(operation.control_id);
  if (!el || !el.isConnected || el.hasAttribute("disabled"))
    throw new Error(
      "This control changed or disappeared. Read the page again.",
    );
  el.scrollIntoView({ block: "center", behavior: "instant" });
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    if (el instanceof HTMLInputElement && el.type === "file") {
      const files = Array.from(el.files || []);
      if (!files.length) throw new Error("No file has been selected.");
      return `Selected ${files.map((f) => `${f.name} (${f.size} bytes)`).join(", ")}. The form has not been submitted.`;
    }
    if (operation.value === undefined)
      throw new Error("This control requires a value.");
    if (
      el instanceof HTMLInputElement &&
      ["checkbox", "radio"].includes(el.type)
    ) {
      if (!["true", "false"].includes(operation.value))
        throw new Error("Choose true or false for this control.");
      const desired = operation.value === "true";
      if (el.checked !== desired) el.click();
      if (el.checked !== desired)
        throw new Error("The selection did not change.");
      return `Selection is ${el.checked}.`;
    }
    if (
      el instanceof HTMLSelectElement &&
      !Array.from(el.options).some((o) => o.value === operation.value)
    )
      throw new Error("That option is not available.");
    const setter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(el, operation.value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    if (el.value !== operation.value)
      throw new Error("The control did not retain the requested value.");
    return `Changed ${el.getAttribute("data-agent-control") || "field"} to ${el.value}.`;
  }
  if (el instanceof HTMLDetailsElement) {
    el.open =
      operation.value === "closed"
        ? false
        : operation.value === "open"
          ? true
          : !el.open;
    return `Details are ${el.open ? "open" : "closed"}.`;
  }
  if (el instanceof HTMLAnchorElement) {
    const path = el.getAttribute("href")!;
    if (!registeredPath(path)) throw new Error("Unregistered destination.");
    push(path);
    await waitForPage(path, signal);
    return "Linked destination rendered.";
  }
  const snapshot = () =>
    JSON.stringify({
      url: location.href,
      controls: observeControls(),
      dialogs: Array.from(document.querySelectorAll('[role="dialog"]'))
        .filter((d) => d.getAttribute("aria-hidden") !== "true")
        .map((d) => d.textContent?.slice(0, 500)),
    });
  const before = snapshot();
  const oldError = document.querySelector('[role="alert"]')?.textContent;
  if (
    el instanceof HTMLButtonElement &&
    el.type === "submit" &&
    el.form &&
    !el.form.checkValidity()
  )
    throw new Error(
      "The form still has incomplete or invalid fields. Inspect its controls before submitting.",
    );
  el.click();
  for (let i = 0; i < 200; i++) {
    signal.throwIfAborted();
    await new Promise((r) => setTimeout(r, 100));
    const error = document.querySelector('[role="alert"]')?.textContent;
    if (error && error !== oldError) throw new Error(error.slice(0, 300));
    if (el.isConnected && el.matches(":disabled")) continue;
    if (snapshot() !== before) {
      if (registeredPath(location.pathname + location.search))
        await waitForPage(location.pathname + location.search, signal);
      return "Observed the component state change. Current controls and page state follow in the receipt.";
    }
  }
  throw new Error(
    "No component state change was observed. Inspect the current page before retrying.",
  );
}
const fileFingerprint = (el: HTMLInputElement) =>
  JSON.stringify(
    Array.from(el.files || []).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
    })),
  );
const fileSelectionKey = (action: BrowserAction) =>
  `dale-file-choice:${action.id}:${browserTabId()}`;
export function fileSelectionReady(action: BrowserAction) {
  if (action.operation.type !== "control") return false;
  const el = controls.get(action.operation.control_id);
  return (
    el instanceof HTMLInputElement &&
    el.type === "file" &&
    Boolean(el.files?.length) &&
    sessionStorage.getItem(fileSelectionKey(action)) === fileFingerprint(el)
  );
}
/** Called directly from the shopper's recovery button, preserving a real user
 * gesture. Only the existing input receives files; paths/bytes never enter tool arguments. */
export function chooseActionFile(
  action: BrowserAction,
  onSelected: () => void,
) {
  if (action.operation.type !== "control")
    throw new Error("This task is not waiting for a file.");
  const el = controls.get(action.operation.control_id);
  if (
    !(el instanceof HTMLInputElement) ||
    el.type !== "file" ||
    !el.isConnected
  )
    throw new Error("The file input is no longer present. Reopen its form.");
  const cleanup = () => {
    el.removeEventListener("change", selected);
    el.removeEventListener("cancel", cleanup);
  };
  const selected = () => {
    cleanup();
    if (el.files?.length) {
      sessionStorage.setItem(fileSelectionKey(action), fileFingerprint(el));
      onSelected();
    }
  };
  el.addEventListener("change", selected, { once: true });
  el.addEventListener("cancel", cleanup, { once: true });
  el.click();
}
export function openActionTabs(action: BrowserAction) {
  for (const target of action.targets || []) {
    if (!registeredPath(target.path)) continue;
    const old = handles.get(target.tabId);
    if (old && !old.closed) continue;
    const tab = window.open(target.path, `dale:${target.tabId}`);
    if (tab) {
      tab.opener = null;
      handles.set(target.tabId, tab);
    }
  }
}
export function closeActionTab(tabId: string) {
  const tab = handles.get(tabId);
  if (!tab)
    throw new Error(
      "This page no longer has the browser handle needed to verify closing that tab. Close it manually.",
    );
  tab.close();
  if (!tab.closed) throw new Error("The browser did not close this tab.");
  handles.delete(tabId);
}
