import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';

interface Report {
    id: string;
    playlist_id: string;
    playlist_name: string;
    user_id: string;
    username: string;
    reason: string;
    created_at: string;
    status: 'pending' | 'reviewed' | 'dismissed';
}

const AdminDashboard: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }

                const response = await axios.get('/api/user/profile');
                setIsAdmin(response.data.is_admin || false);

                if (response.data.is_admin) {
                    fetchReports();
                }
            } catch (err) {
                console.error('Error checking admin status:', err);
                setError('Failed to verify admin status');
                setIsLoading(false);
            }
        };

        checkAdmin();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await axios.get('/api/admin/reports');
            setReports(response.data);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports');
            setIsLoading(false);
        }
    };

    const handleReportAction = async (reportId: string, action: 'dismiss' | 'delete') => {
        try {
            await axios.post(`/api/admin/reports/${reportId}/${action}`);

            // Update local state
            if (action === 'dismiss') {
                setReports(reports.map(report =>
                    report.id === reportId ? { ...report, status: 'dismissed' } : report
                ));
            } else {
                // If playlist was deleted, mark report as reviewed
                setReports(reports.map(report =>
                    report.id === reportId ? { ...report, status: 'reviewed' } : report
                ));
            }
        } catch (err) {
            console.error(`Error with report action ${action}:`, err);
            setError(`Failed to ${action} report`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Reported Playlists</h2>
                </div>

                {reports.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        No reports
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Playlist
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reported By
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {reports.map(report => (
                                <tr key={report.id} className={report.status !== 'pending' ? 'bg-gray-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a
                                            href={`/playlist/${report.playlist_id}`}
                                            className="text-indigo-600 hover:text-indigo-900"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {report.playlist_name}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a
                                            href={`/profile/${report.user_id}`}
                                            className="text-gray-700 hover:text-indigo-600"
                                        >
                                            {report.username}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                            {report.reason}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'}`}
                      >
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {report.status === 'pending' && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleReportAction(report.id, 'dismiss')}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    Dismiss
                                                </button>
                                                <button
                                                    onClick={() => handleReportAction(report.id, 'delete')}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                        {report.status !== 'pending' && (
                                            <span className="text-gray-500">
                          {report.status === 'reviewed' ? 'Deleted' : 'Dismissed'}
                        </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;