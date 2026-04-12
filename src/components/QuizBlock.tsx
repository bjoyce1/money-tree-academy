import { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle } from 'lucide-react';
import quizzes from '../data/quizzes.json';
import { useCoins } from './CoinsSystem';

export default function QuizBlock({ quizId }: { quizId: string }) {
  const quiz = quizzes.find(q => q.id === quizId);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const { awardCoins } = useCoins();

  // Reset quiz state when quizId changes (navigating between chapters)
  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [quizId]);

  if (!quiz) return null;

  const score = () => {
    let s = 0;
    quiz.questions.forEach(q => {
      const a = answers[q.id] || [];
      const correct = JSON.stringify(a.sort()) === JSON.stringify(q.answerKey.slice().sort());
      if (correct) s += 1;
    });
    return s;
  };

  return (
    <div className="mt-12 border-t border-slate-700 pt-8" data-testid="quiz-block">
      <h3 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
        <Lightbulb className="text-brand2" size={20} />
        Quick Quiz
      </h3>
      {quiz.questions.map(q => (
        <div key={q.id} className="mb-6">
          <div className="font-medium text-slate-200 mb-4" data-testid={`question-${q.id}`}>
            {q.prompt}
          </div>
          <div className="space-y-3">
            {q.choices.map((choice, idx) => {
              const isMulti = q.type === 'multi';
              const selected = (answers[q.id] || []).includes(idx);
              const isCorrect = q.answerKey.includes(idx);
              const showResult = submitted;
              
              const toggle = () => {
                setAnswers(prev => {
                  const curr = prev[q.id] || [];
                  let next = [];
                  if (isMulti) {
                    next = selected ? curr.filter(i => i !== idx) : [...curr, idx];
                  } else {
                    next = [idx];
                  }
                  return { ...prev, [q.id]: next };
                });
              };

              return (
                <label 
                  key={idx} 
                  className={`quiz-choice flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                    showResult
                      ? isCorrect
                        ? 'border-green-500 bg-green-900/20'
                        : selected
                        ? 'border-red-500 bg-red-900/20'
                        : 'border-slate-700'
                      : selected
                      ? 'border-brand bg-slate-800'
                      : 'border-slate-700 hover:border-brand/50'
                  }`}
                  data-testid={`choice-${q.id}-${idx}`}
                >
                  <input 
                    type="checkbox" 
                    checked={selected} 
                    onChange={toggle} 
                    className="mr-3 text-brand"
                    disabled={submitted}
                  />
                  <span className="flex-1">{choice}</span>
                  {showResult && isCorrect && (
                    <CheckCircle className="text-green-400 ml-2" size={16} />
                  )}
                </label>
              );
            })}
          </div>
          {submitted && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg fade-in">
              <p className="text-sm text-green-300 flex items-center gap-2">
                <CheckCircle size={16} />
                {q.explanation}
              </p>
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-4">
        {!submitted && (
          <button 
            onClick={() => {
              setSubmitted(true);
              
              // Award coins based on quiz performance
              const finalScore = score();
              const percentage = (finalScore / quiz.questions.length) * 100;
              let coinReward = 10; // Base reward
              
              if (percentage === 100) {
                coinReward = 30; // Perfect score
              } else if (percentage >= 80) {
                coinReward = 25; // Excellent
              } else if (percentage >= 60) {
                coinReward = 20; // Good
              } else {
                coinReward = 15; // Participation
              }
              
              awardCoins(coinReward, `Quiz completed (${percentage.toFixed(0)}% score)`, 'quiz');
            }} 
            className="bg-brand text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-brand/90 transition-colors"
            data-testid="button-submit-quiz"
          >
            Submit
          </button>
        )}
        {submitted && (
          <div className="font-semibold text-slate-200" data-testid="quiz-score">
            Score: {score()} of {quiz.questions.length}
          </div>
        )}
      </div>
    </div>
  );
}
