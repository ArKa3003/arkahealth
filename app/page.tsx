import { Hero } from "@/components/landing/Hero";
import { PhaseCards } from "@/components/landing/PhaseCards";
import { EcosystemDiagram } from "@/components/landing/EcosystemDiagram";

export default function Home() {
  return (
    <>
      <Hero />
      <PhaseCards />
      <EcosystemDiagram />
    </>
  );
}
