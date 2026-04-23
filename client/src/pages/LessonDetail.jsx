import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';
import api from '../services/api';

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  useEffect(() => {
    api.get('/learning/modules')
      .then(res => {
        const mod = res.data.modules.find(m => m.id === id);
        if (mod) {
          setLesson(mod);
          if (mod.isCompleted && !mod.quizPassed) {
            setQuizMode(true);
          }
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [id, token]);

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      const { data } = await api.post(`/learning/complete/${id}`);
      if (data.success) {
        setLesson(prev => ({ ...prev, isCompleted: true }));
        if (data.user) {
          useAuthStore.getState().syncUser(data.user);
        }
        setQuizMode(true);
        alert(`+${data.rewardPoints} Points Earned! Now time for the quiz.`);
      }
    } catch (e) {
      console.error(e);
    }
    setCompleting(false);
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length < lesson.quiz.length) {
      return alert("Please answer all questions.");
    }
    setSubmittingQuiz(true);
    try {
      const answerArray = lesson.quiz.map((q, i) => answers[i]);
      const { data } = await api.post(`/learning/quiz/${id}`, { answers: answerArray });
      setQuizResult(data);
      if (data.passed && data.rewardPoints > 0) {
        setLesson(prev => ({ ...prev, quizPassed: true }));
        if (data.user) {
          useAuthStore.getState().syncUser(data.user);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSubmittingQuiz(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Lesson...</div>;
  if (!lesson) return <div style={{ padding: 40, textAlign: 'center' }}>Lesson not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lesson-detail" style={{ paddingBottom: 60, maxWidth: 600, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← Back</button>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        {!quizMode ? (
          <>
            {lesson.type === 'video' ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                <iframe 
                  src={lesson.videoUrl} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div style={{ padding: 20 }}>
                <img src={lesson.thumbnail} alt={lesson.title} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
                <h2 style={{ marginBottom: 12 }}>{lesson.title}</h2>
                <p style={{ lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{lesson.content}</p>
              </div>
            )}
            
            <div style={{ padding: 20 }}>
              {lesson.type === 'video' && <h2 style={{ marginBottom: 8, fontSize: 20 }}>{lesson.title}</h2>}
              <p className="text-secondary">{lesson.description}</p>
              <div style={{ marginTop: 20 }}>
                {lesson.isCompleted ? (
                  <button className="btn btn-primary w-full" onClick={() => setQuizMode(true)}>Continue to Quiz →</button>
                ) : (
                  <button className="btn btn-primary w-full" onClick={handleMarkComplete} disabled={completing}>
                    {completing ? 'Processing...' : `Mark as Completed (+${lesson.rewardPoints} pts)`}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 20 }}>
            <h2 style={{ marginBottom: 8 }}>Knowledge Check</h2>
            <p className="text-secondary" style={{ marginBottom: 24 }}>Pass the quiz (60%+) to earn 15 bonus points and master this topic.</p>
            
            {lesson.quiz.map((q, qIndex) => (
              <div key={qIndex} style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                <p style={{ fontWeight: 'bold', marginBottom: 12 }}>{qIndex + 1}. {q.question}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', background: answers[qIndex] === opt ? 'rgba(30,215,96,0.1)' : 'transparent' }}>
                      <input 
                        type="radio" 
                        name={`q-${qIndex}`} 
                        value={opt} 
                        checked={answers[qIndex] === opt}
                        onChange={() => setAnswers({...answers, [qIndex]: opt})}
                        style={{ accentColor: 'var(--color-primary)' }}
                        disabled={!!quizResult && quizResult.passed}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {quizResult && (
              <div style={{ padding: 16, borderRadius: 8, marginBottom: 16, background: quizResult.passed ? 'rgba(30,215,96,0.1)' : 'rgba(239,68,68,0.1)', color: quizResult.passed ? 'var(--color-success)' : 'var(--color-error)', textAlign: 'center', fontWeight: 'bold' }}>
                Score: {quizResult.score}% - {quizResult.message}
              </div>
            )}

            {(!quizResult || !quizResult.passed) && (
              <button className="btn btn-primary w-full" onClick={handleSubmitQuiz} disabled={submittingQuiz}>
                {submittingQuiz ? 'Evaluating...' : 'Submit Answers'}
              </button>
            )}

            {quizResult?.passed && (
              <button className="btn btn-secondary w-full" onClick={() => navigate('/learning')}>
                Back to Learning Hub
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
