import { PolicyPage } from "../../policies/PolicyPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Course terms", description: "Terms for access to the G-lab digital course." };
export default function Page() { return <PolicyPage locale="en" kind="terms" />; }
