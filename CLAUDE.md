# Claude Code project instructions

**Read `AGENTS.md` in full before doing anything else in this repo.** It is the complete handoff
context for this project — what it is, its architecture, the design conventions that must be
preserved, the real git branch to work on (`feature/ps2-complete-build`, not `main`), and explicit
instructions not to restart or discard the progress already made. Everything in `AGENTS.md` applies
to you exactly as if it were written here; it's kept as a separate file only so it's also readable
by non-Claude coding agents (e.g. Codex) working on this same repo.

After `AGENTS.md`, also read `docs/WRITEUP.md` and skim `docs/AUDIT.md` through `docs/AUDIT_V6.md`
as `AGENTS.md` itself instructs — do not skip this step because a requested change sounds small.

One Claude-Code-specific addition: this project's established workflow is to track each round of
work with `TaskCreate`/`TaskUpdate` (one task per discrete fix/feature) and to write a new
`docs/AUDIT_V{N}.md` at the end of each round of feedback, following the exact structure of the
existing ones. Keep doing both.
