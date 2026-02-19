import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BookOpen, CheckCircle, XCircle } from "lucide-react";

const SAMPLE_QUESTIONS = [
  {
    id: "1",
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correct: 1,
    topic: "DSA",
  },
  {
    id: "2",
    question: "Which hook is used for side effects in React?",
    options: ["useState", "useEffect", "useReducer", "useMemo"],
    correct: 1,
    topic: "React",
  },
  {
    id: "3",
    question: "What does ACID stand for in DBMS?",
    options: [
      "Atomicity, Consistency, Isolation, Durability",
      "Association, Consistency, Integrity, Durability",
      "Atomicity, Concurrency, Isolation, Durability",
      "Atomicity, Consistency, Isolation, Dependency",
    ],
    correct: 0,
    topic: "DBMS",
  },
];

const Quizzes = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = SAMPLE_QUESTIONS[currentQ];

  const handleAnswer = () => {
    const isCorrect = parseInt(selected) === q.correct;
    if (isCorrect) setScore((s) => s + 1);
    setAnswered(true);
  };

  const handleNext = () => {
    if (currentQ + 1 >= SAMPLE_QUESTIONS.length) {
      setFinished(true);
    } else {
      setCurrentQ((c) => c + 1);
      setSelected("");
      setAnswered(false);
    }
  };

  if (finished) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-xl p-4 pt-8">
          <Card className="gradient-card border-border text-center">
            <CardContent className="pt-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
              <h2 className="font-display text-2xl font-bold">Quiz Complete!</h2>
              <p className="text-4xl font-display font-bold text-gradient">{score}/{SAMPLE_QUESTIONS.length}</p>
              <Button onClick={() => { setCurrentQ(0); setScore(0); setFinished(false); setSelected(""); setAnswered(false); }}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-xl p-4 pt-8">
        <Card className="gradient-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> GATE-Style Quiz
              </CardTitle>
              <Badge variant="outline">{currentQ + 1}/{SAMPLE_QUESTIONS.length}</Badge>
            </div>
            <Badge variant="secondary" className="w-fit">{q.topic}</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-foreground font-medium">{q.question}</p>
            <RadioGroup value={selected} onValueChange={setSelected} disabled={answered}>
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    answered && i === q.correct ? "border-green-500 bg-green-500/10" :
                    answered && parseInt(selected) === i && i !== q.correct ? "border-destructive bg-destructive/10" :
                    "border-border"
                  }`}
                >
                  <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                  <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                  {answered && i === q.correct && <CheckCircle className="h-4 w-4 text-green-400" />}
                  {answered && parseInt(selected) === i && i !== q.correct && <XCircle className="h-4 w-4 text-destructive" />}
                </div>
              ))}
            </RadioGroup>
            {!answered ? (
              <Button onClick={handleAnswer} disabled={!selected} className="w-full">Submit Answer</Button>
            ) : (
              <Button onClick={handleNext} className="w-full">
                {currentQ + 1 >= SAMPLE_QUESTIONS.length ? "See Results" : "Next Question"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quizzes;
