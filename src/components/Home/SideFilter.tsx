import React from "react";

interface SidebarFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const categories = ["All", "Living Room", "Bedroom", "Dining", "Outdoor"];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full md:w-64">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">
        Categories
      </h2>
      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category}>
            <button
              onClick={() => onCategoryChange(category)}
              className={`w-full text-left py-2 px-4 rounded-xl transition-all ${
                selectedCategory === category
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarFilters;
