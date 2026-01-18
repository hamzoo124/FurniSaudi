import React from 'react';
import { BsClock } from 'react-icons/bs';

const SellerPendingApproval: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
        <BsClock className="text-yellow-500 text-6xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Registration Under Review</h2>
        <p className="text-gray-600 mb-6">
          Your seller application is being reviewed by our admin team. 
          You'll receive a notification once approved.
        </p>
        <div className="animate-pulse text-yellow-500">
          Waiting for approval...
        </div>
      </div>
    </div>
  );
};

export default SellerPendingApproval;