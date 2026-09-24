# ArahIn Frontend Workshop — Starter Branch

## The important part

This branch is **the real ArahIn product UI**.

There is no separate `/workshop` screen.

Participants use the exact production flow:

```text
/beranda
  ↓
upload + AI generation
  ↓
/ruang/:spaceId        ← real Journey UI
  ↓
/sesi/:lessonId        ← real lesson reader
  ↓
/sesi/:lessonId/slide  ← real generated slides
  ↓
/sesi/:lessonId/kuis   ← real Quiz UI
```

The UI, routes, API proxy, React Query setup, Zod boundaries, motion, reader,
quiz feedback, and result modal are the production implementation.

Only **three pieces of logic** are intentionally unfinished.

---

## Setup

```bash
git fetch origin
git switch starter
git reset --hard origin/starter

cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

The env example already points to the deployed Go backend:

```env
ARAHIN_API_URL=https://arahin-backend-hxf3nwliva-as.a.run.app
```

The browser will still show requests to `localhost:3000/api/*`. That is
expected: Next.js proxies those requests to `ARAHIN_API_URL`.

---

## Before the workshop

1. Sign in through the normal ArahIn UI.
2. Open `/beranda`.
3. Upload a real PDF/material and trigger AI generation.
4. Keep one previously-generated Learning Space as a fallback.
5. Open the generated card from Beranda.

Do **not** open a special workshop page. There is none.

---

# Checkpoint 1 — Journey state

### File

```text
src/features/journey/domain/timeline.ts
```

The production Journey UI already exists in:

```text
src/features/journey/presentation/journey-screen.tsx
src/features/journey/presentation/session-node.tsx
src/features/journey/presentation/track-timeline.tsx
```

Do not edit those UI files.

The starter deliberately leaves `buildTimeline()` incomplete: completed
lessons are respected, but **every unfinished lesson is treated as current**.
That makes the bug visible even on a fresh `0/N` journey.

Find:

```ts
// TODO 1 (workshop)
```

Implement these rules:

```text
completed lesson
→ done

first incomplete lesson
→ current

everything after it
→ locked
```

Production completion truth comes from:

```ts
lesson.status === "completed" || Boolean(lesson.completedAt)
```

Expected result:

```text
✓ Sesi 1
● Sesi 2
🔒 Sesi 3
```

This is domain state derivation. The visual Journey stays untouched.

---

# Checkpoint 2 — Make the real Quiz interactive

Continue through the real product:

```text
Journey
→ lesson reader
→ generated slide
→ quiz
```

### File

```text
src/features/quiz/presentation/quiz-screen.tsx
```

React Query already loads the real generated quiz.

React Hook Form is already initialized:

```ts
const answerForm = useForm<QuizAnswerFormValues>({
  resolver: zodResolver(quizAnswerFormSchema),
  defaultValues: { answers: {} },
});
```

### TODO 2 — Select an answer

Find:

```ts
function selectAnswer(itemId: string, optionId: string) {
  // TODO
}
```

Store answers as:

```text
answers[itemId] = optionId
```

Use `answerForm.setValue()`.

### TODO 2b — Navigate forward

Find:

```ts
function nextQuestion() {
  // TODO
}
```

The production quiz already owns navigation in its reducer/domain helpers.

Dispatch the existing next action using the current number of items.

Previous navigation, animations, progress bar, feedback UI, and result modal are
already production code.

---

# Checkpoint 3 — Submit the transport contract

### File

```text
src/features/quiz/application/quiz-use-cases.ts
```

Find:

```ts
// TODO 3 (workshop)
const answers: QuizAnswer[] = [];
```

Transform the user's answer state into:

```ts
[
  { itemId: "...", optionId: "..." },
  { itemId: "...", optionId: "..." },
]
```

Preserve the order of `input.items` and only include answered items.

Then the existing gateway submits to the real backend.

---

# What to show, not rewrite

## Zod boundary

Open:

```text
src/features/quiz/infrastructure/browser-quiz-gateway.ts
src/features/journey/infrastructure/browser-journey-gateway.ts
```

The pattern is:

```text
HTTP response
→ Zod parse
→ trusted domain data
```

Participants do not need to write long schemas during a 30-minute workshop.

## React Query

Open:

```text
src/features/journey/presentation/journey-screen.tsx
src/features/quiz/presentation/quiz-screen.tsx
```

Show that server state is already owned by `useQuery` / `useMutation`.

After a successful quiz submit, production code invalidates:

```ts
["journey", "timeline", spaceId]
```

so the real Journey refetches backend truth instead of manually setting a lesson
to completed.

---

# Why the correct answer is missing before submit

Open:

```text
src/features/quiz/domain/quiz.ts
```

`QuizItem` contains:

```text
question
options
```

It does **not** contain:

```text
correctOptionId
explanation
```

Those fields only appear in `AnswerFeedback` after grading.

This is intentional: the backend keeps the answer key.

---

# 30-minute core flow

```text
00–03  trigger real AI generation from /beranda
03–06  show API → Zod → React Query boundary
06–14  TODO 1: production Journey state
14–21  TODO 2: RHF answer + quiz navigation
21–27  TODO 3: real submit payload
27–30  backend grading → invalidate → real Journey updates
```

Keep the remaining event time for intro, generation latency, participant
recovery, and Q&A.

---

## Closing

> AI generates the learning structure.  
> Frontend turns it into interaction.  
> Backend keeps the truth.
