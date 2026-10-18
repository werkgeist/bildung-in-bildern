import type { Metadata } from "next";
import WashbasinExperiment from "@/components/experiments/WashbasinExperiment";

export const metadata: Metadata = {
  title: "Das Waschbecken · Bildung in Bildern",
  description: "Hahn öffnen, Stöpsel herausnehmen und selbst beobachten, was mit dem Wasser passiert.",
};

export default function WashbasinPage() {
  return <WashbasinExperiment />;
}
