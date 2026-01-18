import React from "react";

const Header = () => {
  return (
    <header className="flex justify-between items-center bg-gray-100 p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <img src="/logo192.png" alt="Logo" className="w-10" />
        <span className="font-bold text-lg">KUWAN</span>
      </div>

      <div className="flex-1 mx-10">
        <input
          type="text"
          placeholder="Search"
          className="w-full border rounded-full px-4 py-2 text-center"
        />
      </div>

      <div className="flex items-center space-x-5">
        <button className="text-gray-700">All</button>
        <button className="text-gray-700">🛒</button>
        <img
          src="https://i.pravatar.cc/40"
          alt="Profile"
          className="w-8 h-8 rounded-full"
        />
      </div>
    </header>
  );
};

export default Header;
