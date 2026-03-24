# Task: Build "Bildung in Bildern" Prototype

## Context
Educational app for visual learning — knowledge through image sequences + comprehension quizzes (MC with image options). Target audience: non-verbal ASD+IDD adults. First topic: Butterfly lifecycle.

## Architecture

### Stack
- Next.js 15 (App Router, already set up)
- TypeScript
- Tailwind CSS
- Vitest for testing

### Core Components

1. **SequenceViewer** (`src/components/SequenceViewer.tsx`)
   - Displays a sequence of images one at a time
   - Navigation: forward/back arrows + dots/progress indicator
   - Each image has a short label (1-3 words): "Das Ei", "Die Raupe", "Die Puppe", "Der Schmetterling"
   - Swipe support (touch-friendly)
   - Large images, minimal UI, white background

2. **Quiz** (`src/components/Quiz.tsx`)
   - Multiple choice with 3 IMAGE options (not text!)
   - Shows a question text + 3 clickable images
   - One correct, two plausible distractors
   - Visual feedback: green border for correct, red shake for wrong
   - NO yes/no questions (acquiescence bias risk)

3. **LessonFlow** (`src/components/LessonFlow.tsx`)
   - Orchestrates: SequenceViewer → Quiz → Result
   - Progress tracking within a lesson
   - Star/celebration feedback on completion

4. **RT Logging** (`src/lib/logging.ts`)
   - Log responseTimeMs for each quiz answer
   - Log which option was selected, correct/incorrect
   - Store in localStorage for now (JSON array)
   - Include: timestamp, questionId, selectedOption, correct, responseTimeMs

### Data Model

```typescript
// src/types/lesson.ts
interface LessonImage {
  id: string;
  src: string;        // path to image in public/
  label: string;      // short German label
  alt: string;        // accessibility
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  correctOptionId: string;
}

interface QuizOption {
  id: string;
  imageSrc: string;
  label: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  sequence: LessonImage[];
  questions: QuizQuestion[];
}
```

### First Lesson Data

```typescript
// src/data/schmetterling.ts
const schmetterlingsLesson: Lesson = {
  id: "schmetterling-lebenszyklus",
  title: "Der Schmetterling",
  description: "Vom Ei zum Schmetterling",
  sequence: [
    { id: "ei", src: "/images/schmetterling/01-ei.webp", label: "Das Ei", alt: "Ein kleines Ei auf einem Blatt" },
    { id: "raupe", src: "/images/schmetterling/02-raupe.webp", label: "Die Raupe", alt: "Eine Raupe frisst ein Blatt" },
    { id: "puppe", src: "/images/schmetterling/03-puppe.webp", label: "Die Puppe", alt: "Eine Puppe hängt an einem Ast" },
    { id: "schmetterling", src: "/images/schmetterling/04-schmetterling.webp", label: "Der Schmetterling", alt: "Ein bunter Schmetterling" },
  ],
  questions: [
    {
      id: "q1",
      questionText: "Was kommt nach dem Ei?",
      options: [
        { id: "q1-raupe", imageSrc: "/images/schmetterling/02-raupe.webp", label: "Die Raupe" },
        { id: "q1-schmetterling", imageSrc: "/images/schmetterling/04-schmetterling.webp", label: "Der Schmetterling" },
        { id: "q1-puppe", imageSrc: "/images/schmetterling/03-puppe.webp", label: "Die Puppe" },
      ],
      correctOptionId: "q1-raupe",
    },
    {
      id: "q2",
      questionText: "Was kommt nach der Raupe?",
      options: [
        { id: "q2-ei", imageSrc: "/images/schmetterling/01-ei.webp", label: "Das Ei" },
        { id: "q2-puppe", imageSrc: "/images/schmetterling/03-puppe.webp", label: "Die Puppe" },
        { id: "q2-schmetterling", imageSrc: "/images/schmetterling/04-schmetterling.webp", label: "Der Schmetterling" },
      ],
      correctOptionId: "q2-puppe",
    },
  ],
};
```

### Pages

- `src/app/page.tsx` — Landing: title + start button → lesson
- `src/app/lesson/[id]/page.tsx` — Lesson flow (SequenceViewer → Quiz → Result)

### Styling
- Clean, minimal, white background
- Large touch targets (min 80px)
- Warm colors matching the images
- Responsive (mobile-first, works on tablet)
- Use Tailwind only

### Vercel Deployment Prep
- Create `vercel.json` with framework preset
- Ensure build works: `pnpm build`

### Tests (Vitest)
- Install vitest + @testing-library/react + @testing-library/jest-dom + jsdom
- Test files in `src/__tests__/`
- Tests to write:
  1. SequenceViewer: renders images, navigates forward/back
  2. Quiz: renders question + 3 options, handles correct/incorrect selection
  3. LessonFlow: progresses through sequence → quiz → result
  4. RT Logging: logs entries with correct fields
  5. Data validation: lesson data has required fields

### Important Notes
- All UI text in GERMAN
- Images are already in `public/images/schmetterling/`
- Keep it simple — this is a prototype
- No authentication, no backend
- Touch-friendly (large targets, no hover-dependent UI)

## Deliverables
1. Working app with sequence viewer + quiz
2. Butterfly lesson with 4 images + 2 quiz questions
3. RT logging to localStorage
4. Vitest tests passing
5. vercel.json
6. Clean git history (commit when done)
7. Push to origin main

When completely finished, run this command to notify me:
openclaw system event --text "Done: Bildung-in-Bildern Prototype — Butterfly lifecycle lesson with sequence viewer, quiz, and RT logging" --mode now
