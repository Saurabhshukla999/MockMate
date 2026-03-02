import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Sign Up & Set Skills",
    description: "Create your profile and tag your focus areas — DSA, React, DBMS, System Design, or soft skills.",
  },
  {
    number: "02",
    title: "Get Matched",
    description: "Our algorithm pairs you with a peer at a similar level anywhere in the world. Pick a 30-min slot that fits your schedule.",
  },
  {
    number: "03",
    title: "Practice Live",
    description: "Join the video session with shared whiteboard, code editor, and aptitude quizzes. Record for later.",
  },
  {
    number: "04",
    title: "Review & Grow",
    description: "Rate each other, read AI-generated transcripts, and get mentor feedback on your performance.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-widest">How It Works</span>
          <h2 className="text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Four Steps to{" "}
            <span className="text-gradient">Interview Ready</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary/40 to-transparent z-0" />
              )}
              <div className="relative z-10">
                <span className="text-5xl font-bold text-gradient opacity-60">{step.number}</span>
                <h3 className="text-xl font-semibold mt-4 mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
