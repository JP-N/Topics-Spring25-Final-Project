import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Homepage';
import AuthPage from './components/AuthPage';
import SharedPlaylists from './pages/SharedPlaylists';
import Profile from './pages/Profile';
import Playlist from './pages/Playlist';
import Navbar from './components/Navbar';


const useAuth = () => {
    const isAuthenticated = localStorage.getItem('token') !== null;
    console.log('attempting to get auth status');
    return { isAuthenticated };
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <Router>
            <Navbar />

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/playlists" element={<SharedPlaylists />} />
                <Route path="/playlist/:playlistId" element={<Playlist />} />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </Router>
    );
};

export default App;