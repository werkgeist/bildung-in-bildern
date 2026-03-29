import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FortschrittPage from "@/app/fortschritt/page";
import { markComplete } from "@/hooks/useProgress";
import { allLessons } from "@/data/lessons";

beforeEach(() => {
  localStorage.clear();
});

describe("FortschrittPage", () => {
  it("renders a card for every lesson", async () => {
    render(<FortschrittPage />);
    for (const lesson of allLessons) {
      expect(
        await screen.findByRole("link", { name: new RegExp(lesson.title) })
      ).toBeInTheDocument();
    }
  });

  it("shows Abgeschlossen badge on completed lesson", async () => {
    markComplete(allLessons[0].id, 1);
    render(<FortschrittPage />);
    const badges = await screen.findAllByRole("img", { name: "Abgeschlossen" });
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Noch nicht gestartet badge for all lessons when none completed", async () => {
    render(<FortschrittPage />);
    const badges = await screen.findAllByRole("img", { name: "Noch nicht gestartet" });
    expect(badges.length).toBe(allLessons.length);
  });

  it("shows progress count n / total after loading", async () => {
    markComplete(allLessons[0].id, 1);
    markComplete(allLessons[1].id, 0.5);
    render(<FortschrittPage />);
    expect(
      await screen.findByText(`2 / ${allLessons.length}`)
    ).toBeInTheDocument();
  });

  it("shows 0 / total when no lessons completed", async () => {
    render(<FortschrittPage />);
    expect(
      await screen.findByText(`0 / ${allLessons.length}`)
    ).toBeInTheDocument();
  });

  it("each lesson card links to its lesson route", async () => {
    render(<FortschrittPage />);
    for (const lesson of allLessons) {
      const link = await screen.findByRole("link", { name: new RegExp(lesson.title) });
      expect(link).toHaveAttribute("href", `/lesson/${lesson.id}`);
    }
  });

  it("shows back link to homepage", async () => {
    render(<FortschrittPage />);
    expect(
      await screen.findByRole("link", { name: "Zurück zur Startseite" })
    ).toHaveAttribute("href", "/");
  });

  it("only completed lesson has Abgeschlossen badge; rest have Noch nicht gestartet", async () => {
    markComplete(allLessons[0].id, 1);
    render(<FortschrittPage />);
    const doneBadges = await screen.findAllByRole("img", { name: "Abgeschlossen" });
    const notDoneBadges = await screen.findAllByRole("img", { name: "Noch nicht gestartet" });
    expect(doneBadges.length).toBe(1);
    expect(notDoneBadges.length).toBe(allLessons.length - 1);
  });

  it("completed lesson card has accessible label indicating completion", async () => {
    markComplete(allLessons[0].id, 1);
    render(<FortschrittPage />);
    const link = await screen.findByRole("link", {
      name: new RegExp(`${allLessons[0].title}.*abgeschlossen`, "i"),
    });
    expect(link).toBeInTheDocument();
  });
});

describe("Homepage ProgressLink", () => {
  it("renders a link to /fortschritt on the homepage", async () => {
    const { default: Home } = await import("@/app/page");
    render(<Home />);
    expect(screen.getByRole("link", { name: "Mein Fortschritt" })).toHaveAttribute(
      "href",
      "/fortschritt"
    );
  });
});
