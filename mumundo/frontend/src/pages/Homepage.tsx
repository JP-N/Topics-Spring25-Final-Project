import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);


    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {

                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    await axios.get('/api/auth/me');

                    setIsAuthenticated(true);
                } catch (error) {
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                    setIsAuthenticated(false);
                }
            }

            setLoading(false);
        };

        checkAuthStatus();

        const handleLogin = () => setIsAuthenticated(true);
        const handleLogout = () => setIsAuthenticated(false);

        window.addEventListener('login', handleLogin);
        window.addEventListener('logout', handleLogout);

        return () => {
            window.removeEventListener('login', handleLogin);
            window.removeEventListener('logout', handleLogout);
        };
    }, []);

    // Loading spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-mumundoSnow">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mumundoRed"></div>
            </div>
        );
    }

    return (
        <div className="flex-grow bg-mumundoSnow min-h-screen min-w-screen">

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-10 sm:py-16">
                    {/* Header text */}
                    <div className="mx-auto max-w-3xl px-6 lg:max-w-7xl lg:px-8">
                        <p className="mx-auto mt-2 max-w-2xl text-center text-4xl font-semibold tracking-tight text-balance text-mumundoBlackOlive sm:text-5xl">
                            Build playlists with Mumundo and grow your online community.
                        </p>

                        {isAuthenticated && (
                            <div className="mt-8 flex justify-center">
                                <Link
                                    to="/profile"
                                    className="rounded-md bg-mumundoRed px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-mumundoRedLight hover:text-mumundoBlackOlive transition-colors duration-200"
                                >
                                    Connect Your Spotify Account
                                </Link>
                            </div>
                        )}

                        {/* Grid layout to showcase main attraction points */}
                        <div className="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2 drop-shadow-lg">
                            {/* Main section on the left */}
                            <div className="relative col-span-2 lg:row-span-2">
                                <div className="absolute inset-px rounded-lg bg-white lg:rounded-l-[2rem]"></div>
                                <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
                                    <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                                        <p className="mt-2 text-3xl font-semibold tracking-tight text-mumundoRed max-lg:text-center">
                                            Share Your Spotify Playlists
                                        </p>
                                        <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                                            Connect your Spotify account and share your favorite playlists with the Mumundo community. Discover new music through playlists shared by real people.
                                        </p>
                                    </div>

                                    {/* Spotify screenshot below, with a fancy border */}
                                    <div className="@container relative min-h-[30rem] w-full grow max-lg:mx-auto max-lg:max-w-sm">
                                        <div className="absolute inset-x-10 top-10 bottom-0 overflow-hidden rounded-t-[5cqw] border-x-[1cqw] border-t-[1cqw] border-gray-700 bg-gray-900 shadow-2xl">
                                            <img
                                                className="size-full object-cover object-top"
                                                src="https://static1.pocketlintimages.com/wordpress/wp-content/uploads/0-news-how-to-create-a-collaborative-playlist-on-spotify-image2-rqnihp2ufj.jpg"
                                                alt="Spotify playlist interface"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Spotify Integration section */}
                            <div className="relative col-start-3 max-lg:row-start-1">
                                <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]"></div>
                                <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                                    <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                                        <p className="mt-2 text-2xl font-semibold tracking-tight text-mumundoRed max-lg:text-center">
                                            Spotify Integration
                                        </p>
                                        <p className="mt-2 max-w-lg text-sm/6 text-mumundoBlackOlive max-lg:text-center">
                                            Link your Spotify account to Mumundo and choose which playlists to share with the community. Preview tracks directly in the browser.
                                        </p>
                                    </div>

                                    <div className="flex flex-1 items-center justify-center px-8 max-lg:pt-10 max-lg:pb-12 sm:px-10 lg:pb-2">
                                        <img
                                            className="w-full max-lg:max-w-xs"
                                            src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png"
                                            alt="Spotify logo"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Community section */}
                            <div className="relative max-lg:row-start-3 col-start-3 lg:row-start-2">
                                <div className="absolute inset-px rounded-lg bg-white"></div>
                                <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)]">
                                    <div className="px-8 my-auto">
                                        <p className="text-3xl font-semibold tracking-tight text-mumundoRed max-lg:text-center">
                                            Music Community
                                        </p>
                                        <p className="mt-4 max-w-lg text-sm/4s text-mumundoBlackOlive max-lg:text-center">
                                            Discover new music through playlists shared by real people. Connect with others who share your musical taste and expand your listening horizons.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HomePage;