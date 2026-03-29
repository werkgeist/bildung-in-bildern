import type { Lesson } from "@/types/lesson";

export const schmetterlingsLesson: Lesson = {
  id: "schmetterling-lebenszyklus",
  title: "Der Schmetterling",
  description: "Vom Ei zum Schmetterling",
  difficulty: 1,
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
