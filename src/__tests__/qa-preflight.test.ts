import { describe, it, expect } from "vitest";
import {
  checkSchema,
  checkAnswerUniqueness,
  checkAssetCompleteness,
  checkStepConsistency,
  checkDistractorPlausibility,
  runAllChecks,
} from "@/lib/qa-checks";
import type { LessonSpec } from "@/types/lesson-spec";
import schmetterlingSpec from "@/data/examples/schmetterling-spec.json";
import wasserkreislaufSpec from "@/data/examples/wasserkreislauf-spec.json";
import temperaturSpec from "@/data/examples/temperatur-spec.json";
import lebensphasenSpec from "@/data/examples/lebensphasen-spec.json";

// ─── Fixtures ─────────────────────────────────────────────────

/** Minimale valide Spec für Komponenten-Tests */
const minimalSpec: LessonSpec = {
  id: "test-lektion",
  version: 2,
  locale: "de",
  title: "Test",
  description: "Testlektion",
  subject: "nature",
  difficulty: 1,
  learningGoals: ["Ziel 1"],
  steps: [
    {
      id: "test-lektion-step-1",
      order: 1,
      label: "Schritt 1",
      alt: "Alt-Text für Schritt 1",
      concept: "Konzept des ersten Schritts",
      conceptTags: ["konzept-a", "start"],
      mustInclude: ["sichtbares Element A"],
    },
    {
      id: "test-lektion-step-2",
      order: 2,
      label: "Schritt 2",
      alt: "Alt-Text für Schritt 2",
      concept: "Konzept des zweiten Schritts",
      conceptTags: ["konzept-b", "mitte"],
      mustInclude: ["sichtbares Element B"],
    },
  ],
  questions: [
    {
      id: "test-lektion-q-1",
      type: "mc-image",
      testsConcepts: ["konzept-a"],
      questionText: "Welcher Schritt ist der erste?",
      options: [
        {
          id: "test-lektion-q-1-opt-1",
          label: "Schritt 1",
          stepRef: "test-lektion-step-1",
          isCorrect: true,
        },
        {
          id: "test-lektion-q-1-opt-2",
          label: "Schritt 2",
          stepRef: "test-lektion-step-2",
          isCorrect: false,
          distractorReason: "Das ist der zweite Schritt",
        },
      ],
      difficulty: 1,
    },
  ],
  style: {
    artStyle: "flat-vector",
    background: "white",
  },
};

// ─── runAllChecks: alle vier echten Specs ─────────────────────

describe("runAllChecks — echte Specs bestehen alle Checks", () => {
  const allSpecs = [
    ["schmetterling", schmetterlingSpec],
    ["wasserkreislauf", wasserkreislaufSpec],
    ["temperatur", temperaturSpec],
    ["lebensphasen", lebensphasenSpec],
  ] as const;

  for (const [name, spec] of allSpecs) {
    it(`${name}: passed=true`, () => {
      const result = runAllChecks(spec);
      if (!result.passed) {
        // Fehlermeldungen ausgeben für besseres Debugging
        const failed = result.checks.filter((c) => !c.passed);
        console.error(JSON.stringify(failed, null, 2));
      }
      expect(result.passed).toBe(true);
    });

    it(`${name}: alle 5 Checks laufen durch`, () => {
      const result = runAllChecks(spec);
      expect(result.checks).toHaveLength(5);
    });

    it(`${name}: lessonId ist gesetzt`, () => {
      const result = runAllChecks(spec);
      expect(result.lessonId).toBeTruthy();
    });
  }
});

// ─── Check 1: Schema ──────────────────────────────────────────

describe("checkSchema", () => {
  it("akzeptiert valide minimale Spec", () => {
    const r = checkSchema(minimalSpec);
    expect(r.passed).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("lehnt version !== 2 ab", () => {
    const r = checkSchema({ ...minimalSpec, version: 1 });
    expect(r.passed).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("lehnt fehlende id ab", () => {
    const { id: _id, ...withoutId } = minimalSpec;
    const r = checkSchema(withoutId);
    expect(r.passed).toBe(false);
  });

  it("lehnt leere steps ab", () => {
    const r = checkSchema({ ...minimalSpec, steps: [] });
    expect(r.passed).toBe(false);
  });

  it("lehrt ungültigen difficulty-Wert ab", () => {
    const r = checkSchema({ ...minimalSpec, difficulty: 5 });
    expect(r.passed).toBe(false);
  });

  it("lehnt unbekannten question.type ab", () => {
    const r = checkSchema({
      ...minimalSpec,
      questions: [{ ...minimalSpec.questions[0], type: "drag-drop" }],
    });
    expect(r.passed).toBe(false);
  });

  it("errors enthalten path-Info", () => {
    const r = checkSchema({ ...minimalSpec, version: 1 });
    expect(r.errors[0]).toHaveProperty("path");
    expect(r.errors[0]).toHaveProperty("message");
  });
});

// ─── Check 2: Antwort-Eindeutigkeit ──────────────────────────

describe("checkAnswerUniqueness", () => {
  it("akzeptiert Spec mit genau 1 korrekter Antwort", () => {
    const r = checkAnswerUniqueness(minimalSpec);
    expect(r.passed).toBe(true);
  });

  it("schlägt fehl wenn keine korrekte Antwort", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: minimalSpec.questions[0].options.map((o) => ({
            ...o,
            isCorrect: false,
          })),
        },
      ],
    };
    const r = checkAnswerUniqueness(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].questionId).toBe("test-lektion-q-1");
    expect(r.errors[0].message).toMatch(/keine korrekte/i);
  });

  it("schlägt fehl wenn 2 korrekte Antworten", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: minimalSpec.questions[0].options.map((o) => ({
            ...o,
            isCorrect: true,
          })),
        },
      ],
    };
    const r = checkAnswerUniqueness(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/2 Optionen/);
  });

  it("schlägt fehl bei doppelten Option-Labels", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: [
            { ...minimalSpec.questions[0].options[0], label: "Gleich" },
            {
              ...minimalSpec.questions[0].options[1],
              label: "Gleich",
              isCorrect: false,
            },
          ],
        },
      ],
    };
    const r = checkAnswerUniqueness(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/doppelte/i);
  });

  it("schlägt fehl wenn Distraktor-Label = korrekte Label", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: [
            { ...minimalSpec.questions[0].options[0], label: "Option A" },
            {
              ...minimalSpec.questions[0].options[1],
              label: "Option A",
              isCorrect: false,
            },
          ],
        },
      ],
    };
    const r = checkAnswerUniqueness(bad);
    expect(r.passed).toBe(false);
    // Doppelter Label-Fehler + Distraktor-Fehler
    const msgs = r.errors.map((e) => e.message);
    expect(msgs.some((m) => /identisch/i.test(m))).toBe(true);
  });

  it("sequence: schlägt fehl ohne correctOrderStepRefs", () => {
    const spec: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          id: "test-q-seq",
          type: "sequence",
          testsConcepts: [],
          questionText: "Richtige Reihenfolge?",
          options: [],
          difficulty: 1,
        },
      ],
    };
    const r = checkAnswerUniqueness(spec);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/sequence/i);
  });

  it("sequence: schlägt fehl bei weniger als 2 Refs", () => {
    const spec: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          id: "test-q-seq",
          type: "sequence",
          testsConcepts: [],
          questionText: "Richtige Reihenfolge?",
          options: [],
          correctOrderStepRefs: ["test-lektion-step-1"],
          difficulty: 1,
        },
      ],
    };
    const r = checkAnswerUniqueness(spec);
    expect(r.passed).toBe(false);
  });

  it("sequence: schlägt fehl bei duplikaten in correctOrderStepRefs", () => {
    const spec: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          id: "test-q-seq",
          type: "sequence",
          testsConcepts: [],
          questionText: "Richtige Reihenfolge?",
          options: [],
          correctOrderStepRefs: ["test-lektion-step-1", "test-lektion-step-1"],
          difficulty: 1,
        },
      ],
    };
    const r = checkAnswerUniqueness(spec);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/duplikat/i);
  });
});

// ─── Check 3: Asset-Vollständigkeit ──────────────────────────

describe("checkAssetCompleteness", () => {
  it("akzeptiert Spec mit validen stepRefs", () => {
    const r = checkAssetCompleteness(minimalSpec);
    expect(r.passed).toBe(true);
  });

  it("schlägt fehl bei stepRef auf nicht existierenden Step", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: [
            {
              ...minimalSpec.questions[0].options[0],
              stepRef: "nicht-vorhanden-step-99",
            },
            minimalSpec.questions[0].options[1],
          ],
        },
      ],
    };
    const r = checkAssetCompleteness(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/nicht existierenden Step/);
  });

  it("schlägt fehl bei doppelten Step-IDs", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      steps: [minimalSpec.steps[0], minimalSpec.steps[0]], // dupliziert
    };
    const r = checkAssetCompleteness(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/doppelte Step-IDs/i);
  });

  it("schlägt fehl bei doppelten Option-IDs", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: [
            minimalSpec.questions[0].options[0],
            {
              ...minimalSpec.questions[0].options[1],
              id: minimalSpec.questions[0].options[0].id, // gleiche ID
            },
          ],
        },
      ],
    };
    const r = checkAssetCompleteness(bad);
    expect(r.passed).toBe(false);
    expect(r.errors.some((e) => /doppelte Option-ID/i.test(e.message))).toBe(
      true
    );
  });

  it("ohne assetDir: keine Datei-Prüfung", () => {
    // Alle stepRefs gültig, kein assetDir → Pass
    const r = checkAssetCompleteness(minimalSpec, undefined);
    expect(r.passed).toBe(true);
  });

  it("mit assetDir: schlägt fehl wenn Bild-Datei fehlt", () => {
    const r = checkAssetCompleteness(minimalSpec, "/tmp/nicht-vorhanden-dir");
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/kein bild/i);
  });
});

// ─── Check 4: Step-Konsistenz ────────────────────────────────

describe("checkStepConsistency", () => {
  it("akzeptiert konsistente Steps", () => {
    const r = checkStepConsistency(minimalSpec);
    expect(r.passed).toBe(true);
  });

  it("schlägt fehl bei leeren conceptTags", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      steps: [{ ...minimalSpec.steps[0], conceptTags: [] }, minimalSpec.steps[1]],
    };
    const r = checkStepConsistency(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/conceptTags/i);
  });

  it("schlägt fehl bei leeren mustInclude", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      steps: [{ ...minimalSpec.steps[0], mustInclude: [] }, minimalSpec.steps[1]],
    };
    const r = checkStepConsistency(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/mustInclude/i);
  });

  it("schlägt fehl bei nicht-sequentieller order (Lücke)", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      steps: [
        minimalSpec.steps[0], // order=1
        { ...minimalSpec.steps[1], order: 3 }, // order=3 statt 2
      ],
    };
    const r = checkStepConsistency(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/sequentiell/i);
  });

  it("schlägt fehl bei leerem alt-Text", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      steps: [{ ...minimalSpec.steps[0], alt: "" }, minimalSpec.steps[1]],
    };
    const r = checkStepConsistency(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/alt/i);
  });

  it("schlägt fehl bei leerem concept", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      steps: [{ ...minimalSpec.steps[0], concept: "  " }, minimalSpec.steps[1]],
    };
    const r = checkStepConsistency(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/concept/i);
  });
});

// ─── Check 5: Distraktor-Plausibilität ───────────────────────

describe("checkDistractorPlausibility", () => {
  it("akzeptiert Spec mit passendem testsConcepts-Overlap", () => {
    const r = checkDistractorPlausibility(minimalSpec);
    // minimalSpec: testsConcepts=["konzept-a"], step-1 conceptTags=["konzept-a","start"] → Overlap ✓
    expect(r.passed).toBe(true);
  });

  it("schlägt fehl wenn testsConcepts kein Overlap mit correctStep.conceptTags", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          testsConcepts: ["völlig-anderes-konzept"],
        },
      ],
    };
    const r = checkDistractorPlausibility(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/überschneidet sich nicht/i);
  });

  it("schlägt fehl wenn Distraktor auf denselben Step zeigt wie korrekte Antwort", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: [
            minimalSpec.questions[0].options[0], // isCorrect=true, stepRef=step-1
            {
              ...minimalSpec.questions[0].options[1],
              isCorrect: false,
              stepRef: "test-lektion-step-1", // gleicher stepRef wie korrekte Antwort!
            },
          ],
        },
      ],
    };
    const r = checkDistractorPlausibility(bad);
    expect(r.passed).toBe(false);
    expect(r.errors[0].message).toMatch(/denselben Step/i);
  });

  it("ignoriert sequence und matching Fragen", () => {
    const spec: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          id: "test-q-seq",
          type: "sequence",
          testsConcepts: ["konzept-x"], // kein Overlap nötig
          questionText: "Reihenfolge?",
          options: [],
          correctOrderStepRefs: ["test-lektion-step-1", "test-lektion-step-2"],
          difficulty: 1,
        },
      ],
    };
    const r = checkDistractorPlausibility(spec);
    expect(r.passed).toBe(true);
  });
});

// ─── Regression #46: lebensphasen q-2 muss gezeigten Label referenzieren ──────────

describe("lebensphasen q-2 — zeigen→prüfen Alignment (Regression #46)", () => {
  it("Fragetext referenziert 'Ausbildung' — dieser Label muss in einem Step vorkommen", () => {
    const q2 = lebensphasenSpec.questions.find(
      (q) => q.id === "lebensphasen-einfach-q-2"
    );
    expect(q2).toBeDefined();
    // questionText uses the word "Ausbildung" — it must appear as a step label
    const shownLabels = lebensphasenSpec.steps.map((s) =>
      s.label.toLowerCase()
    );
    expect(shownLabels).toContain("ausbildung");
  });

  it("korrekte Antwort in q-2 zeigt auf step-5 (Arbeit)", () => {
    const q2 = lebensphasenSpec.questions.find(
      (q) => q.id === "lebensphasen-einfach-q-2"
    );
    const correct = q2!.options.find((o) => o.isCorrect);
    expect(correct?.stepRef).toBe("lebensphasen-einfach-step-5");
  });
});

// ─── Regression #44/#45: Wasserkreislauf und Lebensphasen — min. 3 Quiz-Fragen ───

describe("wasserkreislauf — min. Quiz-Tiefe (Regression #44)", () => {
  it("hat mindestens 3 Fragen", () => {
    expect(wasserkreislaufSpec.questions.length).toBeGreaterThanOrEqual(3);
  });

  it("q-3 testet Verdunstung (step-1)", () => {
    const q3 = wasserkreislaufSpec.questions.find(
      (q) => q.id === "wasserkreislauf-einfach-q-3"
    );
    expect(q3).toBeDefined();
    const correct = q3!.options.find((o) => o.isCorrect);
    expect(correct?.stepRef).toBe("wasserkreislauf-einfach-step-1");
  });

  it("q-3 testsConcepts enthält 'verdunstung'", () => {
    const q3 = wasserkreislaufSpec.questions.find(
      (q) => q.id === "wasserkreislauf-einfach-q-3"
    );
    expect(q3?.testsConcepts).toContain("verdunstung");
  });

  it("q-3 hat keine doppelten stepRefs zwischen Optionen", () => {
    const q3 = wasserkreislaufSpec.questions.find(
      (q) => q.id === "wasserkreislauf-einfach-q-3"
    );
    const refs = q3!.options.map((o) => o.stepRef).filter(Boolean);
    expect(new Set(refs).size).toBe(refs.length);
  });
});

describe("lebensphasen — min. Quiz-Tiefe (Regression #45)", () => {
  it("hat mindestens 3 Fragen", () => {
    expect(lebensphasenSpec.questions.length).toBeGreaterThanOrEqual(3);
  });

  it("q-3 testet Baby (step-1)", () => {
    const q3 = lebensphasenSpec.questions.find(
      (q) => q.id === "lebensphasen-einfach-q-3"
    );
    expect(q3).toBeDefined();
    const correct = q3!.options.find((o) => o.isCorrect);
    expect(correct?.stepRef).toBe("lebensphasen-einfach-step-1");
  });

  it("q-3 testsConcepts enthält 'baby'", () => {
    const q3 = lebensphasenSpec.questions.find(
      (q) => q.id === "lebensphasen-einfach-q-3"
    );
    expect(q3?.testsConcepts).toContain("baby");
  });

  it("q-3 hat keine doppelten stepRefs zwischen Optionen", () => {
    const q3 = lebensphasenSpec.questions.find(
      (q) => q.id === "lebensphasen-einfach-q-3"
    );
    const refs = q3!.options.map((o) => o.stepRef).filter(Boolean);
    expect(new Set(refs).size).toBe(refs.length);
  });
});

// ─── Regression #43: Temperatur q-1 darf step-4 (heiß) nicht als Distraktor haben ──

describe("temperatur q-1 — Distraktor-Mehrdeutigkeit (Regression #43)", () => {
  it("Distraktor für 'warm'-Frage zeigt nicht auf step-4 (heiß/Wüste — zu nah an 'warm')", () => {
    const q1 = temperaturSpec.questions.find(
      (q) => q.id === "temperatur-einfach-q-1"
    );
    expect(q1).toBeDefined();
    const distractorStepRefs = q1!.options
      .filter((o) => !o.isCorrect)
      .map((o) => o.stepRef);
    expect(distractorStepRefs).not.toContain("temperatur-einfach-step-4");
  });

  it("'warm'-Frage hat genau 2 Distraktoren aus klar unterschiedlichen Konzepten (kalt/kühl)", () => {
    const q1 = temperaturSpec.questions.find(
      (q) => q.id === "temperatur-einfach-q-1"
    );
    const distractorStepRefs = q1!.options
      .filter((o) => !o.isCorrect)
      .map((o) => o.stepRef);
    // Beide Distraktoren müssen auf der kühlen/kalten Seite liegen
    expect(distractorStepRefs).toContain("temperatur-einfach-step-1"); // kalt
    expect(distractorStepRefs).toContain("temperatur-einfach-step-2"); // kühl
  });
});

// ─── Absichtlich fehlerhafte Spec → muss fehlschlagen ────────

describe("runAllChecks — absichtlich fehlerhafte Spec", () => {
  it("schlägt fehl bei Version 1", () => {
    const bad = { ...schmetterlingSpec, version: 1 };
    const r = runAllChecks(bad);
    expect(r.passed).toBe(false);
  });

  it("schlägt fehl bei 2 korrekten Antworten", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: minimalSpec.questions[0].options.map((o) => ({
            ...o,
            isCorrect: true,
          })),
        },
      ],
    };
    const r = runAllChecks(bad);
    expect(r.passed).toBe(false);
    const failedChecks = r.checks.filter((c) => !c.passed);
    expect(failedChecks.length).toBeGreaterThan(0);
  });

  it("schlägt fehl bei ungültigem stepRef", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      questions: [
        {
          ...minimalSpec.questions[0],
          options: [
            {
              ...minimalSpec.questions[0].options[0],
              stepRef: "gibts-nicht-99",
            },
            minimalSpec.questions[0].options[1],
          ],
        },
      ],
    };
    const r = runAllChecks(bad);
    expect(r.passed).toBe(false);
  });

  it("schlägt fehl bei leeren conceptTags", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      steps: [{ ...minimalSpec.steps[0], conceptTags: [] }, minimalSpec.steps[1]],
    };
    const r = runAllChecks(bad);
    expect(r.passed).toBe(false);
  });

  it("gibt lessonId auch bei Fehler aus", () => {
    const bad = { ...minimalSpec, version: 1 };
    const r = runAllChecks(bad);
    expect(r.lessonId).toBe("test-lektion");
  });

  it("überspringe restliche Checks wenn Schema ungültig", () => {
    const bad = { version: 1 }; // komplett kaputt
    const r = runAllChecks(bad);
    expect(r.passed).toBe(false);
    // Nur Schema-Check läuft
    expect(r.checks).toHaveLength(1);
    expect(r.checks[0].name).toBe("schema");
  });
});

// ─── Output-Format ────────────────────────────────────────────

describe("runAllChecks — Output-Format", () => {
  it("result hat passed, lessonId, checks", () => {
    const r = runAllChecks(minimalSpec);
    expect(r).toHaveProperty("passed");
    expect(r).toHaveProperty("lessonId");
    expect(r).toHaveProperty("checks");
  });

  it("jeder check hat name, passed, errors", () => {
    const r = runAllChecks(minimalSpec);
    for (const c of r.checks) {
      expect(c).toHaveProperty("name");
      expect(c).toHaveProperty("passed");
      expect(c).toHaveProperty("errors");
      expect(Array.isArray(c.errors)).toBe(true);
    }
  });

  it("fehler-objekte haben message", () => {
    const bad: LessonSpec = {
      ...minimalSpec,
      steps: [{ ...minimalSpec.steps[0], conceptTags: [] }, minimalSpec.steps[1]],
    };
    const r = runAllChecks(bad);
    const errors = r.checks.flatMap((c) => c.errors);
    for (const e of errors) {
      expect(typeof e.message).toBe("string");
      expect(e.message.length).toBeGreaterThan(0);
    }
  });
});
