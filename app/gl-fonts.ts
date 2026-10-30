import { Golos_Text, JetBrains_Mono, Unbounded } from "next/font/google";

// Fonts live in a server module: Turbopack cannot resolve next/font inside a client component.
const display = Unbounded({ variable: "--gl-display", subsets: ["latin", "cyrillic"], display: "swap" });
const body = Golos_Text({ variable: "--gl-body", subsets: ["latin", "cyrillic"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--gl-mono", weight: "500", subsets: ["latin", "cyrillic"], display: "swap" });

export const glFonts = `${display.variable} ${body.variable} ${mono.variable}`;
