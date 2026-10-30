import type { Metadata } from "next";
import WorkPage from "../../WorkPage";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Примеры работ",
  description: "Сайты и цифровые продукты, созданные под реальные задачи бизнеса.",
  alternates: {
    canonical: "/ru/work",
    languages: { en: "/work", ru: "/ru/work" },
  },
};

export default function Page() {
  return <WorkPage ru />;
}
