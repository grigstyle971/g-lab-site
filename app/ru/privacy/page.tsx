import { PolicyPage } from "../../policies/PolicyPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Уведомление о данных", description: "Какие данные G-lab использует для аккаунта и курса." };
export default function Page() { return <PolicyPage locale="ru" kind="privacy" />; }
