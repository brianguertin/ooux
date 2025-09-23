import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Entity, Relationship } from '../types';

interface EntityCardProps {
  entity: Entity;
  selectedEntity: Entity | null;
  relationshipStart: Entity | null;
  isCreatingRelationship: boolean;
  entities: Entity[];
  relationships: Relationship[];
  onEntityClick: (e: React.MouseEvent, entity: Entity) => void;
}

const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  selectedEntity,
  relationshipStart,
  isCreatingRelationship,
  entities,
  relationships,
  onEntityClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get relationships for this entity
  const getEntityRelationships = (entityId: string) => {
    return {
      outgoing: relationships.filter(r => r.from === entityId),
      incoming: relationships.filter(r => r.to === entityId)
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if we're not in the middle of a drag
    if (!isDragging) {
      onEntityClick(e, entity);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '280px',
        minHeight: '120px',
        ...style
      }}
      {...attributes}
      className={`relative bg-white border-2 rounded-lg p-4 select-none transition-all ${
        selectedEntity?.id === entity.id
          ? 'border-blue-500 shadow-lg'
          : 'border-gray-300 hover:border-gray-400'
      } ${relationshipStart?.id === entity.id ? 'border-orange-500 shadow-orange-200 shadow-lg' : ''} ${
        isCreatingRelationship ? 'cursor-pointer' : 'cursor-default'
      } ${isDragging ? 'opacity-75 transform scale-105' : ''}`}
      onClick={handleClick}
    >
      {/* Drag handle - only apply listeners to this area when not creating relationships */}
      {!isCreatingRelationship && (
        <div
          {...listeners}
          className="absolute top-2 right-2 w-6 h-6 cursor-move opacity-50 hover:opacity-100 flex items-center justify-center"
          title="Drag to reorder"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="3" cy="3" r="1"/>
            <circle cx="9" cy="3" r="1"/>
            <circle cx="3" cy="9" r="1"/>
            <circle cx="9" cy="9" r="1"/>
          </svg>
        </div>
      )}
      <div className="font-semibold text-gray-900 mb-3 text-lg">
        {entity.name}
      </div>

      {/* Attributes */}
      {(entity.attributes || []).length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-medium text-gray-700 mb-1">Attributes:</div>
          {(entity.attributes || []).map((attr, i) => (
            <div key={i} className="text-xs text-gray-600 ml-2">
              • {attr.name}: {attr.type}
            </div>
          ))}
        </div>
      )}

      {/* States */}
      {entity.states && entity.states.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-medium text-blue-700 mb-1">States:</div>
          <div className="text-xs text-blue-600 ml-2">
            {entity.states.join(', ')}
          </div>
        </div>
      )}

      {/* Actions */}
      {entity.actions && entity.actions.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-medium text-green-700 mb-1">Actions:</div>
          <div className="text-xs text-green-600 ml-2">
            {entity.actions.join(', ')}
          </div>
        </div>
      )}

      {/* Relationships */}
      {(() => {
        const rels = getEntityRelationships(entity.id);
        const allRels = [...rels.outgoing, ...rels.incoming];
        if (allRels.length === 0) return null;

        return (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="text-xs font-medium text-purple-700 mb-1">Relationships:</div>
            <div className="text-xs text-purple-600 ml-2">
              {rels.outgoing.map(rel => {
                const target = entities.find(e => e.id === rel.to);
                const displayLabel = rel.label === 'belongs to' ? 'contains' : rel.label;
                return (
                  <div key={rel.id}>• {displayLabel} {target?.name}</div>
                );
              })}
              {rels.incoming.map(rel => {
                const source = entities.find(e => e.id === rel.from);
                const displayLabel = rel.label === 'contains' ? 'belongs to' : rel.label;
                return (
                  <div key={rel.id}>• {displayLabel} {source?.name}</div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default EntityCard;