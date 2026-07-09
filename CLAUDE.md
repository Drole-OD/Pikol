@AGENTS.md

# Version control

Commit and push work to GitHub regularly as you go — don't let uncommitted
changes pile up across a long session. In practice:

- After finishing a meaningful chunk of work (a feature, a bug fix, a
  refactor, a schema change), stage the relevant files and commit.
- Write clean, descriptive commit messages: a short imperative summary line
  (e.g. "Add per-court surface type to owner dashboard"), plus a body when the
  change needs more context. Avoid vague messages like "updates" or "fixes".
- Push to the remote after committing so work isn't only local.
- Keep commits scoped to one logical change rather than bundling unrelated
  work together.
- Never commit secrets (`.env*`, credentials, API keys).
- Still confirm with the user before any destructive or history-rewriting
  git operation (force push, reset --hard, amending pushed commits).
