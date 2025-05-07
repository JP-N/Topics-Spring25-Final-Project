import React, {useEffect, useState} from 'react';
import axios from 'axios';

interface Playlist {
    id: string;
    name: string;
    imageUrl: string;
    trackCount: number;
    isPublic: boolean;
}

const UserPlaylistsSection: React.FC = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');


    useEffect(() => {
        fetchUserPlaylists();
    }, []);

    const fetchUserPlaylists = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.get('/api/playlists/user');
            setPlaylists(response.data);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching user playlists:', err);
            setError('Failed to load your playlists');
            setIsLoading(false);
        }
    };

    const togglePublicStatus = async (playlistId: string, currentStatus: boolean) => {
        try {
            await axios.patch(`/api/playlists/${playlistId}/visibility`, {
                isPublic: !currentStatus
            });

            // Update local state
            setPlaylists(playlists.map(playlist =>
                playlist.id === playlistId
                    ? {...playlist, isPublic: !currentStatus}
                    : playlist
            ));
        } catch (err) {
            console.error('Error updating playlist visibility:', err);
            setError('Failed to update playlist visibility');
        }
    };

    if (isLoading && playlists.length === 0) {
        return (
            <div className="bg-white shadow rounded-lg p-6 mt-6">
                <h2 className="text-xl font-bold mb-4">Your Playlists</h2>
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Your Playlists</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {playlists.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                    You haven't imported any playlists yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map(playlist => (
                        <div key={playlist.id} className="border rounded-lg overflow-hidden shadow-sm">
                            <div className="aspect-square bg-gray-100 relative">
                                {playlist.imageUrl ? (
                                    <img
                                        src={playlist.imageUrl}
                                        alt={playlist.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                                        <svg className="w-16 h-16 text-gray-300" fill="currentColor"
                                             viewBox="0 0 24 24">
                                            <path
                                                d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                  <span
                      className={`px-2 py-1 text-xs rounded-full ${playlist.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {playlist.isPublic ? 'Public' : 'Private'}
                  </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-semibold truncate">{playlist.name}</h3>
                                <p className="text-sm text-gray-500 mb-3">{playlist.trackCount} tracks</p>

                                <div className="flex justify-between">
                                    <a
                                        href={`/playlist/${playlist.id}`}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                                    >
                                        View playlist
                                    </a>

                                    <button
                                        onClick={() => togglePublicStatus(playlist.id, playlist.isPublic)}
                                        className={`text-sm px-3 py-1 rounded ${
                                            playlist.isPublic
                                                ? 'text-red-600 hover:text-red-800'
                                                : 'text-green-600 hover:text-green-800'
                                        }`}
                                    >
                                        {playlist.isPublic ? 'Make Private' : 'Make Public'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserPlaylistsSection;