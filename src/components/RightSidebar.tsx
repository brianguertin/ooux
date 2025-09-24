import React, { useRef, useEffect } from 'react';
import { Attribute } from '../types';
import { useModelStore } from '../store/modelStore';

interface RightSidebarProps {
  // Props can now be empty - component will get everything from store
}

const RightSidebar: React.FC<RightSidebarProps> = () => {
  // Refs for auto-focusing new inputs
  const lastAttributeRef = useRef<HTMLInputElement>(null);
  const lastStateRef = useRef<HTMLInputElement>(null);
  const lastActionRef = useRef<HTMLInputElement>(null);
  
  // Get everything directly from the store
  const {
    model,
    selectedEntity,
    relationshipTypes,
    isCreatingRelationship,
    relationshipStart,
    updateEntity,
    deleteEntity,
    updateRelationshipLabel,
    addAttribute,
    addState,
    addAction,
    removeAttribute,
    removeState,
    removeAction,
    updateAttribute,
    updateState,
    updateAction,
    startRelationshipFromEntity,
    cancelRelationship,
  } = useModelStore();
  
  const { entities, relationships } = model;
  // Wrapper functions for store methods that need selectedEntity.id
  const handleAddAttribute = () => {
    if (!selectedEntity) return;
    addAttribute(selectedEntity.id);
    // Focus the new input after a short delay to allow DOM update
    setTimeout(() => lastAttributeRef.current?.focus(), 0);
  };

  const handleAddState = () => {
    if (!selectedEntity) return;
    addState(selectedEntity.id);
    // Focus the new input after a short delay to allow DOM update
    setTimeout(() => lastStateRef.current?.focus(), 0);
  };

  const handleAddAction = () => {
    if (!selectedEntity) return;
    addAction(selectedEntity.id);
    // Focus the new input after a short delay to allow DOM update
    setTimeout(() => lastActionRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'attribute' | 'state' | 'action') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch (type) {
        case 'attribute':
          handleAddAttribute();
          break;
        case 'state':
          handleAddState();
          break;
        case 'action':
          handleAddAction();
          break;
      }
    }
  };

  const handleRemoveAttribute = (index: number) => {
    if (!selectedEntity) return;
    removeAttribute(selectedEntity.id, index);
  };

  const handleRemoveState = (index: number) => {
    if (!selectedEntity) return;
    removeState(selectedEntity.id, index);
  };

  const handleRemoveAction = (index: number) => {
    if (!selectedEntity) return;
    removeAction(selectedEntity.id, index);
  };

  const handleUpdateAttribute = (index: number, field: keyof Attribute, value: string) => {
    if (!selectedEntity) return;
    updateAttribute(selectedEntity.id, index, field, value);
  };

  const handleUpdateState = (index: number, value: string) => {
    if (!selectedEntity) return;
    updateState(selectedEntity.id, index, value);
  };

  const handleUpdateAction = (index: number, value: string) => {
    if (!selectedEntity) return;
    updateAction(selectedEntity.id, index, value);
  };

  // Get relationships for an entity
  const getEntityRelationships = (entityId: string) => {
    return {
      outgoing: relationships.filter(r => r.from === entityId),
      incoming: relationships.filter(r => r.to === entityId)
    };
  };

  if (!selectedEntity) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <div className="text-gray-500 text-sm">
          Select an entity to edit its properties
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div>
        <h3 className="font-semibold mb-4">Properties</h3>

        {/* Entity Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name:</label>
          <input
            type="text"
            value={selectedEntity.name}
            onChange={(e) => updateEntity(selectedEntity.id, { name: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        {/* Attributes */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Attributes:</label>
          {(selectedEntity.attributes || []).map((attr: Attribute, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                ref={i === (selectedEntity.attributes || []).length - 1 ? lastAttributeRef : undefined}
                type="text"
                value={attr.name || ''}
                onChange={(e) => handleUpdateAttribute(i, 'name', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'attribute')}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="attribute name"
              />
              <select
                value={attr.type || 'string'}
                onChange={(e) => handleUpdateAttribute(i, 'type', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="date">date</option>
                <option value="enum">enum</option>
              </select>
              <button
                onClick={() => handleRemoveAttribute(i)}
                className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={handleAddAttribute}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Attribute
          </button>
        </div>

        {/* States */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">States:</label>
          {(selectedEntity.states || []).map((state: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                ref={i === (selectedEntity.states || []).length - 1 ? lastStateRef : undefined}
                type="text"
                value={state || ''}
                onChange={(e) => handleUpdateState(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'state')}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="state name"
              />
              <button
                onClick={() => handleRemoveState(i)}
                className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={handleAddState}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add State
          </button>
        </div>

        {/* Actions */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Actions:</label>
          {(selectedEntity.actions || []).map((action: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                ref={i === (selectedEntity.actions || []).length - 1 ? lastActionRef : undefined}
                type="text"
                value={action || ''}
                onChange={(e) => handleUpdateAction(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'action')}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="action name"
              />
              <button
                onClick={() => handleRemoveAction(i)}
                className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={handleAddAction}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Action
          </button>
        </div>

        <button
          onClick={() => deleteEntity(selectedEntity.id)}
          className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 mt-4"
        >
          Delete Entity
        </button>

        {/* Relationships */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm">Relationships:</h4>
            {isCreatingRelationship && relationshipStart?.id === selectedEntity.id ? (
              <button
                onClick={cancelRelationship}
                className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => startRelationshipFromEntity(selectedEntity)}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
              >
                + Add
              </button>
            )}
          </div>

          {/* Relationship creation instruction */}
          {isCreatingRelationship && relationshipStart?.id === selectedEntity.id && (
            <div className="mb-3 p-2 bg-orange-50 rounded text-xs text-orange-800">
              Click another entity to create a relationship from "{selectedEntity.name}"
            </div>
          )}

          {(() => {
            const rels = getEntityRelationships(selectedEntity.id);
            const hasRelationships = rels.outgoing.length > 0 || rels.incoming.length > 0;

            if (!hasRelationships) {
              return <div className="text-xs text-gray-500">No relationships</div>;
            }

            return (
              <div className="space-y-2">
                {rels.outgoing.map(rel => {
                  const targetEntity = entities.find(e => e.id === rel.to);
                  const displayLabel = rel.label === 'belongs to' ? 'contains' : rel.label;
                  const dropdownValue = rel.label === 'belongs to' ? 'contains' : rel.label;
                  return (
                    <div key={rel.id} className="text-xs bg-blue-50 p-2 rounded">
                      <div className="font-medium text-blue-800">
                        → {targetEntity?.name || 'Unknown'}
                      </div>
                      <select
                        value={dropdownValue}
                        onChange={(e) => {
                          // If we're showing the flipped perspective, flip the value back
                          const actualValue = rel.label === 'belongs to' && e.target.value === 'belongs to' ? 'contains' :
                                             rel.label === 'belongs to' && e.target.value === 'contains' ? 'belongs to' :
                                             e.target.value;
                          updateRelationshipLabel(rel.id, actualValue);
                        }}
                        className="w-full mt-1 px-1 py-0.5 border border-blue-200 rounded text-xs"
                      >
                        {relationshipTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500 mt-1">
                        This entity {displayLabel} {targetEntity?.name}
                      </div>
                    </div>
                  );
                })}
                {rels.incoming.map(rel => {
                  const sourceEntity = entities.find(e => e.id === rel.from);
                  const displayLabel = rel.label === 'contains' ? 'belongs to' : rel.label;
                  const dropdownValue = rel.label === 'contains' ? 'belongs to' : rel.label;
                  return (
                    <div key={rel.id} className="text-xs bg-green-50 p-2 rounded">
                      <div className="font-medium text-green-800">
                        ← {sourceEntity?.name || 'Unknown'}
                      </div>
                      <select
                        value={dropdownValue}
                        onChange={(e) => {
                          // If we're showing the flipped perspective, flip the value back
                          const actualValue = rel.label === 'contains' && e.target.value === 'contains' ? 'belongs to' :
                                             rel.label === 'contains' && e.target.value === 'belongs to' ? 'contains' :
                                             e.target.value;
                          updateRelationshipLabel(rel.id, actualValue);
                        }}
                        className="w-full mt-1 px-1 py-0.5 border border-green-200 rounded text-xs"
                      >
                        {relationshipTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500 mt-1">
                        This entity {displayLabel} {sourceEntity?.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;