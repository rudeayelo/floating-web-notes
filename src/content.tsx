import "./font-face.css";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useState } from "react";
import TurndownService from "turndown";
import { App } from "./App";
import { Api } from "./api";
import { ShadowDom } from "./components/ShadowDom";
import { render } from "./utils/render";

/* -------------------------------------------------------------------------- */
/*                          NOTES TO MARKDOWN SCRIPT                          */
/* ----------------------- Remove after version 0.1.5 ----------------------- */
/* -------------------------------------------------------------------------- */
const notesToMarkdown = async () => {
  const turndownService = new TurndownService();

  const toMarkdown = (html: string) => {
    return turndownService.turndown(html);
  };

  const allNotes = await Api.get.allNotes();
  for (const note of allNotes) {
    if (note.text?.trim().startsWith("<")) {
      console.log(`Note ${note.id} is likely HTML, converting to Markdown.`);

      const markdown = toMarkdown(note.text);

      await Api.set.note({
        id: note.id,
        pattern: note.pattern,
        text: markdown,
      });
    }
  }
};

notesToMarkdown();
/* -------------------------------------------------------------------------- */
/*                        END NOTES TO MARKDOWN SCRIPT                        */
/* -------------------------------------------------------------------------- */

export const FloatingWebNotes = () => {
  const [parentElement] = useState(() => document.querySelector("body"));

  return parentElement ? (
    <Tooltip.Provider delayDuration={0} disableHoverableContent={true}>
      <ShadowDom parentElement={parentElement}>
        <App />
      </ShadowDom>
    </Tooltip.Provider>
  ) : null;
};

render(<FloatingWebNotes />);
