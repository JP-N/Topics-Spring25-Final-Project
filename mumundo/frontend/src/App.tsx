import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import HomePage from './pages/Homepage';
import AuthPage from './components/AuthPage';
import SharedPlaylists from './pages/SharedPlaylists';
import Profile from './pages/Profile';
import Playlist from './pages/Playlist';
import Navbar from './components/Navbar';

import AdminBanner from "./components/AdminBanner.tsx";
import AdminDashboard from "./pages/AdminDashboard";
import axios from 'axios';

const useAuth = () => {
    const isAuthenticated = localStorage.getItem('token') !== null;
    console.log('attempting to get auth status');
    return {isAuthenticated};
};

const ProtectedRoute = ({children}: { children: React.ReactNode }) => {
    const {isAuthenticated} = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    return <>{children}</>;
};

const App: React.FC = () => {

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    const response = await axios.get('/api/user/profile');
                    setIsAdmin(response.data.is_admin || false);
                } else {
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error('Error checking admin status:', err);
                setIsAdmin(false);
            }
        };

        checkAdminStatus();

        window.addEventListener('storage', (e) => {
            if (e.key === 'token') {
                checkAdminStatus();
            }
        });

        window.addEventListener('auth-change', checkAdminStatus);

        return () => {
            window.removeEventListener('storage', checkAdminStatus);
            window.removeEventListener('auth-change', checkAdminStatus);
        };
    }, []);

    return (
        <Router>
            <AdminBanner isAdmin={isAdmin}/>
            <Navbar/>

            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/login" element={<AuthPage/>}/>
                <Route path="/playlists" element={<SharedPlaylists/>}/>
                <Route path="/playlist/:id" element={<Playlist/>}/>
                <Route path="/admin" element={<AdminDashboard/>}/>
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile/>
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </Router>
    );
};

export default App;