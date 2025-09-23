import React, { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Entity, Model, Attribute } from './types';
import Toolbar from './components/Toolbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import EntityCard from './components/EntityCard';


const BusinessDomainModeler = () => {
  const [model, setModel] = useState<Model>({
    entities: [],
    relationships: []
  });
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isCreatingRelationship, setIsCreatingRelationship] = useState(false);
  const [relationshipStart, setRelationshipStart] = useState<Entity | null>(null);
  
  // Add missing state variables
  const [history, setHistory] = useState<Model[]>([{ entities: [], relationships: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined relationship types
  const relationshipTypes = [
    'relates to',
    'contains',
    'belongs to'
  ];

  // Save state to history for undo/redo
  const saveToHistory = useCallback((newModel: Model) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newModel)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setModel(JSON.parse(JSON.stringify(history[historyIndex - 1])));
            setSelectedEntity(null);
          }
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setModel(JSON.parse(JSON.stringify(history[historyIndex + 1])));
            setSelectedEntity(null);
          }
        }
      }
      if (e.key === 'Delete' && selectedEntity) {
        deleteEntity(selectedEntity.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity, historyIndex, history]);

  // Add new entity
  const addEntity = () => {
    const newEntity = {
      id: `entity-${Date.now()}`,
      name: 'New Entity',
      order: model.entities.length, // Use order instead of x/y
      attributes: [],
      states: [],
      actions: []
    };

    const newModel = {
      ...model,
      entities: [...model.entities, newEntity]
    };
    
    setModel(newModel);
    saveToHistory(newModel);
    setSelectedEntity(newEntity);
  };

  // Delete entity
  const deleteEntity = (entityId: string) => {
    const newModel = {
      entities: model.entities.filter(e => e.id !== entityId),
      relationships: model.relationships.filter(r => r.from !== entityId && r.to !== entityId)
    };
    
    setModel(newModel);
    saveToHistory(newModel);
    setSelectedEntity(null);
  };

  // Update entity
  const updateEntity = (entityId: string, updates: Partial<Entity>) => {
    const newModel = {
      ...model,
      entities: model.entities.map(e => 
        e.id === entityId ? { ...e, ...updates } : e
      )
    };
    
    setModel(newModel);
    if (selectedEntity) {
      setSelectedEntity({ ...selectedEntity, ...updates });
    }
  };

  // dndkit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = model.entities.findIndex(entity => entity.id === active.id);
      const newIndex = model.entities.findIndex(entity => entity.id === over?.id);

      const reorderedEntities = arrayMove(model.entities, oldIndex, newIndex).map((entity, index) => ({
        ...entity,
        order: index
      }));

      const newModel = {
        ...model,
        entities: reorderedEntities
      };

      setModel(newModel);
      saveToHistory(newModel);
    }
  };

  // Handle entity click for relationship creation
  const handleEntityClick = (e: React.MouseEvent, entity: Entity) => {
    e.stopPropagation();

    if (isCreatingRelationship) {
      if (relationshipStart) {
        // Complete relationship
        if (relationshipStart.id !== entity.id) {
          const newRelationship = {
            id: `rel-${Date.now()}`,
            from: relationshipStart.id,
            to: entity.id,
            label: 'relates to'
          };

          const newModel = {
            ...model,
            relationships: [...model.relationships, newRelationship]
          };

          setModel(newModel);
          saveToHistory(newModel);
          console.log('Created relationship:', newRelationship); // Debug log
        }
        setIsCreatingRelationship(false);
        setRelationshipStart(null);
      } else {
        setRelationshipStart(entity);
        console.log('Started relationship from:', entity.name); // Debug log
      }
      return;
    }

    setSelectedEntity(entity);
  };


  // Add attribute, state, or action
  const addAttribute = () => {
    if (!selectedEntity) return;
    const newAttributes: Attribute[] = [...selectedEntity.attributes, { name: 'attribute', type: 'string' }];
    updateEntity(selectedEntity.id, { attributes: newAttributes });
  };

  const addState = () => {
    if (!selectedEntity) return;
    const newStates = [...selectedEntity.states, 'new_state'];
    updateEntity(selectedEntity.id, { states: newStates });
  };

  const addAction = () => {
    if (!selectedEntity) return;
    const newActions = [...selectedEntity.actions, 'new_action'];
    updateEntity(selectedEntity.id, { actions: newActions });
  };

  // Remove items
  const removeAttribute = (index: number) => {
    if (!selectedEntity) return;
    const newAttributes = selectedEntity.attributes.filter((_, i) => i !== index);
    updateEntity(selectedEntity.id, { attributes: newAttributes });
  };

  const removeState = (index: number) => {
    if (!selectedEntity) return;
    const newStates = selectedEntity.states.filter((_, i) => i !== index);
    updateEntity(selectedEntity.id, { states: newStates });
  };

  const removeAction = (index: number) => {
    if (!selectedEntity) return;
    const newActions = selectedEntity.actions.filter((_, i) => i !== index);
    updateEntity(selectedEntity.id, { actions: newActions });
  };

  // Update items
  const updateAttribute = (index: number, field: keyof Attribute, value: string) => {
    if (!selectedEntity) return;
    const newAttributes = [...selectedEntity.attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    updateEntity(selectedEntity.id, { attributes: newAttributes });
  };

  const updateState = (index: number, value: string) => {
    if (!selectedEntity) return;
    const newStates = [...selectedEntity.states];
    newStates[index] = value;
    updateEntity(selectedEntity.id, { states: newStates });
  };

  const updateAction = (index: number, value: string) => {
    if (!selectedEntity) return;
    const newActions = [...selectedEntity.actions];
    newActions[index] = value;
    updateEntity(selectedEntity.id, { actions: newActions });
  };

  // Export and import functions
  const exportAsJSON = () => {
    try {
      const exportData = {
        version: '1.0',
        created: new Date().toISOString(),
        title: 'Business Domain Model',
        entities: model.entities,
        relationships: model.relationships,
        metadata: {
          entityCount: model.entities.length,
          relationshipCount: model.relationships.length
        }
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-model-${new Date().toISOString().slice(0, 10)}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Export successful!', exportData);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const importJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Failed to read file content');
        }
        const jsonData = JSON.parse(result);
        
        // Validate the imported data structure
        if (!jsonData.entities || !Array.isArray(jsonData.entities)) {
          throw new Error('Invalid file format: missing or invalid entities array');
        }
        if (!jsonData.relationships || !Array.isArray(jsonData.relationships)) {
          throw new Error('Invalid file format: missing or invalid relationships array');
        }

        const importedModel = {
          entities: jsonData.entities,
          relationships: jsonData.relationships
        };

        // Confirm before replacing current model
        if (model.entities.length > 0 || model.relationships.length > 0) {
          if (!confirm('Import will replace your current model. Continue?')) {
            return;
          }
        }

        setModel(importedModel);
        setSelectedEntity(null);
        setHistory([importedModel]);
        setHistoryIndex(0);
        
        console.log('Model imported successfully:', importedModel);
        alert(`Model imported successfully!\n${importedModel.entities.length} entities, ${importedModel.relationships.length} relationships`);
      } catch (error) {
        console.error('Import failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Import failed: ${errorMessage}`);
      }
    };

    reader.onerror = () => {
      alert('Failed to read file');
    };

    reader.readAsText(file);
    
    // Reset file input so the same file can be selected again
    event.target.value = '';
  };

  const exportAsPNG = async () => {
    try {
      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        alert('Canvas not found');
        return;
      }

      // Use html2canvas to capture the canvas area
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: '#f9fafb',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        ignoreElements: (element) => {
          // Ignore elements that might interfere with the screenshot
          return element.classList.contains('hover:') || element.classList.contains('focus:');
        }
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate PNG');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `business-model-${new Date().toISOString().slice(0, 10)}.png`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('PNG export successful!');
      }, 'image/png');

    } catch (error) {
      console.error('PNG export failed:', error);
      alert('PNG export failed. Please try again.');
    }
  };

  // New model
  const newModel = () => {
    if (model.entities.length > 0 && !confirm('Start new model? Current work will be lost.')) {
      return;
    }
    
    const emptyModel = { entities: [], relationships: [] };
    setModel(emptyModel);
    setSelectedEntity(null);
    setHistory([emptyModel]);
    setHistoryIndex(0);
  };

  // Update relationship label
  const updateRelationshipLabel = (relId: string, newLabel: string) => {
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

    const newModel = {
      ...model,
      relationships: model.relationships.map(r => 
        r.id === relId ? updatedRel : r
      )
    };
    
    setModel(newModel);
    saveToHistory(newModel);
  };



  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      <Toolbar
        onNewModel={newModel}
        onImportJSON={importJSON}
        onExportJSON={exportAsJSON}
        onExportPNG={exportAsPNG}
        fileInputRef={fileInputRef}
        onFileImport={handleFileImport}
      />

      <div className="flex flex-1">
        <LeftSidebar
          onAddEntity={addEntity}
          isCreatingRelationship={isCreatingRelationship}
          onToggleRelationshipMode={() => setIsCreatingRelationship(!isCreatingRelationship)}
          relationshipStart={relationshipStart}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-auto">
          <div
            ref={canvasRef}
            className="w-full min-h-full p-6 bg-gray-50"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={model.entities.map(e => e.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-6 justify-start items-start">
                  {[...model.entities]
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(entity => (
                      <EntityCard
                        key={entity.id}
                        entity={entity}
                        selectedEntity={selectedEntity}
                        relationshipStart={relationshipStart}
                        isCreatingRelationship={isCreatingRelationship}
                        entities={model.entities}
                        relationships={model.relationships}
                        onEntityClick={handleEntityClick}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>

            {model.entities.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-xl mb-2">No entities yet</div>
                <div className="text-sm">Click "Add Entity" to get started</div>
              </div>
            )}
          </div>
        </div>

        <RightSidebar
          selectedEntity={selectedEntity}
          entities={model.entities}
          relationships={model.relationships}
          relationshipTypes={relationshipTypes}
          onUpdateEntity={updateEntity}
          onDeleteEntity={deleteEntity}
          onUpdateRelationshipLabel={updateRelationshipLabel}
          onAddAttribute={addAttribute}
          onAddState={addState}
          onAddAction={addAction}
          onRemoveAttribute={removeAttribute}
          onRemoveState={removeState}
          onRemoveAction={removeAction}
          onUpdateAttribute={updateAttribute}
          onUpdateState={updateState}
          onUpdateAction={updateAction}
        />
      </div>
    </div>
  );
};

export default BusinessDomainModeler;