import React from "react";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, productId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Product Details</h2>
        <p>Product ID: {productId}</p>
        <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Close
        </button>
      </div>
    </div>
  );
};

export default ProductDetailModal;
