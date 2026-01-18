import React from "react";

const SimpleHomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          FurniSouq Marketplace
        </h1>
        <p className="text-gray-600 mb-8">
          Website is loading... Check console for errors
        </p>
        <div className="space-x-4">
          <a href="/admin-dashboard" className="bg-red-500 text-white px-6 py-3 rounded-lg">
            Test Admin Panel
          </a>
          <button className="bg-amber-500 text-white px-6 py-3 rounded-lg">
            Test Home Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleHomePage;