import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    className,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
    className?: string;
  }) => React.createElement("img", { src, alt, className }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("a", { href, className }, children),
}));
