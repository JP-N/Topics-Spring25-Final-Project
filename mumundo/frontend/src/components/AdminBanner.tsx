import React from 'react';

interface AdminBannerProps {
    isAdmin: boolean;
}

const AdminBanner: React.FC<AdminBannerProps> = ({isAdmin}) => {
    if (!isAdmin) return null;

    return (
        <div className="bg-red-600 text-white px-4 py-2 text-center font-semibold">
            Administrator Mode
        </div>
    );
};

export default AdminBanner;