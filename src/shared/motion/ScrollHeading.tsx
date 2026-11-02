import { Fragment } from "react";
import "./scrollText.css";

/** Keep the complete heading accessible while its visual words can unfold. */
export function ScrollHeading({ id, lines, words = false }: {
  id?: string; lines: readonly string[]; words?: boolean;
}) {
  return <h2 id={id} className="scroll-heading" data-text-reveal={words ? "words" : "lines"} aria-label={lines.join(" ")}>
    {lines.map(line => <span className="scroll-title-mask" key={line} aria-hidden="true">
      <span className="scroll-title-line">
        {words ? line.split(" ").map((word, index) => <Fragment key={`${word}-${index}`}>
          {index > 0 && " "}<span className="scroll-title-word">{word}</span>
        </Fragment>) : line}
      </span>
    </span>)}
  </h2>;
}
