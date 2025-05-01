import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface PlaylistDisplay {
    id: string;
    name: string;
    imageUrl: string;
    trackCount: number;
    user: {
        id: string;
        username: string;
        profilePicture: string;
    };
}

const PublicPlaylists: React.FC = () => {
    const [playlists, setPlaylists] = useState<PlaylistDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('spotify') && params.get('spotify') === 'success') {
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Load all public playlists
    useEffect(() => {
        const fetchPublicPlaylists = async () => {
            try {
                setIsLoading(true);

                // Check auth
                const token = localStorage.getItem('token');
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }

                const response = await axios.get('/api/playlists/public');
                setPlaylists(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching playlists:', err);
                setError('Failed to load public playlists');
                setIsLoading(false);
            }
        };

        fetchPublicPlaylists();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Public Playlists</h1>

            {playlists.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No public playlists available yet.</p>
                    <Link to="/profile" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
                        Add your playlists
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists.map(playlist => (
                        <div key={playlist.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                            <div className="relative pb-[56.25%] bg-gray-100">
                                {playlist.imageUrl ? (
                                    <img
                                        src={playlist.imageUrl}
                                        alt={playlist.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h2 className="text-lg font-semibold truncate">{playlist.name}</h2>
                                <p className="text-sm text-gray-500 mb-3">{playlist.trackCount} tracks</p>

                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                        <img
                                            src={playlist.user.profilePicture === 'default.jpg' ? '/default-profile.jpg' : `/uploads/${playlist.user.profilePicture}`}
                                            alt={playlist.user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <Link
                                        to={`/profile/${playlist.user.id}`}
                                        className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
                                    >
                                        {playlist.user.username}
                                    </Link>
                                </div>

                                <Link
                                    to={`/playlist/${playlist.id}`}
                                    className="mt-3 inline-block text-indigo-600 hover:text-indigo-800 text-sm"
                                >
                                    View playlist →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PublicPlaylists;