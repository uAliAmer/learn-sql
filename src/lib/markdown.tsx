import { Fragment, type ReactNode } from "react";

/**
 * Tiny inline renderer for lesson text. Supports `**bold**`, `` `code` ``,
 * and blank-line paragraph breaks. Not a real markdown parser — just enough
 * for the lesson prompts.
 */
export function renderText(text: string): ReactNode {
  return text.split("\n\n").map((para, i) => <p key={i}>{renderInline(para)}</p>);
}

function renderInline(text: string): ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <strong key={i}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return <code key={i}>{tok.slice(1, -1)}</code>;
    }
    return <Fragment key={i}>{tok}</Fragment>;
  });
}
