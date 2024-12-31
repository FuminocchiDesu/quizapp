import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link} from 'react-router-dom';
import 'assets/css/student';
import { FaRegClock } from "react-icons/fa";
import { FaRegCircleCheck } from "react-icons/fa6";

export const TakeQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [classData, setClassData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [quizResults, setQuizResults] = useState(null);

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
                if (!quizData.questions || quizData.questions.length === 0) {
                    throw new Error('No questions available for this quiz');
                }
                setQuiz(quizData);
                setTimeLeft(quizData.time_limit_minutes * 60);

                // Fetch class data using the first class ID from the quiz
                if (quizData.classes && quizData.classes.length > 0) {
                    const classResponse = await fetch(`https://apiquizapp.pythonanywhere.com/api/classes/${quizData.classes[0]}/`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    
                    if (!classResponse.ok) {
                        throw new Error('Failed to fetch class data');
                    }
                    const classData = await classResponse.json();
                    setClassData(classData);
                }
                
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchQuizAndClass();
    }, [quizId]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);


    const validateCurrentPage = () => {
        const startIndex = currentPage * questionsPerPage;
        const endIndex = Math.min(startIndex + questionsPerPage, quiz.questions.length);
        const currentQuestions = quiz.questions.slice(startIndex, endIndex);
        
        let newValidationErrors = {};
        let isValid = true;

        currentQuestions.forEach(question => {
            if (!answers[question.id] || answers[question.id].trim() === '') {
                newValidationErrors[question.id] = 'This question requires an answer';
                isValid = false;
            }
        });

        setValidationErrors(newValidationErrors);
        return isValid;
    };



    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));

        setValidationErrors(prev => ({
            ...prev,
            [questionId]: undefined
        }));
    };

    const handleSubmit = async () => {
        if (validateCurrentPage()) {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const response = await fetch(`https://apiquizapp.pythonanywhere.com/api/quizzes/${quizId}/take_quiz/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ answers })
                });

                if (!response.ok) {
                    throw new Error('Failed to submit quiz');
                }

                const result = await response.json();
                setQuizResults(result); // Store the results
                setIsCompleted(true);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleViewScore = () => {
        navigate(`results`, { state: { results: quizResults } });
    };


    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const goToNextPage = () => {
        if (validateCurrentPage()) {
            if (currentPage < Math.ceil(quiz.questions.length / questionsPerPage) - 1) {
                setCurrentPage(prev => prev + 1);
                setValidationErrors({}); // Clear validation errors when changing page
            }
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    if (loading) {
        return (
            <div className="quiz-loading">
                 <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-error">
                <p>{error}</p>
            </div>
        );
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="quiz-error">
                <p>No questions available for this quiz</p>
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

            <div className='TakeQuiz__box-shadow'>
                <div className="TakeQuiz__quiz-header">
                    <div className="TakeQuiz__title-section">
                        <h1 className="TakeQuiz__section-header">{quiz.title}</h1>
                        <p className="TakeQuiz__quiz-subtitle">Read each question carefully before answering.</p>
                    </div>
                    {!isCompleted && (
                        <div className="TakeQuiz__quiz-timer">
                            <span className="TakeQuiz__quiz-timer-clock">{formatTime(timeLeft)}</span>
                            <FaRegClock/>
                        </div>
                    )}
                </div>

                {!isCompleted ? (
                    <div className="TakeQuiz__quiz-main-take">
                        {currentQuestions.map((questionData, index) => (
                            <div key={questionData.id}   className={`TakeQuiz__question-container ${
                                index === currentQuestions.length - 1 ? 'last' : ''
                            }`}
                            >
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
                                        {['option_a', 'option_b', 'option_c', 'option_d'].map((option, optionIndex) => (
                                            questionData[option] && (
                                                <label key={option} className="TakeQuiz__option-label">
                                                    <input
                                                        type="radio"
                                                        name={`question-${questionData.id}`}
                                                        value={optionIndex}
                                                        checked={answers[questionData.id] === optionIndex.toString()}
                                                        onChange={(e) => handleAnswerChange(questionData.id, e.target.value)}
                                                        required
                                                    />
                                                    <span className="TakeQuiz__option-text">{questionData[option]}</span>
                                                </label>
                                            )
                                        ))}
                                        {validationErrors[questionData.id] && (
                                            <div className="TakeQuiz__validation-error">
                                                {validationErrors[questionData.id]}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {questionData.question_type === 'TF' && (
                                    <div className="options-container">
                                        {['True', 'False'].map((option) => (
                                            <label key={option} className="TakeQuiz__option-label">
                                                <input
                                                    type="radio"
                                                    name={`question-${questionData.id}`}
                                                    value={option}
                                                    checked={answers[questionData.id] === option}
                                                    onChange={(e) => handleAnswerChange(questionData.id, e.target.value)}
                                                    required
                                                />
                                                <span className="TakeQuiz__true-false-option-text">{option}</span>
                                            </label>
                                        ))}
                                        {validationErrors[questionData.id] && (
                                            <div className="TakeQuiz__validation-error">
                                                {validationErrors[questionData.id]}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {questionData.question_type === 'ID' && (
                                    <div className='TakeQuiz__input-short-container'>
                                        <input
                                            type="text"
                                            className="TakeQuiz__identification-input"
                                            value={answers[questionData.id] || ''}
                                            onChange={(e) => handleAnswerChange(questionData.id, e.target.value)}
                                            placeholder="Type your answer here..."
                                            required
                                        />
                                        {validationErrors[questionData.id] && (
                                            <div className="TakeQuiz__validation-error">
                                                {validationErrors[questionData.id]}
                                            </div>
                                        )}
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
                                    onClick={handleSubmit}
                                >
                                    Submit
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
                ) : (
                    <div className='ThankyouSubmit__content'>
                        <div className='ThankyouSubmit__header'>
                            <FaRegCircleCheck className='ThankyouSubmit__header-icon'/>
                            <span className='ThankyouSubmit__header-text'>Thank You!</span>
                        </div>
                        <p className='ThankyouSubmit__header-sub-text'>Your response has been submitted.</p>

                        <div className='ThankyouSubmit__btn-actions'>
                            <button className='ThankyouSubmit__btn-view-score'
                            onClick={handleViewScore}
                            >
                                View Score
                            </button>
                            <button className='ThankyouSubmit__btn-done'
                            onClick={() => navigate(`/student/home/class/${classData?.id}`)}
                            >
                                Done
                            </button>

                        </div>
                        
                </div>
                )}
            </div>

           

        </>
    );
};