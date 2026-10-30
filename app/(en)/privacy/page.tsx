import { PolicyPage } from "../../policies/PolicyPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy notice", description: "How G-lab uses account and course information." };
export default function Page() { return <PolicyPage locale="en" kind="privacy" />; }
