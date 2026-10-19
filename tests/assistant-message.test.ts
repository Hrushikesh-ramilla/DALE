import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AssistantMessage } from "../src/components/copilot/assistant-message";

it("renders natural model paragraphs and lists without displaying raw Markdown markers", () => {
  const html = renderToStaticMarkup(
    createElement(AssistantMessage, {
      text: "A **soft** scent.\n\n- First choice\n- Second choice",
    }),
  );
  expect(html).toContain("<strong>soft</strong>");
  expect(html).toContain("<ul>");
  expect(html).not.toContain("**soft**");
});
it("does not turn generated HTML, images or links into executable content or shopping actions", () => {
  const html = renderToStaticMarkup(
    createElement(AssistantMessage, {
      text: '<script>alert(1)</script>\n\n<img src="https://untrusted.example/pixel">\n\n![tracking](https://untrusted.example/pixel)\n\n[click](javascript:alert%281%29)\n\n[product](https://untrusted.example/product)',
    }),
  );
  expect(html).not.toMatch(/<script|<img|<a\s|href=|src=/i);
  expect(html).toContain("product");
});
