import Markdown from "react-markdown";
import styles from "./assistant-message.module.css";

/** Generated prose is formatting, never executable HTML or an action surface.
 * Product/source actions remain in the validated application cards. */
export function AssistantMessage({ text }: { text: string }) {
  return (
    <div className={styles.message}>
      <Markdown
        skipHtml
        components={{
          a: ({ children }) => <span>{children}</span>,
          img: () => null,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
