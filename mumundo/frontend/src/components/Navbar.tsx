import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLogo from '../assets/mumundosvgSVG.svg';
import axios from 'axios';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('token') !== null;

    // Login handler
    const handleLogin = () => {
        navigate('/login');
    };

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        window.dispatchEvent(new Event('logout'));
        navigate('/');
    };

    return (
        <nav className="bg-mumundoRedLight font-medium drop-shadow-xl text-2xl text-mumundoBlackOlive">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo section */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center justify-center h-14">
                            <img className="h-full w-auto" src={MainLogo} alt="Mumundo Logo" />
                        </Link>
                    </div>

                    {/* Navigation Links - Only show if authenticated */}
                    {isAuthenticated && (
                        <div className="hidden md:flex items-center space-x-8">
                            <Link
                                to="/playlists"
                                className="px-3 py-2 text-mumundoBlackOlive hover:text-mumundoRed transition-colors"
                            >
                                Shared Playlists
                            </Link>
                            <Link
                                to="/profile"
                                className="px-3 py-2 text-mumundoBlackOlive hover:text-mumundoRed transition-colors"
                            >
                                Profile
                            </Link>
                        </div>
                    )}

                    {/* Login section */}
                    <div>
                        {isAuthenticated ? (
                            <>
                                <button onClick={handleLogout} className="px-4 py-2 font-semibold">
                                    Sign out
                                </button>
                                <span className="block max-w-full h-1 bg-mumundoRed"></span>
                            </>
                        ) : (
                            <>
                                <button onClick={handleLogin} className="px-4 py-2 font-semibold">
                                    Sign in
                                </button>
                                <span className="block max-w-full h-1 bg-mumundoRed"></span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu - Show only if authenticated */}
            {isAuthenticated && (
                <div className="md:hidden border-t border-mumundoRed">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex justify-center">
                        <Link
                            to="/playlists"
                            className="px-3 py-2 text-mumundoBlackOlive hover:text-mumundoRed transition-colors"
                        >
                            Shared Playlists
                        </Link>
                        <Link
                            to="/profile"
                            className="px-3 py-2 text-mumundoBlackOlive hover:text-mumundoRed transition-colors"
                        >
                            Profile
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;