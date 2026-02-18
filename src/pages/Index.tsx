import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Leaderboard from "@/components/Leaderboard";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="bg-background">
      <Hero />
      <Features />
      <HowItWorks />
      <Leaderboard />
      <Footer />
    </main>
  );
};

export default Index;
