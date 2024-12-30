import React, { useState, useRef, useEffect } from 'react';
import { LuCalendar } from "react-icons/lu";
import 'assets/css/components';

export default function CustomDatePicker ({ selectedDate, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const datePickerRef = useRef(null);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

  
    const handleDateSelect = (day) => {
        const selected = new Date(year, month, day);
        const offset = selected.getTimezoneOffset();
        selected.setMinutes(selected.getMinutes() - offset);
        onChange(selected.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    const isSelectedDate = (day) => {
        if (!selectedDate) return false;
        const currentDate = new Date(year, month, day);
        const selected = new Date(selectedDate);
        return currentDate.toDateString() === selected.toDateString();
    };


    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(month, year);
        const firstDay = getFirstDayOfMonth(month, year);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="QuizzesTeacher__calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(
                <div
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={`QuizzesTeacher__calendar-day ${isSelectedDate(day) ? 'selected' : ''}`}
                >
                    {day}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="QuizzesTeacher__date-picker" ref={datePickerRef}>
            <div
                className="QuizzesTeacher__date-input"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select date'}
                <LuCalendar className="QuizzesTeacher__calendar-icon" />
            </div>

            {isOpen && (
                <div className="QuizzesTeacher__calendar-dropdown">
                    <div className="QuizzesTeacher__calendar-header">
                        <button onClick={() => setMonth(prev => (prev === 0 ? 11 : prev - 1))}>
                            &lt;
                        </button>
                        <div className="QuizzesTeacher__calendar-month-year">
                            <select 
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="QuizzesTeacher__calendar-select"
                            >
                                {months.map((m, i) => (
                                    <option key={m} value={i}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="QuizzesTeacher__calendar-select"
                            >
                                {Array.from({ length: 10 }, (_, i) => year - 5 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={() => setMonth(prev => (prev === 11 ? 0 : prev + 1))}>
                            &gt;
                        </button>
                    </div>
                    <div className="QuizzesTeacher__calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day}>{day}</div>
                        ))}
                    </div>
                    <div className="QuizzesTeacher__calendar-days">
                        {renderCalendar()}
                    </div>
                </div>
            )}
        </div>
    );
};

