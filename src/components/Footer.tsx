import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-coral flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">MockMate</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#leaderboard" className="hover:text-foreground transition-colors">Leaderboard</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 MockMate. Built for Delhi CSE students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
