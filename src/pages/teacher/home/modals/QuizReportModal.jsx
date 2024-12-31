import React, { useState, useEffect, useRef } from 'react';
import Modal from "components/Modal";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaDownload } from 'react-icons/fa';
import QuestionSummaryWithCharts from './QuestionSummaryWithCharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import 'assets/css/modals';

export const QuizReportModal = ({ isOpen, onClose, quizId, quizTitle }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [questionStats, setQuestionStats] = useState([]);
    const [studentScores, setStudentScores] = useState([]);
    const reportRef = useRef();

    useEffect(() => {
        if (isOpen && quizId) {
            fetchReportData();
        }
    }, [isOpen, quizId]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`https://apiquizapp.pythonanywhere.com/api/attempts/?quiz=${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }

            const attempts = await response.json();
            processReportData(attempts);
            processQuestionStats(attempts);
            processStudentScores(attempts);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const processQuestionStats = (attempts) => {
        if (!attempts.length || !attempts[0].results) return;

        // Initialize question statistics
        const questionStats = {};

        attempts.forEach(attempt => {
            attempt.results.forEach(result => {
                if (!questionStats[result.question_id]) {
                    questionStats[result.question_id] = {
                        questionId: result.question_id,
                        totalAttempts: 0,
                        correctAttempts: 0,
                        points: result.max_points,
                        averagePoints: 0,
                    };
                }

                questionStats[result.question_id].totalAttempts++;
                if (result.correct) {
                    questionStats[result.question_id].correctAttempts++;
                }
                questionStats[result.question_id].averagePoints += result.points;
            });
        });

        // Calculate percentages and averages
        const statsArray = Object.values(questionStats).map(stat => ({
            ...stat,
            correctPercentage: ((stat.correctAttempts / stat.totalAttempts) * 100).toFixed(1),
            averagePoints: (stat.averagePoints / stat.totalAttempts).toFixed(1),
        }));

        setQuestionStats(statsArray);
        console.log(questionStats);
    };

    const processStudentScores = (attempts) => {
        const scores = attempts.map(attempt => {
            const firstName = attempt.student.first_name;
            const lastName = attempt.student.last_name;
            const username = attempt.student.username;
            
            // If both first_name and last_name exist, use full name + username
            // Otherwise, just use username
            const studentName = firstName && lastName 
                ? `${firstName} ${lastName}`
                : username;
            
            return {
                studentName,
                score: attempt.score,
                attemptDate: new Date(attempt.attempt_datetime).toLocaleDateString(),
                totalPoints: attempt.total_points,
                maxPoints: attempt.max_points,
            };
        });
    
        // Sort by score in descending order
        scores.sort((a, b) => b.score - a.score);
        setStudentScores(scores);
    };

    const processReportData = (attempts) => {
        if (!attempts.length) {
            setReportData(null);
            return;
        }

        const scores = attempts.map(a => a.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);

        const distribution = {
            'A (90-100)': 0,
            'B (80-89)': 0,
            'C (70-79)': 0,
            'D (60-69)': 0,
            'F (0-59)': 0
        };

        attempts.forEach(attempt => {
            if (attempt.score >= 90) distribution['A (90-100)']++;
            else if (attempt.score >= 80) distribution['B (80-89)']++;
            else if (attempt.score >= 70) distribution['C (70-79)']++;
            else if (attempt.score >= 60) distribution['D (60-69)']++;
            else distribution['F (0-59)']++;
        });

        const distributionData = Object.entries(distribution).map(([grade, count]) => ({
            grade,
            count,
            percentage: (count / attempts.length) * 100
        }));

        const timeData = attempts
            .sort((a, b) => new Date(a.attempt_datetime) - new Date(b.attempt_datetime))
            .map(attempt => ({
                date: new Date(attempt.attempt_datetime).toLocaleDateString(),
                score: attempt.score
            }));

        setReportData({
            totalAttempts: attempts.length,
            averageScore: avgScore.toFixed(1),
            highestScore: maxScore.toFixed(1),
            lowestScore: minScore.toFixed(1),
            distribution: distributionData,
            timeData
        });
    };

    const handleDownloadPDF = async () => {
        try {
            const element = reportRef.current;
            const sections = element.querySelectorAll('.pdf-section');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 40; // margin in pixels

            // Function to add a section to PDF
            const addSectionToPDF = async (section, isFirstPage) => {
                const canvas = await html2canvas(section, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    windowWidth: 1200, // Force consistent width
                    onclone: (clonedDoc) => {
                        // Ensure charts are rendered properly
                        const charts = clonedDoc.getElementsByClassName('recharts-wrapper');
                        Array.from(charts).forEach(chart => {
                            chart.style.width = '100%';
                            chart.style.height = '300px';
                        });
                    }
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const aspectRatio = canvas.width / canvas.height;
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = imgWidth / aspectRatio;

                if (!isFirstPage) {
                    pdf.addPage();
                }

                pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
            };

            // Process each section
            for (let i = 0; i < sections.length; i++) {
                await addSectionToPDF(sections[i], i === 0);
            }

            pdf.save(`${quizTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}_report.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <Modal>
            <div className="QuizReportModal__content">
                <div className="QuizReportModal__header-container">
                    <div className="QuizReportModal__pdf-container">
                        <h2 className="QuizReportModal__title">Report: {quizTitle}</h2>
                        {reportData && (
                            <button 
                                className="QuizReportModal__download-button"
                                onClick={handleDownloadPDF}
                                title="Download PDF"
                            >
                                <FaDownload className="download-icon" /> Download PDF
                            </button>
                        )}
                    </div>
                    <button className="QuizReportModal__close-button" onClick={onClose}>&times;</button>
                </div>

                <div ref={reportRef} className="QuizReportModal__main-content">
                    {loading ? (
                        <div className="QuizReportModal__loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading report data...</p>
                        </div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : !reportData ? (
                        <div className="no-data-message">No attempts recorded for this quiz yet.</div>
                    ) : (
                        <div className="QuizReportModal__report-container">
                            {/* Stats Grid Section */}
                            <div className="pdf-section">
                                <div className="QuizReportModal__stats-grid">
                                    <div className="QuizReportModal__stat-card">
                                        <div className="QuizReportModal__stat-label">Total Attempts</div>
                                        <div className="QuizReportModal__stat-value">{reportData.totalAttempts}</div>
                                    </div>
                                    <div className="QuizReportModal__stat-card">
                                        <div className="QuizReportModal__stat-label">Average Score</div>
                                        <div className="QuizReportModal__stat-value">{reportData.averageScore}%</div>
                                    </div>
                                    <div className="QuizReportModal__stat-card">
                                        <div className="QuizReportModal__stat-label">Highest Score</div>
                                        <div className="QuizReportModal__stat-value">{reportData.highestScore}%</div>
                                    </div>
                                    <div className="QuizReportModal__stat-card">
                                        <div className="QuizReportModal__stat-label">Lowest Score</div>
                                        <div className="QuizReportModal__stat-value">{reportData.lowestScore}%</div>
                                    </div>
                                </div>

                                {/* Score Distribution Section */}   
                                <div className="QuizReportModal__chart-section">
                                    <h3 className="QuizReportModal__chart-title">Score Distribution</h3>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={reportData.distribution}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#a9d8cb" />
                                                <XAxis dataKey="grade" tick={{ fontWeight: '600'}}/>
                                                <YAxis tick={{ fontWeight: '600'}}/>
                                                <Tooltip 
                                                    cursor={{ fill: '#e0e0e0' }}  
                                                    contentStyle={{ 
                                                        backgroundColor: '#a9d8cb',
                                                        borderRadius: '10px',
                                                        height: '70px',
                                                        fontWeight: '600',
                                                        color: '#56575B',
                                                    }}
                                                />
                                                <Bar dataKey="count" fill="#67A292" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Score Trends Section */}
                                <div className="QuizReportModal__chart-section">
                                    <h3 className="QuizReportModal__chart-title">Score Trends</h3>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={reportData.timeData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#a9d8cb"/>
                                                <XAxis dataKey="date" tick={{ fontWeight: '600'}}/>
                                                <YAxis domain={[0, 100]} tick={{ fontWeight: '600'}}/>
                                                <Tooltip 
                                                    cursor={{ fill: '#e0e0e0' }}  
                                                    contentStyle={{ 
                                                        backgroundColor: '#a9d8cb',
                                                        borderRadius: '10px',
                                                        height: '10px',
                                                        fontWeight: '600',
                                                        color: '#56575B',
                                                    }}
                                                />
                                                <Line type="monotone" dataKey="score" stroke="#67A292" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Question Summary Section */}
                            <div className="pdf-section">
                                <div className="QuizReportModal__question-summary">
                                    <QuestionSummaryWithCharts questionStats={questionStats} />
                                </div>
                            </div>

                            {/* Student Scores Section */}
                            <div className="pdf-section">
                                <div className="QuizReportModal__student-scores">
                                    <h3 className="QuizReportModal__section-title">Student Scores</h3>
                                    <div className="QuizReportModal__student-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th style={{fontSize:'15px', padding:'15px 0 15px 35px'}}>Student Name</th>
                                                    <th style={{fontSize:'15px', padding:'15px'}}>Score</th>
                                                    <th style={{fontSize:'15px', padding:'15px'}}>Points</th>
                                                    <th style={{fontSize:'15px', padding:'15px'}}>Date Taken</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentScores.map((score, index) => (
                                                    <tr key={index}>
                                                        <td>{score.studentName}</td>
                                                        <td>{score.score.toFixed(1)}%</td>
                                                        <td>{score.totalPoints}/{score.maxPoints}</td>
                                                        <td>{score.attemptDate}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};