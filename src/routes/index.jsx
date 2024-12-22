import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import {SignIn, SignUp} from 'pages/auth';
import { StudentLayout, TeacherLayout } from 'layouts/main_layouts';

import { HomeStudent } from 'pages/student/home';
import { ProfileStudent } from 'pages/student/account';

import { HomeTeacher } from 'pages/teacher/home';
import { ProfileTeacher } from 'pages/teacher/account';

const MainRoutes = () =>{

    return(
        <Router>
            <Routes>
                <Route path="/sign-in" element={<SignIn />} /> 
                <Route path="/sign-up" element={<SignUp />} /> 

                <Route path="/student" element={
                    <PrivateRoute allowedRoles={['student']}>
                      <StudentLayout/>
                    </PrivateRoute>
                }>
                    <Route path="home" element={<HomeStudent />} /> 
                    <Route path="settings" element={<ProfileStudent />} />
                </Route>

                <Route path="/teacher" element={
                    <PrivateRoute allowedRoles={['teacher']}>
                      <TeacherLayout />
                    </PrivateRoute>
                }>
                    <Route path="home" element={<HomeTeacher />} /> 
                    <Route path="settings" element={<ProfileTeacher />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default MainRoutes;