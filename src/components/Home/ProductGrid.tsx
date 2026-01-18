import React from "react";
import { productsData } from "../../data/productsData";

interface ProductGridProps {
  selectedCategory: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ selectedCategory }) => {
  const filteredProducts =
    selectedCategory === "All"
      ? productsData
      : productsData.filter(
          (product) => product.category === selectedCategory
        );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
      {filteredProducts.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-64 object-cover"
          />
          <div className="p-5">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {product.name}
            </h3>
            <p className="text-gray-500">{product.category}</p>
            <p className="text-black font-bold text-lg mt-3">
              ${product.price}
            </p>
            <button className="mt-4 w-full bg-black text-white py-2 rounded-xl hover:bg-gray-800 transition">
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
