import React from 'react';

interface EditProductProps {
  productId: string;
  onNavigate: (page: string) => void;
  onSuccess: () => void;
}

const EditProduct: React.FC<EditProductProps> = ({ productId, onNavigate, onSuccess }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Product #{productId}</h1>
        <button 
          onClick={onSuccess}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Save Changes
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>Edit product form for product ID: {productId}</p>
        <button 
          onClick={() => onNavigate('seller-dashboard')}
          className="mt-4 px-4 py-2 border border-gray-300 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default EditProduct;