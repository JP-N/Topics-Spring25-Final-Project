import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SpotifyPlaylist {
    id: string;
    name: string;
    images: { url: string }[];
    tracks: { total: number };
}

const SpotifySection: React.FC = () => {
    const [spotifyLinked, setSpotifyLinked] = useState(false);
    const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
    const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const checkSpotifyStatus = async () => {
            try {
                // Verify token is set in axios defaults
                const token = localStorage.getItem('token');
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }

                const response = await axios.get('/api/spotify/status');
                setSpotifyLinked(response.data.linked);

                if (response.data.linked) {
                    // Load playlists
                    const playlistsResponse = await axios.get('/api/spotify/playlists');
                    setSpotifyPlaylists(playlistsResponse.data);

                    // Get selected playlists
                    const selectedResponse = await axios.get('/api/spotify/selected-playlists');
                    setSelectedPlaylists(selectedResponse.data || []);
                }

                setIsLoading(false);
            } catch (err) {
                console.error('Error checking Spotify status:', err);
                setError('Failed to load Spotify data');
                setIsLoading(false);
            }
        };

        checkSpotifyStatus();
    }, []);

    const togglePlaylistSelection = (playlistId: string) => {
        setSelectedPlaylists(prev => {
            if (prev.includes(playlistId)) {
                return prev.filter(id => id !== playlistId);
            } else {
                return [...prev, playlistId];
            }
        });
    };

    const saveSelectedPlaylists = async () => {
        try {
            setIsLoading(true);

            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            await axios.post('/api/spotify/selected-playlists', {
                playlistIds: selectedPlaylists
            });

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            setIsLoading(false);
        } catch (err) {
            console.error('Error saving playlists:', err);
            setError('Failed to save playlist selection');
            setIsLoading(false);
        }
    };

    const handleLinkSpotify = () => {
        window.location.href = '/api/spotify/auth';
    };

    if (isLoading) {
        return <div className="mt-6 p-4">Loading Spotify data...</div>;
    }

    return (
        <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Spotify Integration</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {saveSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Playlist selection saved successfully!
                </div>
            )}

            {!spotifyLinked ? (
                <button
                    type="button"
                    onClick={handleLinkSpotify}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Link Spotify Account
                </button>
            ) : (
                <div>
                    <p className="text-green-600 mb-4">✓ Spotify account linked</p>

                    <h3 className="text-lg font-medium mb-2">Select playlists to display publicly:</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {spotifyPlaylists.map(playlist => (
                            <div
                                key={playlist.id}
                                onClick={() => togglePlaylistSelection(playlist.id)}
                                className={`border rounded-md p-4 flex space-x-3 cursor-pointer transition ${
                                    selectedPlaylists.includes(playlist.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex-shrink-0 w-12 h-12">
                                    {playlist.images && playlist.images[0] ? (
                                        <img
                                            src={playlist.images[0].url}
                                            alt={playlist.name}
                                            className="w-full h-full object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                            <span className="text-xs text-gray-500">No image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{playlist.name}</p>
                                    <p className="text-xs text-gray-500">{playlist.tracks.total} tracks</p>
                                </div>
                                {selectedPlaylists.includes(playlist.id) && (
                                    <div className="flex-shrink-0 text-green-500">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={saveSelectedPlaylists}
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                    >
                        {isLoading ? 'Saving...' : 'Save Playlist Selection'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SpotifySection;