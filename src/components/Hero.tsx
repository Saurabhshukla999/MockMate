import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-illustration.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/10 blur-[100px] animate-pulse-glow" />

      <div className="container mx-auto px-6 pt-32 pb-20">
        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/60"
        >
          <div className="container mx-auto px-6 flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-coral flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">MockMate</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              <a href="#leaderboard" className="hover:text-foreground transition-colors">Leaderboard</a>
            </div>
            <Link to="/auth" className="px-5 py-2 rounded-lg gradient-coral text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </motion.nav>

        <div className="grid lg:grid-cols-2 gap-16 items-center mt-12">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 text-sm text-muted-foreground mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Built for CSE Students Worldwide
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
              Practice with{" "}
              <span className="text-gradient">Real Peers</span>
              <br />
              Not Bots
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Get matched with fellow CSE students worldwide for 30-minute live mock interviews.
              Sharpen DSA, React, DBMS & communication skills with real human feedback.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth" className="group px-8 py-4 rounded-xl gradient-coral text-primary-foreground font-semibold text-lg hover:opacity-90 transition-all glow-coral flex items-center gap-2">
                Start Practicing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 rounded-xl border border-border bg-secondary/30 text-foreground font-medium text-lg hover:bg-secondary/50 transition-colors">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center gap-8 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">2,500+</span>
                <span>Students<br/>Matched</span>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">10K+</span>
                <span>Sessions<br/>Completed</span>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">4.8★</span>
                <span>Average<br/>Rating</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden glow-coral border border-border/50">
              <img
                src={heroImage}
                alt="Two students in a mock interview session with code sharing and skill badges"
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 px-4 py-2 rounded-xl gradient-card border border-border text-sm font-medium text-foreground shadow-lg"
            >
              🎯 DSA Match Found!
            </motion.div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl gradient-card border border-border text-sm font-medium text-foreground shadow-lg"
            >
              ⚡ Session in progress...
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
