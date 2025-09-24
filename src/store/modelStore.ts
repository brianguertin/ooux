import { create } from 'zustand';
import { temporal } from 'zundo';
import { Entity, Model, Attribute, Relationship } from '../types';

// Define the store state interface
interface ModelState {
  model: Model;
  selectedEntity: Entity | null;
  isCreatingRelationship: boolean;
  relationshipStart: Entity | null;
  relationshipTypes: string[];
}

// Define the store actions interface
interface ModelActions {
  // Model actions
  setModel: (model: Model) => void;
  resetModel: () => void;
  
  // Entity actions
  addEntity: () => void;
  deleteEntity: (entityId: string) => void;
  updateEntity: (entityId: string, updates: Partial<Entity>) => void;
  setSelectedEntity: (entity: Entity | null) => void;
  reorderEntities: (oldIndex: number, newIndex: number) => void;
  
  // Relationship actions
  setIsCreatingRelationship: (creating: boolean) => void;
  setRelationshipStart: (entity: Entity | null) => void;
  addRelationship: (from: string, to: string, label?: string) => void;
  updateRelationshipLabel: (relId: string, newLabel: string) => void;
  
  // Attribute/State/Action management
  addAttribute: (entityId: string) => void;
  addState: (entityId: string) => void;
  addAction: (entityId: string) => void;
  removeAttribute: (entityId: string, index: number) => void;
  removeState: (entityId: string, index: number) => void;
  removeAction: (entityId: string, index: number) => void;
  updateAttribute: (entityId: string, index: number, field: keyof Attribute, value: string) => void;
  updateState: (entityId: string, index: number, value: string) => void;
  updateAction: (entityId: string, index: number, value: string) => void;
  
  // Utility actions
  startRelationshipFromEntity: (entity: Entity) => void;
  cancelRelationship: () => void;
  handleEntityClick: (entity: Entity) => void;
  completeRelationship: (entity: Entity) => void;
}

type ModelStore = ModelState & ModelActions;

const initialModel: Model = {
  entities: [],
  relationships: []
};

const initialState: ModelState = {
  model: initialModel,
  selectedEntity: null,
  isCreatingRelationship: false,
  relationshipStart: null,
  relationshipTypes: ['relates to', 'contains', 'belongs to']
};

// Create the store with Zundo temporal middleware for undo/redo
export const useModelStore = create<ModelStore>()(
  temporal(
    (set, get) => ({
      ...initialState,
      
      // Model actions
      setModel: (model: Model) => {
        set({ model, selectedEntity: null });
      },
      
      resetModel: () => {
        set({
          model: initialModel,
          selectedEntity: null,
          isCreatingRelationship: false,
          relationshipStart: null
        });
      },
      
      // Entity actions
      addEntity: () => {
        const { model } = get();
        const newEntity: Entity = {
          id: `entity-${Date.now()}`,
          name: 'New Entity',
          order: model.entities.length,
          attributes: [],
          states: [],
          actions: []
        };
        
        set({
          model: {
            ...model,
            entities: [...model.entities, newEntity]
          },
          selectedEntity: newEntity
        });
      },
      
      deleteEntity: (entityId: string) => {
        const { model } = get();
        set({
          model: {
            entities: model.entities.filter(e => e.id !== entityId),
            relationships: model.relationships.filter(r => r.from !== entityId && r.to !== entityId)
          },
          selectedEntity: null
        });
      },
      
      updateEntity: (entityId: string, updates: Partial<Entity>) => {
        const { model, selectedEntity } = get();
        const updatedEntity = model.entities.find(e => e.id === entityId);
        if (!updatedEntity) return;
        
        const newEntity = { ...updatedEntity, ...updates };
        
        set({
          model: {
            ...model,
            entities: model.entities.map(e => 
              e.id === entityId ? newEntity : e
            )
          },
          selectedEntity: selectedEntity?.id === entityId ? newEntity : selectedEntity
        });
      },
      
      setSelectedEntity: (entity: Entity | null) => {
        set({ selectedEntity: entity });
      },
      
      reorderEntities: (oldIndex: number, newIndex: number) => {
        const { model } = get();
        const entities = [...model.entities];
        const [movedEntity] = entities.splice(oldIndex, 1);
        entities.splice(newIndex, 0, movedEntity);
        
        // Update order property
        const reorderedEntities = entities.map((entity, index) => ({
          ...entity,
          order: index
        }));
        
        set({
          model: {
            ...model,
            entities: reorderedEntities
          }
        });
      },
      
      // Relationship actions
      setIsCreatingRelationship: (creating: boolean) => {
        set({ isCreatingRelationship: creating });
      },
      
      setRelationshipStart: (entity: Entity | null) => {
        set({ relationshipStart: entity });
      },
      
      addRelationship: (from: string, to: string, label = 'relates to') => {
        const { model } = get();
        const newRelationship: Relationship = {
          id: `rel-${Date.now()}`,
          from,
          to,
          label
        };
        
        set({
          model: {
            ...model,
            relationships: [...model.relationships, newRelationship]
          }
        });
      },
      
      updateRelationshipLabel: (relId: string, newLabel: string) => {
        const { model } = get();
        const oldRel = model.relationships.find(r => r.id === relId);
        if (!oldRel) return;

        let updatedRel = { ...oldRel, label: newLabel };

        // If switching between contains and belongs to, flip the relationship direction
        if ((oldRel.label === 'contains' && newLabel === 'belongs to') || 
            (oldRel.label === 'belongs to' && newLabel === 'contains')) {
          updatedRel = {
            ...updatedRel,
            from: oldRel.to,
            to: oldRel.from
          };
        }

        set({
          model: {
            ...model,
            relationships: model.relationships.map(r => 
              r.id === relId ? updatedRel : r
            )
          }
        });
      },
      
      // Attribute/State/Action management
      addAttribute: (entityId: string) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        get().updateEntity(entityId, {
          attributes: [...entity.attributes, { name: 'attribute', type: 'string' }]
        });
      },
      
      addState: (entityId: string) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        get().updateEntity(entityId, {
          states: [...entity.states, 'new_state']
        });
      },
      
      addAction: (entityId: string) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        get().updateEntity(entityId, {
          actions: [...entity.actions, 'new_action']
        });
      },
      
      removeAttribute: (entityId: string, index: number) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        get().updateEntity(entityId, {
          attributes: entity.attributes.filter((_, i) => i !== index)
        });
      },
      
      removeState: (entityId: string, index: number) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        get().updateEntity(entityId, {
          states: entity.states.filter((_, i) => i !== index)
        });
      },
      
      removeAction: (entityId: string, index: number) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        get().updateEntity(entityId, {
          actions: entity.actions.filter((_, i) => i !== index)
        });
      },
      
      updateAttribute: (entityId: string, index: number, field: keyof Attribute, value: string) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        const newAttributes = [...entity.attributes];
        newAttributes[index] = { ...newAttributes[index], [field]: value };
        
        get().updateEntity(entityId, { attributes: newAttributes });
      },
      
      updateState: (entityId: string, index: number, value: string) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        const newStates = [...entity.states];
        newStates[index] = value;
        
        get().updateEntity(entityId, { states: newStates });
      },
      
      updateAction: (entityId: string, index: number, value: string) => {
        const { model } = get();
        const entity = model.entities.find(e => e.id === entityId);
        if (!entity) return;
        
        const newActions = [...entity.actions];
        newActions[index] = value;
        
        get().updateEntity(entityId, { actions: newActions });
      },
      
      // Utility actions
      startRelationshipFromEntity: (entity: Entity) => {
        set({
          isCreatingRelationship: true,
          relationshipStart: entity
        });
      },
      
      cancelRelationship: () => {
        set({
          isCreatingRelationship: false,
          relationshipStart: null
        });
      },
      
      handleEntityClick: (entity: Entity) => {
        const { isCreatingRelationship, relationshipStart } = get();
        
        if (isCreatingRelationship) {
          if (relationshipStart && relationshipStart.id !== entity.id) {
            // Complete relationship
            get().addRelationship(relationshipStart.id, entity.id);
            console.log('Created relationship from', relationshipStart.name, 'to', entity.name);
          }
          get().cancelRelationship();
          return;
        }
        
        get().setSelectedEntity(entity);
      },
      
      completeRelationship: (entity: Entity) => {
        const { relationshipStart } = get();
        if (relationshipStart && relationshipStart.id !== entity.id) {
          get().addRelationship(relationshipStart.id, entity.id);
        }
        get().cancelRelationship();
      }
    }),
    {
      // Zundo configuration
      limit: 50, // Keep last 50 states for undo/redo
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b), // Deep equality check
    }
  )
);

// Export temporal store for undo/redo operations
export const { undo, redo, clear } = useModelStore.temporal.getState();