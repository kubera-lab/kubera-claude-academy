# Contributing to KUBERA Claude Academy

Thank you for helping. The academy has one rule above all others: **every check must be honest and reproducible.** No AI model grades work, nothing pretends to be a live service, and examples never present invented data as real.

## Ways to help
- **Report a bug** — something does not work, looks wrong or breaks on a phone.
- **Improve content** — a lesson is unclear, a translation is wrong, a source is outdated.
- **Improve a tool** — a final-project tool misses a rule or reports a false finding.

Use the issue templates; they ask for exactly what is needed to reproduce the problem.

## Working on the code
1. Fork, then create a branch from `main` (never commit to `main`).
2. `npm ci`
3. Make the change. Content is data in `src/content/`; grading logic is in `src/engine/` (pure functions with tests); screens are in `src/ui/`.
4. Before opening a pull request, all of these must pass:
   ```bash
   npx tsc --noEmit
   npx --yes tsx --test src/data/*.test.ts
   npm test
   npm run build
   npx vite preview --port 4173 &   # then, in another terminal:
   npm run e2e
   ```
5. One pull request = one task. Describe what changed and paste the check results.

## Content rules
- English and Russian for every learner-facing string (a test fails if Russian is missing).
- Plain language for adult beginners; explain every term the first time it appears.
- A source link is added only after the page was opened and checked; record the date.
- Practice data is synthetic and says so.
- A tool may only claim what its rules actually check (see "Limitations" in the README).
