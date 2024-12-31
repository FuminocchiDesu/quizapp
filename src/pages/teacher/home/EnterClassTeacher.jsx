import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';

import { LuClipboardList } from "react-icons/lu";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaSortAlphaUp, FaSortAlphaDown  } from "react-icons/fa";
import { IoPersonAddSharp } from "react-icons/io5";
import { InviteStudentModal, DeleteQuizModal, RemoveStudentModal, QuizReportModal } from "./modals";
import { CiCircleRemove } from "react-icons/ci";

export const EnterClassTeacher = () => {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportModal, setReportModal] = useState({ show: false, quizId: null, quizTitle: '' });
    const [inviteStudentModal, setInviteStudentModal] = useState(false);
    const [activeTab, setActiveTab] = useState('quizzes');
    const [showDropdown, setShowDropdown] = useState({ show: false, quizId: null });
    const [deleteQuizModal, setDeleteQuizModal] = useState({ show: false, quizId: null, quizName: '' });
    const [removeStudentModal, setRemoveStudentModal] = useState({ 
        show: false, 
        studentId: null, 
        studentName: '' 
    });
    const [isAscending, setIsAscending] = useState(true);

    // Add sorting function
    const handleSort = () => {
        const sortedStudents = [...students].sort((a, b) => {
            const nameA = `${a.last_name}, ${a.first_name}`;
            const nameB = `${b.last_name}, ${b.first_name}`;
            
            if (isAscending) {
                return nameB.localeCompare(nameA); // descending
            }
            return nameA.localeCompare(nameB); // ascending
        });
        
        setStudents(sortedStudents);
        setIsAscending(!isAscending);
    };

    const [quizzes, setQuizzes] = useState([]);
    const [students, setStudents] = useState([]);

    // Fetch class data, quizzes, and students
    useEffect(() => {
        const fetchClassData = async () => {
            try {
                setLoading(true);
                const accessToken = localStorage.getItem('accessToken');
                
                // Fetch class details
                const classResponse = await fetch(`https://apiquizapp.pythonanywhere.com/api/classes/${classId}/`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });

                if (!classResponse.ok) {
                    throw new Error('Failed to fetch class data');
                }

                const classDetails = await classResponse.json();
                setClassData(classDetails);

                // Fetch quizzes specifically for this class
                const quizzesResponse = await fetch(`https://apiquizapp.pythonanywhere.com/api/quizzes/?class=${classId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });

                if (!quizzesResponse.ok) {
                    throw new Error('Failed to fetch quizzes');
                }

                const quizzesData = await quizzesResponse.json();
                
                // Filter quizzes to only include ones associated with this class
                const classQuizzes = quizzesData.filter(quiz => 
                    quiz.classes.includes(parseInt(classId))
                );
                
                setQuizzes(classQuizzes);

                // Set students from class details
                setStudents(classDetails.students || []);
                
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchClassData();
    }, [classId]);

    // Delete quiz
    const handleDeleteQuiz = async (quizId) => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`https://apiquizapp.pythonanywhere.com/api/quizzes/${quizId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete quiz');
            }

            setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
            setDeleteQuizModal({ show: false, quizId: null, quizName: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleViewQuizClick = (quiz) => {
        navigate(`quiz/${quiz.id}`);
    };

    // Remove student
    const handleRemoveStudent = async (studentId) => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`https://apiquizapp.pythonanywhere.com/api/classes/${classId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    remove_student: studentId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to remove student');
            }

            setStudents(students.filter(student => student.id !== studentId));
            setRemoveStudentModal({ show: false, studentId: null, studentName: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown.show && !event.target.closest('.EnterClassTeacher__dots-wrapper')) {
                setShowDropdown({ show: false, quizId: null });
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showDropdown.show]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!classData) return <div>Class not found</div>;

    return (
        <>
            <nav className="QuizzesTeacher__breadcrumb">
                <Link to="/teacher/home" className="QuizzesTeacher__breadcrumb-nav">
                        <span>Home</span>
                </Link>
                <span> &gt; </span>
                <span>{classData?.name || 'Loading...'}</span>
            </nav>

            <div className="EnterClassTeacher__container">
                <div className="EnterClassTeacher__header-section">
                    <div>
                        <p className="EnterClassTeacher__sub-section">{classData.section}</p>
                        <h1 className="EnterClassTeacher__class-name">{classData.name}</h1>
                    </div>
                    {activeTab === 'quizzes' && (
                        <button className="EnterClassTeacher__create-quiz-btn" onClick={() => navigate('/teacher/quizzes')}>
                            Create a Quiz
                        </button>
                    )}
                </div>

                <div className="EnterClassTeacher__tabs">
                    <button 
                        className={`EnterClassTeacher__tab ${activeTab === 'quizzes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('quizzes')}
                    >
                        Quizzes
                    </button>
                    <button 
                        className={`EnterClassTeacher__tab ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveTab('students')}
                    >
                        Students
                    </button>
                </div>

                <div className="EnterClassTeacher__main-content">
                    {activeTab === 'quizzes' && (
                        <div className="EnterClassTeacher__quiz-list">
                            {quizzes.length > 0 ? quizzes.map(quiz => (
                                <div key={quiz.id} className="EnterClassTeacher__quiz-item" onClick={() => handleViewQuizClick(quiz)}>
                                    <span className="EnterClassTeacher__quiz-icon-container">
                                        <LuClipboardList className="EnterClassTeacher__quiz-icon"/>
                                    </span>
                                    <span className="EnterClassTeacher__quiz-name">{quiz.title}</span>
                                    <div className="EnterClassTeacher__dots-wrapper">
                                        <BsThreeDotsVertical 
                                            className="EnterClassTeacher__3dots-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDropdown({ 
                                                    show: !showDropdown.show || showDropdown.quizId !== quiz.id, 
                                                    quizId: quiz.id 
                                                });
                                            }}
                                        />
                                        {showDropdown.show && showDropdown.quizId === quiz.id && (
                                            <div className="EnterClassTeacher__dropdown">
                                                <button 
                                                    className="EnterClassTeacher__dropdown-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDropdown({ show: false, quizId: null });
                                                        setReportModal({ 
                                                            show: true, 
                                                            quizId: quiz.id,
                                                            quizTitle: quiz.title 
                                                        });
                                                    }}
                                                >
                                                    Generate Reports
                                                </button>
                                                <button 
                                                    className="EnterClassTeacher__dropdown-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteQuizModal({ 
                                                            show: true, 
                                                            quizId: quiz.id,
                                                            quizName: quiz.title 
                                                        });
                                                        setShowDropdown({ show: false, quizId: null });
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="EnterClassTeacher__no-quizzes">
                                    No quizzes available for this class yet.
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'students' && (
                        <div className="EnterClassTeacher__students-list">
                            <div className="EnterClassTeacher__students-header">
                                <div className="EnterClassTeacher__students-flex">
                                    <span className="EnterClassTeacher__students-name">Students Name</span> 
                                    <div onClick={handleSort} style={{ cursor: 'pointer' }}>
                                        {isAscending ? (
                                            <FaSortAlphaUp className="EnterClassTeacher__students-sort"/>
                                        ) : (
                                            <FaSortAlphaDown className="EnterClassTeacher__students-sort"/>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="EnterClassTeacher__students-flexs">
                                    <span className="EnterClassTeacher__students-count">{students.length} {`Student${students.length === 1 ? '': 's'} `}</span>
                                    <span className="EnterClassTeacher__students-add-container" onClick={() => setInviteStudentModal(true)}>
                                        <IoPersonAddSharp className="EnterClassTeacher__students-add" />
                                    </span>
                                </div>
                            </div>

                            <div className="EnterClassTeacher__students-items">
                                {students.map((student, index) => (
                                    <div 
                                        key={student.id} 
                                        className={`EnterClassTeacher__student-item ${index % 2 === 0 ? 'even' : ''}`}
                                    >
                                        <div className="EnterClassTeacher__student-info">
                                                {student.profile_picture ? (
                                                    <img 
                                                    src={student.profile_picture} 
                                                    alt={student.last_name} 
                                                    className="EnterClassTeacher__student-stored-avatar"
                                                    />
                                                ) : (
                                                    <div className="EnterClassTeacher__student-avatar">
                                                        {student.last_name.charAt(0)}
                                                    </div>
                                                )}
                                                {!student.first_name || !student.last_name ? (
                                                    <span className="EnterClassTeacher__student-name">
                                                        {student.username} 
                                                    </span>
                                                ) : (
                                                    <span className="EnterClassTeacher__student-name">
                                                        {student.last_name}, {student.first_name} 
                                                    </span>
                                                )}
                                        </div>
                                        <CiCircleRemove 
                                            className="EnterClassTeacher__remove-student"
                                            onClick={() => setRemoveStudentModal({ 
                                                show: true, 
                                                studentId: student.id, 
                                                studentName: `${student.first_name} ${student.last_name}`
                                            })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <InviteStudentModal
                isOpen={inviteStudentModal}
                onClose={() => setInviteStudentModal(false)}
                classId={classId}
            />

            <DeleteQuizModal 
                isOpen={deleteQuizModal.show}
                onClose={() => setDeleteQuizModal({ show: false, quizId: null, quizName: '' })}
                onConfirm={() => handleDeleteQuiz(deleteQuizModal.quizId)}
                quizName={deleteQuizModal.quizName}
            />

            <RemoveStudentModal
                isOpen={removeStudentModal.show}
                onClose={() => setRemoveStudentModal({ show: false, studentId: null, studentName: '' })}
                onConfirm={() => handleRemoveStudent(removeStudentModal.studentId)}
                studentName={removeStudentModal.studentName}
            />

            <QuizReportModal
                isOpen={reportModal.show}
                onClose={() => setReportModal({ show: false, quizId: null, quizTitle: '' })}
                quizId={reportModal.quizId}
                quizTitle={reportModal.quizTitle}
            />
        </>
    );
};