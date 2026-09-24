# ArahIn Frontend Workshop Starter

## Theme

**AI Generated It. Now Make It Interactive.**

Total event slot can be 40 minutes, but the core material is intentionally designed to finish in **30 minutes**. The remaining 10 minutes are for introduction, setup drift, API/generation latency, participant recovery, and Q&A.

The workshop uses the real ArahIn API. There are no quiz fixtures and no answer keys shipped to the browser before submission.

## Stack used in the workshop

The starter mirrors the production frontend conventions:

- **Zod** validates successful API payloads at the infrastructure boundary.
- **TanStack React Query** owns spaces, tracks, quiz server state, mutations, cache invalidation, loading, and errors.
- **React Hook Form + zodResolver** owns the participant's quiz answers.
- React local state is reserved for UI-only state such as selected space, current question index, and currently opened lesson.

## Before the session

1. Run: git checkout starter
2. Copy the env example: cp .env.example .env.local
3. Run: pnpm install --frozen-lockfile
4. Run: pnpm dev
5. Sign in with the normal ArahIn flow.
6. Open /beranda and trigger one real AI generation.
7. Open /workshop while generation continues.
8. Keep one previously-generated learning space ready as a fallback.

The workshop screen intentionally uses the same mobile frame, journey timeline,
quiz styling, feedback sheet, result modal, and bottom navigation language as
production ArahIn. There is no separate workshop dashboard UI.

## Files participants need

Most hands-on work stays in:

src/features/workshop/presentation/workshop-starter.tsx

Useful files to show, but not ask participants to rewrite:

- src/features/workshop/infrastructure/workshop-api.ts — Axios request + Zod response parsing
- src/features/workshop/domain/workshop.ts — trusted frontend contracts
- src/features/workshop/presentation/workshop-ui.tsx — prepared visual components

## 30-minute core flow

### 00:00–03:00 — Trigger real AI generation

Generate material through the normal ArahIn flow.

Key point: We are not building an AI SDK call. We are building what happens after AI returns structured learning data.

Do not wait for generation to finish. Move to /workshop.

### 03:00–06:00 — Follow data across the boundary

Open workshop-api.ts and show:

real API response → Zod → trusted domain data → React Query cache → UI

Highlight that TypeScript alone cannot validate runtime JSON.

### 06:00–14:00 — Checkpoint 1: build the learning stepper

Implement buildWorkshopSteps().

Rules:

- lesson.status === completed or completedAt exists → done
- first incomplete lesson → current
- everything after it → locked

Expected result:

✓ Lesson 1
● Lesson 2
🔒 Lesson 3

**Hard stop: minute 14.** If participants are behind, show the solution and move on.

### 14:00–21:00 — Checkpoint 2: make generated quiz interactive

React Query already loads the real generated quiz.

Implement selectOption() using React Hook Form:

answerForm.setValue(
  "answers",
  { ...answers, [itemId]: optionId },
  { shouldDirty: true, shouldValidate: true },
);

Then implement goNext() by clamping the index to the final generated item.

Key point:

server state → React Query
form state → React Hook Form
UI state → React useState

Do not put all three kinds of state in one bucket.

### 21:00–27:00 — Checkpoint 3: submit to the real backend

Build the API payload inside submitQuiz:

const payload = quiz.quiz.items.map((item) => ({
  itemId: item.id,
  optionId: values.answers[item.id],
}));

Then call the already-wired mutation.

Before submit, inspect the quiz response: it contains question + options, but not correctOptionId or explanation.

After submit, the backend returns grading feedback and the result panel renders it.

### 27:00–30:00 — Close the loop

Point out the mutation onSuccess:

submit → backend updates completion → invalidate tracks query → React Query refetches → stepper changes

Expected transition:

BEFORE: ✓ Lesson 1 / ● Lesson 2 / 🔒 Lesson 3
AFTER:  ✓ Lesson 1 / ✓ Lesson 2 / ● Lesson 3

Closing:

**AI generates the learning structure. Frontend turns it into interaction. Backend keeps the truth.**

## 10-minute reserve

Use the remaining event time for any combination of:

- introduction / speaker context
- waiting for generation
- fixing participant setup issues
- repeating one coding checkpoint
- Q&A

Do not add another feature just because the first 30 minutes went smoothly.

## Facilitator fallback

If live AI generation is slow, switch the learning-space selector to the pre-generated fallback. It is still real API data; the workshop should never need local fake quiz fixtures.
