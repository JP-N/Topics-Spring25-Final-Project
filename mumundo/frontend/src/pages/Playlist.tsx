import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface Track {
    id: string;
    name: string;
    artists: string[];
    album: string;
    duration_ms: number;
    preview_url: string | null;
}

interface Playlist {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    trackCount: number;
    tracks: Track[];
    user: {
        id: string;
        username: string;
        profilePicture: string;
    };
}

const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const PlaylistDetail: React.FC = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentTrack, setCurrentTrack] = useState<string | null>(null);
    const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`/api/playlists/${playlistId}`);
                setPlaylist(response.data);
                setIsLoading(false);
            } catch (err) {
                setError('Failed to load playlist');
                setIsLoading(false);
            }
        };

        fetchPlaylist();
    }, [playlistId]);

    // Audio playback
    const playPreview = (trackId: string, previewUrl: string | null) => {
        if (!previewUrl) return;

        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.src = '';
        }

        if (currentTrack === trackId) {

            setCurrentTrack(null);
        } else {

            const audio = new Audio(previewUrl);
            audio.play();
            setAudioPlayer(audio);
            setCurrentTrack(trackId);

            audio.onended = () => {
                setCurrentTrack(null);
            };
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
                <Link to="/playlists" className="text-indigo-600 hover:text-indigo-800">
                    ← Back to playlists
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Link to="/playlists" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
                ← Back to playlists
            </Link>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Playlist cover and info */}
                <div className="w-full md:w-1/3 lg:w-1/4">
                    <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square mb-4">
                        {playlist.imageUrl ? (
                            <img
                                src={playlist.imageUrl}
                                alt={playlist.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold mb-2">{playlist.name}</h1>
                    {playlist.description && (
                        <p className="text-gray-600 mb-3">{playlist.description}</p>
                    )}

                    <div className="flex items-center space-x-2 mb-4">
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

                    <p className="text-sm text-gray-500">{playlist.trackCount} tracks</p>
                </div>

                {/* Tracks list */}
                <div className="w-full md:w-2/3 lg:w-3/4">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="grid grid-cols-12 text-sm font-medium text-gray-500 border-b px-4 py-2">
                            <div className="col-span-1">#</div>
                            <div className="col-span-5">Title</div>
                            <div className="col-span-4">Album</div>
                            <div className="col-span-2 text-right">Duration</div>
                        </div>

                        <div className="divide-y">
                            {playlist.tracks.map((track, index) => (
                                <div
                                    key={track.id}
                                    className="grid grid-cols-12 px-4 py-3 hover:bg-gray-50 transition items-center text-sm"
                                >
                                    <div className="col-span-1 text-gray-500">{index + 1}</div>
                                    <div className="col-span-5">
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => playPreview(track.id, track.preview_url)}
                                                className={`mr-3 w-8 h-8 flex items-center justify-center rounded-full ${track.preview_url ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}
                                                disabled={!track.preview_url}
                                            >
                                                {currentTrack === track.id ? (
                                                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                            <div>
                                                <div className="font-medium">{track.name}</div>
                                                <div className="text-gray-500 text-xs">{track.artists.join(', ')}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-4 truncate">{track.album}</div>
                                    <div className="col-span-2 text-right text-gray-500">{formatDuration(track.duration_ms)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaylistDetail;