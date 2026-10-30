import { PortfolioShowcase } from "../components/PortfolioShowcase";
import { GlFooter, GlNav } from "../components/GlChrome";
import { glFonts } from "./gl-fonts";

export default function WorkPage({ ru = false }: { ru?: boolean }) {
  return (
    <main className={`gl ${glFonts}`}>
      <GlNav ru={ru} current="work" />
      <PortfolioShowcase />
      <GlFooter ru={ru} />
    </main>
  );
}
