import { mkdirSync, writeFileSync } from "node:fs";

// One line of office comedy: the reply-all self-own.
// The setup is a familiar office sin (reply-all); the payoff lands in the
// last three words, when the narrator becomes the reason for the policy.
// One line, no trailing newline — the gate reads it as raw text.
const LINE =
  "I hit reply-all to ask everyone to stop replying all, and now there's a company policy named after me.";

// Gate: /output/entry.txt must be UTF-8 text of 1–200 characters,
// exactly one line, not only whitespace, and no trailing newline.
if (LINE.length < 1 || LINE.length > 200) {
  throw new Error(`entry must be 1–200 characters, got ${LINE.length}`);
}
if (LINE.trim().length === 0) {
  throw new Error("entry must not be only whitespace");
}
if (LINE.includes("\n") || LINE.includes("\r")) {
  throw new Error("entry must be exactly one line");
}
if (LINE !== LINE.trimEnd()) {
  throw new Error("entry must not end with a trailing newline");
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", LINE, "utf8");
