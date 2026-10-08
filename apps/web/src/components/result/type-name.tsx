import { Fragment } from "react";

/**
 * A type's display name. English names are the four preference labels joined by “ · ”, so they wrap
 * only after a dot — a line never starts with “· Judging”. Chinese names are a single word.
 */
export function TypeName({ name, className }: { name: string; className?: string }) {
  const parts = name.split(" · ");
  return (
    <span className={className}>
      {parts.map((part, i) => (
        <Fragment key={part}>
          {i > 0 && " "}
          <span className="whitespace-nowrap">{part}{i < parts.length - 1 ? " ·" : ""}</span>
        </Fragment>
      ))}
    </span>
  );
}
