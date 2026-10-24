# Test conversational website control

Use the configured local app at `http://localhost:3000`. Open **Talk to DALE**. Ordinary wording is supported; these are examples, not required commands. Use actual published listings and exact variants when testing purchases.

| Try | Expected visible result |
| --- | --- |
| “Take me to Louis Vuitton Imagination.” | DALE retrieves actual listings, resolves or clarifies the variant, then opens the selected product. The page and listing name agree. |
| “Open electronics, then laptops.” | The real department/category opens; chat remains available. |
| “Show Samsung phones under $900, cheapest first.” | A search page with the requested brand, category, price bound and sort. Prices currently use USD. |
| “Next page.” / “Clear the budget limit.” | Pagination retains the other filters; removing one condition preserves the rest. |
| “Open [exact product A] and [exact product B] in separate new browser tabs.” | Two actual product pages open. The source page remains. Each target must register as rendered before success. |
| “Compare the products in those tabs.” | The comparison contains exactly those listings. |
| “Add two of the product in the second tab.” | The server cart contains the intended product and quantity. A separate already-open DALE cart updates too. |
| “Close the tabs you opened.” | Agent-created tabs close; the source page remains. A browser restriction or missing handle is reported accurately. |
| “Add two of this bottle, then show my cart.” | Two units of the exact viewed SKU appear in the real cart. No order or payment is created. |
| “Actually one, not two.” | The correct cart line changes to quantity one; unrelated items stay. |
| “Save this to my wishlist.” / “Move it from my wishlist into my cart.” | Real owner-scoped collections update; move removes the source entry. |
| “Undo the last basket change.” | A supported agent change is reversed only if newer manual changes would not be overwritten. |
| “Open the shopping brief menu and change the budget to 250.” | DALE discovers the actual controls, opens the real menu and changes its input. This alone does not approve a purchase or save new requirements. |
| “Review checkout for this product.” | The existing single-product quote review opens. Existing brief validation still applies. |
| “Checkout my cart.” | Exact cart terms and existing confirmation appear. Payment still needs the customer's PayPal approval. |
| “Show group deals for this product; I want to join.” | Current terms and a real group commitment confirmation appear. Join from a separate account/device to verify distinct membership. |
| “Show my orders.” / “Help me with this order.” | Only the current shopper's orders are available. Existing return/cancellation/remedy workflows retain their confirmation steps. |
| Ask a general question or chat casually | Gemini answers naturally. Website actions are optional capabilities, not a mandatory reply format. |

## Recovery checks

- Block site popups, request two tabs: the task must remain pending, not report success. Click **Open requested tabs** or allow site popups, then resume. Already opened targets should not multiply.
- Refresh during a task: inspect state and choose **Resume saved task** when the previous worker has stopped. A committed add must not happen twice.
- Click **Stop**: remaining steps must stop. Effects already completed remain visible.
- Edit the basket manually in another tab, then ask to undo an older change: it must refuse to overwrite newer edits.
- Sign out/switch accounts: old pending tasks must not mutate the new account. New chat retains the customer's collections but starts fresh conversation memory.
- Reload after a completed task: history and basket remain saved.

Browser focus/closing, popups, authentication, microphone permission, file picking and PayPal approval retain browser/provider requirements. A file input or password must not be silently filled by generated script. Distinct product variants are catalog SKUs; the current product page has no separate gallery or variant dropdown.

Automated fixture tests prove the browser/service contracts. Live Gemini evidence separately proves whether the configured model chooses the correct operations from ordinary wording. Neither substitutes for the other. See `WEBSITE_CONTROL_STATUS.md` for actual qualification results and remaining work.
