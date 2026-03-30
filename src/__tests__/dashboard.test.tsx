import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DashboardPage from "../app/dashboard/page";
import type { DashboardResponse } from "../../functions/api/dashboard";

// ---- Environment / fetch mocks ----

const TOKEN = "secret-dashboard-token";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_DASHBOARD_TOKEN", TOKEN);
  // Clear cookie
  document.cookie =
    "bib-dashboard-token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  document.cookie =
    "bib-dashboard-token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
});

const emptyResponse: DashboardResponse = {
  users: [],
  generatedAt: "2026-03-30T10:00:00.000Z",
};

const filledResponse: DashboardResponse = {
  users: [
    {
      username: "Kyrill",
      sessions: 3,
      totalEvents: 10,
      lastActive: "2026-03-28T10:00:00",
      lessons: [
        {
          lessonId: "schmetterling",
          sessions: 2,
          lastPlayed: "2026-03-28T10:00:00",
          quizCorrect: 3,
          quizTotal: 4,
          avgResponseMs: 2500,
          questions: [
            { stepIndex: 0, correct: 2, total: 2, avgResponseMs: 2000 },
            { stepIndex: 1, correct: 1, total: 2, avgResponseMs: 3000 },
          ],
        },
      ],
      activityDays: [{ day: "2026-03-28", eventCount: 5 }],
    },
  ],
  generatedAt: "2026-03-30T10:00:00.000Z",
};

function mockFetch(response: DashboardResponse | null, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(response ? JSON.stringify(response) : null, {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

// ---- Auth gate ----

describe("DashboardPage – auth gate", () => {
  it("shows login form when no cookie is set", async () => {
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("Lernweg-Dashboard")).toBeInTheDocument()
    );
    expect(screen.getByLabelText("Zugangs-Code")).toBeInTheDocument();
  });

  it("shows disabled message when NEXT_PUBLIC_DASHBOARD_TOKEN is not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_TOKEN", "");
    render(<DashboardPage />);
    await waitFor(() =>
      expect(
        screen.getByText("Dashboard nicht konfiguriert.")
      ).toBeInTheDocument()
    );
  });

  it("shows error on wrong pin", async () => {
    render(<DashboardPage />);
    await waitFor(() => screen.getByLabelText("Zugangs-Code"));
    fireEvent.change(screen.getByLabelText("Zugangs-Code"), {
      target: { value: "wrong-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Öffnen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falscher Zugangs-Code"
    );
  });

  it("proceeds to fetch after correct pin", async () => {
    mockFetch(emptyResponse);
    render(<DashboardPage />);
    await waitFor(() => screen.getByLabelText("Zugangs-Code"));
    fireEvent.change(screen.getByLabelText("Zugangs-Code"), {
      target: { value: TOKEN },
    });
    fireEvent.click(screen.getByRole("button", { name: "Öffnen" }));
    await waitFor(() =>
      expect(screen.getByText("Lernweg-Übersicht")).toBeInTheDocument()
    );
  });

  it("auto-fetches when valid cookie is present", async () => {
    document.cookie = `bib-dashboard-token=${encodeURIComponent(TOKEN)};path=/`;
    mockFetch(emptyResponse);
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("Lernweg-Übersicht")).toBeInTheDocument()
    );
  });

  it("sends Authorization header when fetching", async () => {
    const fetchSpy = mockFetch(emptyResponse);
    document.cookie = `bib-dashboard-token=${encodeURIComponent(TOKEN)};path=/`;
    render(<DashboardPage />);
    await waitFor(() => screen.getByText("Lernweg-Übersicht"));
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/dashboard",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    );
  });

  it("returns to auth screen on 401 response", async () => {
    document.cookie = `bib-dashboard-token=${encodeURIComponent(TOKEN)};path=/`;
    mockFetch(null, 401);
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("Lernweg-Dashboard")).toBeInTheDocument()
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Zugang verweigert"
    );
  });

  it("shows error state on network failure", async () => {
    document.cookie = `bib-dashboard-token=${encodeURIComponent(TOKEN)};path=/`;
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Network error")
    );
  });
});

// ---- Logout ----

describe("DashboardPage – logout", () => {
  it("returns to auth screen after logout", async () => {
    document.cookie = `bib-dashboard-token=${encodeURIComponent(TOKEN)};path=/`;
    mockFetch(emptyResponse);
    render(<DashboardPage />);
    await waitFor(() => screen.getByText("Lernweg-Übersicht"));
    fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));
    await waitFor(() =>
      expect(screen.getByText("Lernweg-Dashboard")).toBeInTheDocument()
    );
  });
});

// ---- Ready state ----

describe("DashboardPage – ready state", () => {
  beforeEach(() => {
    document.cookie = `bib-dashboard-token=${encodeURIComponent(TOKEN)};path=/`;
  });

  it("shows empty state message when no users", async () => {
    mockFetch(emptyResponse);
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("Noch keine Daten")).toBeInTheDocument()
    );
  });

  it("renders user card with username", async () => {
    mockFetch(filledResponse);
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("Kyrill")).toBeInTheDocument()
    );
  });

  it("renders lesson id within user card", async () => {
    mockFetch(filledResponse);
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText("schmetterling")).toBeInTheDocument()
    );
  });

  it("shows quiz score in lesson row", async () => {
    mockFetch(filledResponse);
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/3\/4 richtig/)).toBeInTheDocument()
    );
  });

  it("expands lesson to show question detail", async () => {
    mockFetch(filledResponse);
    render(<DashboardPage />);
    await waitFor(() => screen.getByText("schmetterling"));

    // Lesson card toggle button
    const lessonBtn = screen.getByRole("button", { name: /schmetterling/i });
    fireEvent.click(lessonBtn);

    await waitFor(() =>
      expect(screen.getByText("Fragen im Detail")).toBeInTheDocument()
    );
    expect(screen.getByText("F1")).toBeInTheDocument();
    expect(screen.getByText("F2")).toBeInTheDocument();
  });

  it("collapses user card on toggle", async () => {
    mockFetch(filledResponse);
    render(<DashboardPage />);
    await waitFor(() => screen.getByText("Kyrill"));

    const userBtn = screen.getByRole("button", { name: /Kyrill ein-\/ausklappen/i });
    // Click to collapse (initially expanded)
    fireEvent.click(userBtn);
    await waitFor(() =>
      expect(screen.queryByText("schmetterling")).not.toBeInTheDocument()
    );
  });
});
