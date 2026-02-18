import { motion } from "framer-motion";
import { Trophy, TrendingUp, Medal } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: "Arjun S.", college: "DTU", sessions: 48, rating: 4.9, skill: "DSA" },
  { rank: 2, name: "Priya M.", college: "NSUT", sessions: 42, rating: 4.8, skill: "React" },
  { rank: 3, name: "Rohan K.", college: "IIITD", sessions: 39, rating: 4.8, skill: "DBMS" },
  { rank: 4, name: "Sneha T.", college: "DTU", sessions: 35, rating: 4.7, skill: "System Design" },
  { rank: 5, name: "Vikram J.", college: "NSUT", sessions: 33, rating: 4.7, skill: "DSA" },
];

const rankIcons: Record<number, React.ReactNode> = {
  1: <Trophy className="w-5 h-5 text-accent" />,
  2: <Medal className="w-5 h-5 text-muted-foreground" />,
  3: <Medal className="w-5 h-5 text-primary" />,
};

const Leaderboard = () => {
  return (
    <section id="leaderboard" className="py-24 bg-background relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-widest">Leaderboard</span>
          <h2 className="text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Top <span className="text-gradient">Performers</span> This Month
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Climb the ranks by completing sessions and earning high ratings from peers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-2xl gradient-card border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_100px_80px_100px] px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
            <span>Rank</span>
            <span>Student</span>
            <span className="text-center">Sessions</span>
            <span className="text-center">Rating</span>
            <span className="text-right">Top Skill</span>
          </div>

          {leaderboardData.map((student, i) => (
            <motion.div
              key={student.rank}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-[60px_1fr_100px_80px_100px] px-6 py-4 items-center border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-1">
                {rankIcons[student.rank] || <span className="text-muted-foreground font-medium ml-1">{student.rank}</span>}
              </div>
              <div>
                <span className="font-medium text-foreground">{student.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{student.college}</span>
              </div>
              <div className="text-center text-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                {student.sessions}
              </div>
              <div className="text-center text-accent font-semibold">{student.rating}</div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {student.skill}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Leaderboard;
