import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import 'assets/css/teacher';

export const ViewQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const questionsPerPage = 5;

    useEffect(() => {
        const fetchQuizAndClass = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const quizResponse = await fetch(`https://apiquizapp.pythonanywhere.com/api/quizzes/${quizId}/`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!quizResponse.ok) {
                    throw new Error('Failed to fetch quiz');
                }
                
                const quizData = await quizResponse.json();
                setQuiz(quizData);

                if (quizData.classes && quizData.classes.length > 0) {
                    const classResponse = await fetch(`https://apiquizapp.pythonanywhere.com/api/classes/${quizData.classes[0]}/`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    
                    if (classResponse.ok) {
                        const classData = await classResponse.json();
                        setClassData(classData);
                    }
                }
                
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
    
        fetchQuizAndClass();
    }, [quizId]);

    const goToNextPage = () => {
        if (currentPage < Math.ceil(quiz.questions.length / questionsPerPage) - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    // Helper function to determine if an option is the correct answer
    const isCorrectOption = (questionData, optionValue) => {
        return questionData.correct_answer === optionValue;
    };

    if (loading) {
        return (
            <div className="quiz-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const startIndex = currentPage * questionsPerPage;
    const endIndex = Math.min(startIndex + questionsPerPage, quiz.questions.length);
    const currentQuestions = quiz.questions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(quiz.questions.length / questionsPerPage);
    
    return (
        <>
            <nav className="QuizzesTeacher__breadcrumb">
                <Link to="/teacher/home" className="QuizzesTeacher__breadcrumb-nav">
                    <span>Home</span>
                </Link>
                <span> &gt; </span>
                <Link to={`/teacher/home/class/${classData?.id}`} className="QuizzesTeacher__breadcrumb-nav">
                    <span>{classData?.name || 'Loading...'}</span>
                </Link>
                <span> &gt; </span>
                <span>{quiz?.title || 'Loading...'}</span>
            </nav>  

            <div className='TakeQuiz__box-shadow'>
                <div className="TakeQuiz__quiz-header">
                    <div className="TakeQuiz__title-section">
                        <h1 className="TakeQuiz__section-header">{quiz?.title || 'Quiz Title'}</h1>
                        <p className="TakeQuiz__quiz-subtitle">Read each question carefully before answering.</p>
                        <p className="TakeQuiz__quiz-subtitle-total">
                            Total Questions: 
                            <strong className="TakeQuiz__quiz-subtitle-totaled">{quiz?.questions.length || 0}</strong>
                        </p>
                    </div>
                </div>

                <div className="TakeQuiz__quiz-main-take">
                {currentQuestions.map((questionData, index) => (
                    <div key={questionData.id} className={`TakeQuiz__question-container ${
                        index === currentQuestions.length - 1 ? 'last' : ''
                    }`}>
                        <div className="ViewQuiz__question-header">
                            <p className="TakeQuiz__question-text">
                                {startIndex + index + 1}. {questionData.question_text}
                            </p>
                            <span className="ViewQuiz__question-points">
                                {questionData.points} {questionData.points === 1 ? 'point' : 'points'}
                            </span>
                        </div>

                        {questionData.question_type === 'MC' && (
                            <div className="TakeQuiz__multi-options-container">
                                {[
                                    { key: 'option_a', value: questionData.option_a },
                                    { key: 'option_b', value: questionData.option_b },
                                    { key: 'option_c', value: questionData.option_c },
                                    { key: 'option_d', value: questionData.option_d }
                                ].map((option, optionIndex) => {
                                    if (!option.value) return null;
                                    const isCorrect = isCorrectOption(questionData, option.value);
                                    
                                    return (
                                        <div 
                                            key={option.key} 
                                            className={`ViewQuiz__option-label ${isCorrect ? 'correct' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${questionData.id}`}
                                                checked={isCorrect} 
                                                readOnly
                                            />
                                            <div className="TakeQuiz__option-text">
                                                {option.value}
                                            </div>
                                            {isCorrect && (
                                                <div className="ViewQuiz__correct-mark">✓</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {questionData.question_type === 'TF' && (
                            <div className="options-container">
                                {['True', 'False'].map((option) => {
                                    const isCorrectAnswer = option === questionData.correct_answer;
                                    
                                    return (
                                        <div 
                                            key={option} 
                                            className={`ViewQuiz__option-label ${isCorrectAnswer ? 'correct' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${questionData.id}`}
                                                checked={isCorrectAnswer} 
                                                readOnly
                                            />
                                            <div className="TakeQuiz__true-false-option-text">
                                                {option}
                                            </div>
                                            {isCorrectAnswer && (
                                                <div className="ViewQuiz__correct-mark">✓</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {questionData.question_type === 'ID' && (
                            <div className='TakeQuiz__input-short-container'>
                                <div className="ViewQuiz__correct-answer-display">
                                    Correct Answer: {questionData.correct_answer}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                    <div className="TakeQuiz__quiz-navigation">
                        {currentPage > 0 && (
                            <button 
                                className="TakeQuiz__back-quiz-button"
                                onClick={goToPreviousPage}
                            >
                                Back
                            </button>
                        )}
                        {currentPage === totalPages - 1 ? (
                                <button 
                                    className="TakeQuiz__submit-quiz-button"
                                    onClick={() => navigate(`/teacher/home/class/${classData?.id}`)}
                                >
                                    Done
                                </button>
                            ) : (
                                <button 
                                    className="TakeQuiz__submit-quiz-button"
                                    onClick={goToNextPage}
                                >
                                    Next
                                </button>
                            )}
                    </div>
                </div>
            </div>
        </>
    );
};