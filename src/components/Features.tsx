import { motion } from "framer-motion";
import { Users, Code, Brain, Star, Calendar, Shield } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Smart Peer Matching",
    description: "Matched by skills — DSA, React, DBMS. Practice with peers at your level from CSE colleges worldwide.",
  },
  {
    icon: Code,
    title: "Live Code Whiteboard",
    description: "Real-time collaborative code editor. Write, debug, and discuss solutions together during sessions.",
  },
  {
    icon: Brain,
    title: "GATE-Style Quizzes",
    description: "Aptitude quizzes modeled after GATE patterns. Test logical reasoning and subject knowledge.",
  },
  {
    icon: Star,
    title: "Ratings & Transcripts",
    description: "Post-session ratings, AI transcripts, and mentor feedback to track your growth over time.",
  },
  {
    icon: Calendar,
    title: "College Calendar Slots",
    description: "Schedule sessions across time zones. Book 30-min slots that fit your routine.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Anonymized recordings for self-review. Your identity stays protected — focus on improving.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-widest">Features</span>
          <h2 className="text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Everything You Need to{" "}
            <span className="text-gradient">Ace Interviews</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From peer matching to live coding — a complete practice ecosystem built for CSE students.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group p-8 rounded-2xl gradient-card border border-border hover:border-primary/30 transition-all duration-300 hover:glow-coral"
            >
              <div className="w-12 h-12 rounded-xl gradient-coral flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
