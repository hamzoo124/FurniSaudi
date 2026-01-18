import React from 'react';

interface OrderDetailsProps {
  orderId: string;
  onNavigate: (page: string) => void;
  onBack: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onNavigate, onBack }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order Details #{orderId}</h1>
        <button 
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>Order details for order ID: {orderId}</p>
      </div>
    </div>
  );
};

export default OrderDetails;