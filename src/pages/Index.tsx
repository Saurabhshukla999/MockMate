import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Leaderboard from "@/components/Leaderboard";
import Footer from "@/components/Footer";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

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
