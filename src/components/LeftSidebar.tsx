import React from 'react';
import { Entity } from '../types';

interface LeftSidebarProps {
  onAddEntity: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onAddEntity,
}) => {
  return (
    <div className="w-48 bg-white border-r border-gray-200 p-4">
      <h3 className="font-semibold mb-4">Tools</h3>
      <div className="space-y-2">
        <button
          onClick={onAddEntity}
          className="w-full px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
        >
          + Add Entity
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;