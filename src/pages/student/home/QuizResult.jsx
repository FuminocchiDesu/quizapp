import React, {useState, useEffect} from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import 'assets/css/student';
import { FaRegCircleCheck } from "react-icons/fa6";

const CheckIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const XIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

export const QuizResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [classData, setClassData] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { quizId } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                
                // Fetch quiz data first
                const quizResponse = await fetch(
                    `https://apiquizapp.pythonanywhere.com/api/quizzes/${quizId}/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );

                if (!quizResponse.ok) {
                    throw new Error('Failed to fetch quiz data');
                }

                const quizData = await quizResponse.json();
                
                // Create a map of questions by ID for efficient lookup
                const questionsMap = new Map(
                    quizData.questions.map(q => [q.id, q])
                );
                quizData.questionsMap = questionsMap;
                
                setQuiz(quizData);

                // Fetch class data if we have quiz data
                if (quizData.classes && quizData.classes.length > 0) {
                    const classResponse = await fetch(
                        `https://apiquizapp.pythonanywhere.com/api/classes/${quizData.classes[0]}/`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );
                    
                    if (!classResponse.ok) {
                        throw new Error('Failed to fetch class data');
                    }
                    const classData = await classResponse.json();
                    setClassData(classData);
                }

                // Set results from location state or fetch them
                if (location.state?.results) {
                    setResults(location.state.results);
                } else {
                    const resultsResponse = await fetch(
                        `https://apiquizapp.pythonanywhere.com/api/attempts/?quiz=${quizId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );

                    if (!resultsResponse.ok) {
                        throw new Error('Failed to fetch quiz results');
                    }
            
                    const attemptsData = await resultsResponse.json();
                    if (attemptsData.length > 0) {
                        setResults(attemptsData[0]);
                    } else {
                        throw new Error('No quiz attempt found. Please take the quiz first.');
                    }
                }
            } catch (err) {
                setError(err.message);
                if (err.message.includes('No quiz attempt found')) {
                    navigate(-1);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [quizId, location.state, navigate]);

    const renderQuestionResult = (result, index) => {
        const question = quiz?.questionsMap?.get(result.question_id);
        
        if (!question) {
            return null;
        }

        return (
            <div key={result.question_id} className={`question-result ${result.correct ? 'correct' : 'incorrect'}`}>
                <div className="QuizResult__result-header">
                    <div className="QuizResult__question-number">Question {index + 1}</div>
                    <div className="result-icon">
                        {result.correct ? <FaRegCircleCheck className="QuizResult__result-check-icon"/> : <XIcon />}
                    </div>
                </div>
                <div className="QuizResult__question-text">
                    <p>{question.question_text}</p>
                    {!question.question_text && <p className="error-text">Question text not found</p>}
                </div>
                <div className="QuizResult__answer-details">
                    <div className="QuizResult__answer-row">
                        <span className="QuizResult__answer-label">Your answer:</span>
                        <span className={`QuizResult__answer-value ${
                            result.correct ? 'answer-correct' : 'answer-incorrect'
                        }`}>{result.user_answer || 'No answer recorded'}</span>
                    </div>
                    {quiz.show_correct_answers && (
                        <div className="QuizResult__answer-row">
                            <span className="QuizResult__answer-label">Correct answer:</span>
                            <span className="QuizResult__answer-value answer-correct">
                                {result.correct_answer || 'No correct answer recorded'}
                            </span>
                        </div>
                    )}
                    <div className="QuizResult__points-row">
                        <span className="QuizResult__points-label">Points:</span>
                        <span className="QuizResult__points-value">{result.points} / {result.max_points}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <nav className="QuizzesTeacher__breadcrumb">
                <Link to="/student/home" className="QuizzesTeacher__breadcrumb-nav">
                    <span>Home</span>
                </Link>
                <span> &gt; </span>
                <Link to={`/student/home/class/${classData?.id}`} className="QuizzesTeacher__breadcrumb-nav">
                    <span>{classData?.name || 'Loading...'}</span>
                </Link>
                <span> &gt; </span>
                <span>{quiz?.title || 'Loading...'}</span>
            </nav>

            {loading ? (
                <div className="EnterClassStudent__loading-container">
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <div className="TakeQuiz__box-shadow">
                    <div className="TakeQuiz__quiz-header">
                        <div className="TakeQuiz__title-section">
                            <h1 className="TakeQuiz__section-header">{quiz?.title || 'Quiz Results'}</h1>
                            <p className="TakeQuiz__quiz-subtitle">Here are your quiz results.</p>
                        </div>
                    </div>
            
                    <div className="QuizResult__result-summary">
                        <div className="QuizResult__score-circle">
                            <div className="QuizResult__score-value">
                                {results?.score?.toFixed(1)}%
                            </div>
                            <div className="QuizResult__score-label">Score</div>
                        </div>
                        
                        <div className="QuizResult__stats-container">
                            <div className="QuizResult__stat-item">
                                <span className="QuizResult__stat-label">Correct Items:</span>
                                <span className="QuizResult__stat-value">
                                    {results?.correct_questions} out of {results?.total_questions}
                                </span>
                            </div>
                            <div className="QuizResult__stat-item">
                                <span className="QuizResult__stat-label">Score:</span>
                                <span className="QuizResult__stat-value">
                                    {results?.total_points} / {results?.max_points} 
                                </span>
                            </div>
                        </div>
                    </div>

                    {quiz?.show_correct_answers && results?.results ? (
                        <div className="results-detail">
                            {Array.isArray(results.results) ? (
                                results.results.map((result, index) => renderQuestionResult(result, index))
                            ) : (
                                <div className="error-message">
                                    Results data is not in the expected format.
                                    <pre>{JSON.stringify(results.results, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="no-results-message">
                            {!quiz?.show_correct_answers ? 
                                "The teacher has disabled showing correct answers for this quiz." :
                                "No results data available."}
                        </div>
                    )}

                    <div className="QuizResult__quiz-navigation">
                        <button 
                            onClick={() => navigate(`/student/home/class/${classData?.id}`)} 
                            className="QuizResult__done-button"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};