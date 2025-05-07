import React, { useState } from 'react';
import axios from 'axios';

const SpotifySection: React.FC = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleImportPlaylist = async () => {
        if (!playlistUrl || !playlistUrl.includes('spotify.com/playlist/')) {
            setErrorMessage('Please enter a valid Spotify playlist URL');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post('/api/playlists/import-spotify', {
                playlistUrl,
                isPublic
            });

            setSuccessMessage(`Successfully imported "${response.data.title}" with ${response.data.track_count} tracks`);
            setPlaylistUrl('');
        } catch (err) {
            console.error('Error importing playlist:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Import Spotify Playlist</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Spotify Playlist URL</label>
                <input
                    type="text"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="w-full p-2 border rounded"
                    disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Paste the full Spotify playlist URL</p>
            </div>

            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                    className="mr-2"
                    disabled={isLoading}
                />
                <label htmlFor="isPublic" className="text-sm">Make this playlist public</label>
            </div>

            <button
                onClick={handleImportPlaylist}
                disabled={isLoading || !playlistUrl}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
                    isLoading || !playlistUrl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                }`}
            >
                {isLoading ? 'Importing...' : 'Import Playlist'}
            </button>

            {errorMessage && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {successMessage}
                </div>
            )}
        </div>
    );
};

export default SpotifySection;