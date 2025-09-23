import React from 'react';
import { Entity } from '../types';

interface LeftSidebarProps {
  onAddEntity: () => void;
  isCreatingRelationship: boolean;
  onToggleRelationshipMode: () => void;
  relationshipStart: Entity | null;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onAddEntity,
  isCreatingRelationship,
  onToggleRelationshipMode,
  relationshipStart,
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
        <button
          onClick={onToggleRelationshipMode}
          className={`w-full px-3 py-2 rounded ${
            isCreatingRelationship
              ? 'bg-orange-200 text-orange-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {isCreatingRelationship ? 'Cancel Relationship' : '+ Add Relationship'}
        </button>
      </div>

      {isCreatingRelationship && (
        <div className="mt-4 p-2 bg-orange-50 rounded text-sm">
          {relationshipStart
            ? `Click another entity to connect to "${relationshipStart.name}"`
            : 'Click an entity to start the relationship'
          }
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;