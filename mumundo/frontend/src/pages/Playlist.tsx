import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface TrackInfo {
    id: string;
    name: string;
    artists: string[];
    album: string;
    duration_ms: number;
    image_url?: string;
}

interface PlaylistDetailData {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    trackCount: number;
    tracks: TrackInfo[];
    user: {
        id: string;
        username: string;
        profilePicture: string;
    };
    total_time: string;
    is_public: boolean;
    created_at?: string;
    likes: number;
    dislikes: number;
}

const PlaylistDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState<PlaylistDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [rating, setRating] = useState<'like' | 'dislike' | null>(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');

    useEffect(() => {
        const fetchPlaylistDetails = async () => {
            try {
                setIsLoading(true);

                const token = localStorage.getItem('token');
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }

                // Get playlist details
                const playlistResponse = await axios.get(`/api/playlists/${id}`);
                setPlaylist(playlistResponse.data);

                const userResponse = await axios.get('/api/user/profile');
                setIsCurrentUser(userResponse.data.id === playlistResponse.data.user.id);
                setIsAdmin(userResponse.data.is_admin || false);

                const ratingsResponse = await axios.get(`/api/playlists/${id}/ratings`);
                if (ratingsResponse.data.user_rating) {
                    setRating(ratingsResponse.data.user_rating);
                }

                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching playlist:', err);
                setError('Failed to load playlist details');
                setIsLoading(false);
            }
        };

        if (id) {
            fetchPlaylistDetails();
        }
    }, [id]);

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
            return;
        }

        try {
            await axios.delete(`/api/playlists/${id}`);
            navigate('/playlists');
        } catch (err) {
            console.error('Error deleting playlist:', err);
            setError('Failed to delete playlist');
        }
    };

    const handleRating = async (type: 'like' | 'dislike') => {
        try {
            if (rating === type) {
                await axios.delete(`/api/playlists/${id}/ratings`);
                setRating(null);

                if (playlist) {
                    setPlaylist({
                        ...playlist,
                        likes: type === 'like' ? playlist.likes - 1 : playlist.likes,
                        dislikes: type === 'dislike' ? playlist.dislikes - 1 : playlist.dislikes
                    });
                }
            } else {
                // Add or change rating
                await axios.post(`/api/playlists/${id}/ratings`, { type });
                setRating(type);

                // Update counts locally
                if (playlist) {
                    setPlaylist({
                        ...playlist,
                        likes: type === 'like'
                            ? playlist.likes + 1
                            : (rating === 'like' ? playlist.likes - 1 : playlist.likes),
                        dislikes: type === 'dislike'
                            ? playlist.dislikes + 1
                            : (rating === 'dislike' ? playlist.dislikes - 1 : playlist.dislikes)
                    });
                }
            }
        } catch (err) {
            console.error('Error rating playlist:', err);
            setError('Failed to rate playlist');
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) {
            alert('Please provide a reason for the report');
            return;
        }

        try {
            await axios.post(`/api/playlists/${id}/report`, { reason: reportReason });
            setReportModalOpen(false);
            setReportReason('');
            alert('Thank you for your report');
        } catch (err) {
            console.error('Error reporting playlist:', err);
            setError('Failed to submit report');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !playlist) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error || 'Playlist not found'}
                </div>
                <a href="/playlists" className="text-indigo-600 hover:text-indigo-800">
                    Back to playlists
                </a>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64 flex-shrink-0 mb-4 md:mb-0">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {playlist.imageUrl ? (
                            <img
                                src={playlist.imageUrl}
                                alt={playlist.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Rating and Actions */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <button
                                    onClick={() => handleRating('like')}
                                    className={`mr-2 p-2 rounded-full ${rating === 'like' ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                                    </svg>
                                </button>
                                <span>{playlist.likes}</span>
                            </div>

                            <div className="flex items-center">
                                <span>{playlist.dislikes}</span>
                                <button
                                    onClick={() => handleRating('dislike')}
                                    className={`ml-2 p-2 rounded-full ${rating === 'dislike' ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <a href="/playlists" className="block text-center py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50">
                                Back to playlists
                            </a>

                            {(isCurrentUser || isAdmin) && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete Playlist
                                </button>
                            )}

                            {!isCurrentUser && (
                                <button
                                    onClick={() => setReportModalOpen(true)}
                                    className="w-full py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                >
                                    Report Playlist
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-grow">
                    <h1 className="text-3xl font-bold mb-2">{playlist.name}</h1>

                    {playlist.description && (
                        <p className="text-gray-600 mb-4">{playlist.description}</p>
                    )}

                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2">
                            <img
                                src={playlist.user.profilePicture || `/api/user/profile-picture/${playlist.user.id}`}
                                alt={playlist.user.username}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <a
                            href={`/profile/${playlist.user.id}`}
                            className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                        >
                            {playlist.user.username}
                        </a>
                    </div>

                    <div className="text-sm text-gray-500 mb-4">
                        <span className="mr-3">{playlist.trackCount} tracks</span>
                        <span className="mr-3">{playlist.total_time}</span>
                        {playlist.is_public ? (
                            <span className="text-green-600">Public</span>
                        ) : (
                            <span className="text-gray-500">Private</span>
                        )}
                    </div>

                    {/* Tracks */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Album
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {playlist.tracks.map((track, index) => (
                                <tr key={track.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {track.image_url && (
                                                <div className="flex-shrink-0 h-10 w-10 mr-3">
                                                    <img className="h-10 w-10" src={track.image_url} alt="" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{track.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {Array.isArray(track.artists) ? track.artists.join(', ') : track.artists}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {track.album}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDuration(track.duration_ms)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Report */}
            {reportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Report Playlist</h3>
                        <p className="mb-4 text-gray-600">
                            Please explain why you're reporting this
                        </p>

                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Reason for report..."
                            className="w-full p-2 border rounded mb-4 h-32"
                            required
                        />

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setReportModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaylistDetail;