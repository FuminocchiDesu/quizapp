import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import 'assets/css/student';
import { LuClipboardList } from "react-icons/lu";
import { FaClockRotateLeft } from "react-icons/fa6";
import { ClosedClassModal } from './modals/ClosedClassModal';

export const EnterClassStudent = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingQuiz, setProcessingQuiz] = useState(null);
    const [quizAttempts, setQuizAttempts] = useState({});
    const [closedClassModal, setClosedClassModal] = useState(false);

    // Modified fetchAllQuizAttempts to properly handle the response
    const fetchAllQuizAttempts = async (quizzes, accessToken) => {
        try {
            const attempts = {};
            for (const quiz of quizzes) {
                const attemptsResponse = await fetch(
                    `https://apiquizapp.pythonanywhere.com/api/attempts/?quiz=${quiz.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );

                if (attemptsResponse.ok) {
                    const attemptsData = await attemptsResponse.json();
                    // Store the actual attempts array, not filtered
                    attempts[quiz.id] = attemptsData;
                }
            }
            setQuizAttempts(attempts);
        } catch (error) {
            console.error('Error fetching attempts:', error);
        }
    };

    useEffect(() => {
        const fetchClassAndQuizzes = async () => {
            try {
                setLoading(true);
                const accessToken = localStorage.getItem('accessToken');
                
                const classResponse = await fetch(`https://apiquizapp.pythonanywhere.com/api/classes/${classId}/`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!classResponse.ok) {
                    throw new Error('Failed to fetch class data');
                }
                const classData = await classResponse.json();
                setClassData(classData);

                const quizzesResponse = await fetch(`https://apiquizapp.pythonanywhere.com/api/quizzes/?class=${classId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!quizzesResponse.ok) {
                    throw new Error('Failed to fetch quizzes');
                }
                const quizzesData = await quizzesResponse.json();
                
                const classQuizzes = quizzesData.filter(quiz => 
                    quiz.classes.includes(parseInt(classId))
                );
                
                setQuizzes(classQuizzes);
                await fetchAllQuizAttempts(classQuizzes, accessToken);
                
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchClassAndQuizzes();
    }, [classId]);

    const isQuizAvailable = (quiz) => {
        const now = new Date();
        const start = new Date(quiz.start_datetime);
        const end = new Date(quiz.end_datetime);
        return now >= start && now <= end;
    };

    // Modified handleQuizClick to properly check attempts
    const handleQuizClick = async (quiz) => {
        if (processingQuiz) return;
        
        const now = new Date();
        const start = new Date(quiz.start_datetime);
        const end = new Date(quiz.end_datetime);
        
        if (now < start || now > end) {
            setClosedClassModal(true);
            return;
        }
        // Check if we have attempts for this quiz
        const attempts = quizAttempts[quiz.id] || [];
        const hasAttempt = attempts.length > 0;

        if (hasAttempt) {
            navigate(`quiz/${quiz.id}/results`);
            return;
        }

        if (isQuizAvailable(quiz)) {
            setProcessingQuiz(quiz.id);
            
            try {
                const accessToken = localStorage.getItem('accessToken');
                const attemptsResponse = await fetch(
                    `https://apiquizapp.pythonanywhere.com/api/attempts/?quiz=${quiz.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );
        
                if (!attemptsResponse.ok) {
                    throw new Error('Failed to check quiz attempts');
                }
        
                const attempts = await attemptsResponse.json();
                
                if (attempts && attempts.length > 0) {
                    navigate(`quiz/${quiz.id}/results`);
                } else {
                    navigate(`quiz/${quiz.id}`);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setProcessingQuiz(null);
            }
        }
    };

    const getQuizStatusClass = (quiz) => {
        const now = new Date();
        const start = new Date(quiz.start_datetime);
        const end = new Date(quiz.end_datetime);

        if (now < start) {
            return 'quiz-item--upcoming';
        } else if (now > end) {
            return 'quiz-item--expired';
        } else {
            return 'quiz-item--available';
        }
    };

    return (
        <>
            <nav className="QuizzesTeacher__breadcrumb">
                <Link to="/student/home" className="QuizzesTeacher__breadcrumb-nav">
                        <span>Home</span>
                </Link>
                <span> &gt; </span>
                <span>{classData?.name || 'Loading...'}</span>
            </nav>
            
            <div className="EnterClassTeacher__main-content">
                <div className="EnterClassTeacher__tabs">
                    <button 
                        className={'EnterClassTeacher__tab active'}
                    >
                        Quizzes
                    </button>
                </div>
        
                {loading ? (
                    <div className="EnterClassStudent__loading-container">
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                <div className="EnterClassStudent__quiz-list">
                    {quizzes.length > 0 ? (
                        quizzes.map((quiz) => {
                            const hasAttempt = quizAttempts[quiz.id]?.length > 0;
                            return (
                                <div 
                                    key={quiz.id}
                                    className={`EnterClassStudent__quiz-item ${getQuizStatusClass(quiz)}`}
                                    onClick={() => handleQuizClick(quiz)}
                                    style={{ cursor: processingQuiz === quiz.id ? 'wait' : 'pointer' }}
                                >
                                    <span className="EnterClassStudent__quiz-icon-container">
                                        <LuClipboardList className="EnterClassStudent__quiz-icon"/>
                                    </span>
                                    <span className="EnterClassStudent__quiz-name">{quiz.title}</span>
                            
                                    <div className="EnterClassStudent__quiz-info">
                                        {isQuizAvailable(quiz) && !hasAttempt ? (
                                            <div className="EnterClassStudent__quiz-timing">
                                                <span className="EnterClassStudent__quiz-status">
                                                    <span 
                                                        className={`UsersAdmin__dot UsersAdmin__active`}   
                                                    />  
                                                    Available now
                                                </span>
                                                <span className="EnterClassStudent__quiz-due-date">
                                                    Due: {new Date(quiz.end_datetime).toLocaleString('en-US', {
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </span>
                                                <span className="EnterClassStudent__quiz-duration">
                                                    <FaClockRotateLeft/>
                                                    {quiz.time_limit_minutes} minutes
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="quiz-timing">
                                                <span className={`EnterClassStudent__quiz-closed ${
                                                     hasAttempt ? 'quiz-timing--completed' : 'quiz-timing--closed'}`}>
                                                    {hasAttempt ? 'Completed' : 'Closed'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="EnterClassStudent__no-available">
                            No quizzes available for this class yet.
                        </div>
                    )}
                </div>
                )}
            </div>

            <ClosedClassModal
                isOpen={closedClassModal}
                onClose={() => setClosedClassModal(false)}
        
            />
        </>
    );
};