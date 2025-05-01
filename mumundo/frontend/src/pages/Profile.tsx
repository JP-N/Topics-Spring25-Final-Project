import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SpotifySection from '../components/SpotifySection';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Load user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Ensure auth token is set
                const token = localStorage.getItem('token');
                console.log('token', token);
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }


                const response = await axios.get('/api/user/profile');
                setUser(response.data);
                setUsername(response.data.username);
                setIsLoading(false);
            } catch (err) {
                window.dispatchEvent(new Event('logout'));
                navigate('/login');
                console.error('Error loading profile:', err);
                setError('Failed to load profile data');
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicture(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            const formData = new FormData();
            formData.append('username', username);
            if (profilePicture) {
                formData.append('profile_picture', profilePicture);
            }

            await axios.patch('/api/user/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const response = await axios.get('/api/user/profile');
            setUser(response.data);

            setIsEditing(false);
            setIsLoading(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile');
            setIsLoading(false);
        }
    };

    if (isLoading && !user) {
        return <div className="container mx-auto p-4">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">
                {isEditing ? 'Edit Profile' : 'Your Profile'}
            </h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {!isEditing ? (
                // View mode
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden">
                            <img
                                src={user?.profile_picture === 'default.jpg' ? '/default-profile.jpg' : `/uploads/${user?.profile_picture}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">{user?.username}</h2>
                            <p className="text-gray-600">{user?.email}</p>
                        </div>

                        <button
                            onClick={() => setIsEditing(true)}
                            className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            ) : (

                <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Profile Picture</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <img
                                        src={user?.profile_picture === 'default.jpg' ? '/default-profile.jpg' : `/uploads/${user?.profile_picture}`}
                                        alt="Current"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            <input
                                type="file"
                                id="profile-picture"
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <label
                                htmlFor="profile-picture"
                                className="px-3 py-1 border rounded cursor-pointer hover:bg-gray-50"
                            >
                                Choose File
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            <SpotifySection />
        </div>
    );
};

export default Profile;