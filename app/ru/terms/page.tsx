import { PolicyPage } from "../../policies/PolicyPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Условия курса", description: "Условия доступа к цифровому курсу G-lab." };
export default function Page() { return <PolicyPage locale="ru" kind="terms" />; }
