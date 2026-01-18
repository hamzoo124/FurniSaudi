import React from "react";

const SideFilter = () => {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="font-semibold text-lg mb-3">Type & Location Product</h3>

      <div className="space-y-3 text-sm">
        <label className="block">
          <input type="checkbox" className="mr-2" /> Kitchen
        </label>
        <label className="block">
          <input type="checkbox" className="mr-2" /> Sofa
        </label>
        <label className="block">
          <input type="checkbox" className="mr-2" /> Tables
        </label>
        <label className="block">
          <input type="checkbox" className="mr-2" /> Curtains
        </label>
      </div>
    </div>
  );
};

export default SideFilter;
