import type { Metadata } from "next";
import WorkPage from "../../WorkPage";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Selected Work",
  description: "Websites and digital products designed around real business needs.",
  alternates: {
    canonical: "/work",
    languages: { en: "/work", ru: "/ru/work" },
  },
};

export default function Page() {
  return <WorkPage />;
}
