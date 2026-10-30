import type { Metadata } from "next";
import AboutPage from "../../AboutPage";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "About G-lab",
  description: "G-lab builds websites for businesses and offers a practical 16-lesson website course. Contact owner Roman Grigorev at grigstyle971@gmail.com.",
  alternates: { canonical: "/about", languages: { en: "/about", ru: "/ru/about" } },
};

export default function Page() { return <AboutPage />; }
