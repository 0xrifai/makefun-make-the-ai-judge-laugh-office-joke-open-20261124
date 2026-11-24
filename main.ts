// make-the-ai-judge-laugh-office-joke — entry writer.
//
// What this file does, in one sentence: it takes the single joke line below,
// checks it against every rule in the bounty gate, and writes it — byte for
// byte, with no trailing newline — to /output/entry.txt.
//
// The joke itself is the whole entry. Everything else in this file exists to
// prove, before anything is written, that the line is exactly what the gate
// expects: plain UTF-8 text, between 1 and 200 characters long, exactly one
// line, carrying real words rather than blank space, and ending on its final
// character instead of a newline. If any of those checks fails, the program
// stops loudly instead of writing a file that would fail grading.
//
// Run it with Node 22 or newer, which executes TypeScript directly:
//
//   node main.ts
//
// No build step, no dependencies, no network access. The only side effect
// is creating /output/entry.txt (and the /output directory if it is missing).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
//
// Every rule the gate enforces lives here as a named constant, so a reader
// can see the limits in one place instead of hunting for magic numbers in
// the checks below. Change a limit here and every check follows it.
//
//   OUTPUT_PATH  — where the graded entry must land. The grader reads this
//                  exact path, so it is absolute and never configurable
//                  through an argument or an environment variable.
//   MAX_LENGTH   — the gate's upper bound: 200 characters.
//   MIN_LENGTH   — the gate's lower bound: at least 1 character, so an
//                  empty file can never pass.
//   ENCODING     — the file is written as UTF-8 text, matching the gate's
//                  requirement that the entry be readable as UTF-8.

const OUTPUT_PATH = "/output/entry.txt";
const MAX_LENGTH = 200;
const MIN_LENGTH = 1;
const ENCODING = "utf8" as const;

// ---------------------------------------------------------------------------
// The entry
// ---------------------------------------------------------------------------
//
// One line of office comedy: the reply-all self-own.
//
// The setup is a familiar office sin — replying all to a thread that did not
// need it. The narrator tries to fix the problem by committing the same sin
// one more time, and the payoff lands in the last three words, when the
// narrator turns out to be the reason a company policy now exists. The
// would-be hero of the thread becomes its cautionary tale.
//
// The line is stored as a single string literal, written exactly as it must
// appear in the output file. There is no template, no interpolation and no
// trailing newline inside the literal: what you read here is what lands in
// /output/entry.txt, character for character.

const JOKE =
  "I hit reply-all to ask everyone to stop replying all, and now there's a company policy named after me.";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
//
// Each helper checks exactly one gate rule and throws a plain Error naming
// the rule and the offending value when the check fails. Splitting the rules
// into separate functions keeps the failure messages specific — a length
// problem says so, a line-break problem says so — instead of one generic
// "invalid entry" that hides which rule broke. The helpers run in order in
// validateEntry() below; the first failure stops the program before any
// file is written, so a bad line can never produce a bad output file.

// Rule 1 — length: the entry must be between MIN_LENGTH and MAX_LENGTH
// characters long, counted in JavaScript string length (UTF-16 code units).
// For this line, which is plain ASCII, that count equals the character
// count the gate reports. A line that is empty, or longer than the gate
// allows, is rejected here with its actual length in the message.
function checkLength(text: string): void {
  if (text.length < MIN_LENGTH || text.length > MAX_LENGTH) {
    throw new Error(
      `entry must be ${MIN_LENGTH}-${MAX_LENGTH} characters, got ${text.length}`,
    );
  }
}

// Rule 2 — not only whitespace: a line of spaces or tabs is technically
// within the length limits but carries no joke, so it is rejected. trim()
// strips leading and trailing whitespace; if nothing is left, the line was
// blank. Note that this check deliberately runs before the line-break check,
// because a whitespace-only line is the emptier failure and deserves the
// clearer message.
function checkNotOnlyWhitespace(text: string): void {
  if (text.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
}

// Rule 3 — exactly one line: the gate reads a single line, so any line feed
// (\n) or carriage return (\r) inside the text means the entry has spilled
// onto a second line. Either character, anywhere in the string, fails the
// check. This also guards the trailing-newline case from the inside: a
// newline at the end is still a newline character in the string.
function checkSingleLine(text: string): void {
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be exactly one line");
  }
}

// Rule 4 — no trailing newline: the gate compares the file byte for byte,
// so the file must end on the line's final character, not on a newline.
// trimEnd() removes trailing whitespace; if the result differs from the
// original text, something trailing was present. In practice the single-line
// check above already rejects a trailing "\n", but this check also catches
// a trailing space or tab, which would be invisible in the file yet change
// its bytes.
//
// The mirror image matters too: a leading space or tab would be equally
// invisible and equally change the bytes, and it would push the joke's first
// word off the start of the line. The check below rejects leading
// whitespace for the same reason, keeping the file byte-identical to the
// line as written in this source file.
function checkNoTrailingNewline(text: string): void {
  if (text !== text.trimEnd()) {
    throw new Error("entry must not end with trailing whitespace or a newline");
  }
}

// Rule 4b — no leading whitespace: the entry must start on its first word.
// trimStart() removes leading whitespace; if the result differs from the
// original text, the line started with a space or a tab. This is a separate
// helper from the trailing check so the error message can say which end of
// the line is wrong.
function checkNoLeadingWhitespace(text: string): void {
  if (text !== text.trimStart()) {
    throw new Error("entry must not start with leading whitespace");
  }
}

// Rule 5 — valid UTF-8 text: the gate reads the file as UTF-8, so the line
// must survive a round trip through UTF-8 without changing. Encoding the
// string and decoding it back must reproduce the original exactly; any
// unpaired surrogate or other unencodable character would break that round
// trip and is rejected here. For a plain-ASCII line this always passes, and
// that is the point: the check documents the encoding requirement instead
// of silently assuming it.
function checkValidUtf8(text: string): void {
  const encoded = new TextEncoder().encode(text);
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(encoded);
  if (decoded !== text) {
    throw new Error("entry must be valid UTF-8 text");
  }
}

// Run every rule, in the order above, and report the result. The checks are
// deliberately ordered from the cheapest and most likely failure (length)
// to the most structural (encoding), so the first error a writer sees is
// the one most likely to be the real problem. Six helpers, six rules:
// length, non-blank, single line, no trailing newline, no leading
// whitespace, valid UTF-8. A line that passes all six is, by construction,
// a file the gate can accept.
function validateEntry(text: string): void {
  checkLength(text);
  checkNotOnlyWhitespace(text);
  checkSingleLine(text);
  checkNoTrailingNewline(text);
  checkNoLeadingWhitespace(text);
  checkValidUtf8(text);
}

// ---------------------------------------------------------------------------
// Output writer
// ---------------------------------------------------------------------------
//
// Creates the output directory if it is missing (mkdirSync with recursive
// set, so a fresh machine with no /output still works), then writes the
// validated line as UTF-8 with no trailing newline appended. writeFileSync
// writes exactly the string it is given, so passing JOKE unchanged is what
// guarantees the file is byte-identical to the line in this source file.
//
// The writer takes the text as an argument rather than reading the module
// constant directly, so it can be reasoned about — and tested — on its own:
// give it any string, and it writes exactly that string to the path it is
// given.
function writeEntry(text: string, outputPath: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, text, ENCODING);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
//
// Validate first, write second. Nothing is written until every rule has
// passed, so a failed validation can never leave a stale or half-written
// entry file behind. On success the program prints the character count and
// the destination path, which makes a local run easy to eyeball against the
// expected values: 102 characters, one line, /output/entry.txt. Re-running
// the program overwrites the file with the same bytes, so two runs produce
// byte-identical output — the simplest proof that the writer is
// deterministic and adds nothing of its own.

validateEntry(JOKE);
writeEntry(JOKE, OUTPUT_PATH);
console.log(`Wrote ${JOKE.length} characters to ${OUTPUT_PATH}`);
console.log("Entry is one line, no trailing newline.");
