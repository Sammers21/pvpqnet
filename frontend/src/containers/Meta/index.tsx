import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

import Grid from "./Grid";

const Meta = () => {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SEO
        title="WoW PvP Meta Analysis & Tier Lists"
        description="Current World of Warcraft PvP Meta, Tier Lists, and Spec Statistics for Arena and Solo Shuffle."
      />
      <Header />
      <main className="flex-1">
        <Grid />
      </main>
      <Footer />
    </div>
  );
};

export default Meta;
