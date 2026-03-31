import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FortschrittPage from "@/app/fortschritt/page";
import { markComplete, markViewed } from "@/hooks/useProgress";
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

  it("shows Quiz-bestanden badge on passed lesson", async () => {
    markComplete(allLessons[0].id, 1);
    render(<FortschrittPage />);
    const badges = await screen.findAllByRole("img", { name: "Quiz bestanden" });
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Angesehen badge on viewed lesson", async () => {
    markViewed(allLessons[0].id);
    render(<FortschrittPage />);
    const badges = await screen.findAllByRole("img", { name: "Angesehen" });
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Noch nicht gestartet badge for all lessons when none started", async () => {
    render(<FortschrittPage />);
    const badges = await screen.findAllByRole("img", { name: "Noch nicht gestartet" });
    expect(badges.length).toBe(allLessons.length);
  });

  it("shows passed count n / total in header", async () => {
    markComplete(allLessons[0].id, 1);
    markComplete(allLessons[1].id, 0.5);
    render(<FortschrittPage />);
    expect(
      await screen.findByText(`2 / ${allLessons.length}`)
    ).toBeInTheDocument();
  });

  it("shows 0 / total when no lessons passed", async () => {
    render(<FortschrittPage />);
    expect(
      await screen.findByText(`0 / ${allLessons.length}`)
    ).toBeInTheDocument();
  });

  it("viewed lessons do not count toward the passed total", async () => {
    markViewed(allLessons[0].id);
    markViewed(allLessons[1].id);
    render(<FortschrittPage />);
    expect(
      await screen.findByText(`0 / ${allLessons.length}`)
    ).toBeInTheDocument();
  });

  it("failed quiz (score < 0.5) shows Angesehen badge, not Quiz bestanden", async () => {
    markComplete(allLessons[0].id, 0);
    render(<FortschrittPage />);
    const viewed = await screen.findAllByRole("img", { name: "Angesehen" });
    expect(viewed.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("img", { name: "Quiz bestanden" })).toBeNull();
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

  it("only passed lesson has Quiz-bestanden badge; rest have Noch nicht gestartet", async () => {
    markComplete(allLessons[0].id, 1);
    render(<FortschrittPage />);
    const doneBadges = await screen.findAllByRole("img", { name: "Quiz bestanden" });
    const notDoneBadges = await screen.findAllByRole("img", { name: "Noch nicht gestartet" });
    expect(doneBadges.length).toBe(1);
    expect(notDoneBadges.length).toBe(allLessons.length - 1);
  });

  it("passed lesson card has accessible label indicating quiz passed", async () => {
    markComplete(allLessons[0].id, 1);
    render(<FortschrittPage />);
    const link = await screen.findByRole("link", {
      name: new RegExp(`${allLessons[0].title}.*Quiz bestanden`, "i"),
    });
    expect(link).toBeInTheDocument();
  });

  it("viewed lesson card has accessible label indicating angesehen", async () => {
    markViewed(allLessons[0].id);
    render(<FortschrittPage />);
    const link = await screen.findByRole("link", {
      name: new RegExp(`${allLessons[0].title}.*Angesehen`, "i"),
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
