import React, {useState} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';

interface FormData {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}

const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setError('');
    };

    // Validate form data before submission
    const validateForm = (): boolean => {
        if (!formData.email || (!isLogin && !formData.username) || !formData.password) {
            setError('Please fill in all fields');
            return false;
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        // Some regex tricks to validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    // Handle form submission (duh)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            let response;

            if (isLogin) {
                response = await axios.post('/api/auth/login', {
                    email: formData.email,
                    password: formData.password
                });
            } else {
                response = await axios.post('/api/auth/register', {
                    email: formData.email,
                    username: formData.username,
                    password: formData.password
                });
            }

            if (response.data.access_token) {
                // Store token in localStorage
                localStorage.setItem('token', response.data.access_token);
                window.dispatchEvent(new Event('auth-change'));
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;

                navigate('/');

                window.dispatchEvent(new Event('login'));

            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-mumundoSnow">


            <div className="flex-grow flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-32">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-mumundoBlackOlive">
                            {isLogin ? 'Sign in to your account' : 'Create a new account'}
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-mumundoBlackOlive focus:outline-none focus:ring-mumundoRed focus:border-mumundoRed focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            {!isLogin && (
                                <div>
                                    <label htmlFor="username" className="sr-only">Username</label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-mumundoBlackOlive focus:outline-none focus:ring-mumundoRed focus:border-mumundoRed focus:z-10 sm:text-sm"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-mumundoBlackOlive focus:outline-none focus:ring-mumundoRed focus:border-mumundoRed focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            {!isLogin && (
                                <div>
                                    <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-mumundoBlackOlive focus:outline-none focus:ring-mumundoRed focus:border-mumundoRed focus:z-10 sm:text-sm"
                                        placeholder="Confirm Password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="text-sm text-red-700">{error}</div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-mumundoRed hover:bg-mumundoRedLight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mumundoRed"
                            >
                                {loading ? (
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                              strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                                ) : null}
                                {isLogin ? 'Sign in' : 'Create account'}
                            </button>
                        </div>

                        <div className="text-sm text-center">

                            <button
                                type="button"
                                onClick={toggleAuthMode}
                                className="font-medium text-mumundoRed hover:text-mumundoRedLight">

                                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;