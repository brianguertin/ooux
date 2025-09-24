import React, { useRef, useEffect } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Entity } from './types';
import { useModelStore } from './store/modelStore';
import Toolbar from './components/Toolbar';
import RightSidebar from './components/RightSidebar';
import EntityCard from './components/EntityCard';


const BusinessDomainModeler = () => {
  // Zustand store hooks - only get what's needed for this component
  const {
    model,
    selectedEntity,
    // Actions used directly in this component
    addEntity,
    deleteEntity,
    setSelectedEntity,
    reorderEntities,
    setModel,
    resetModel,
    handleEntityClick,
  } = useModelStore();

  // Refs for file operations
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          useModelStore.temporal.getState().undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          useModelStore.temporal.getState().redo();
        }
      }
      if (e.key === 'Delete' && selectedEntity) {
        deleteEntity(selectedEntity.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity, deleteEntity]);

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
      reorderEntities(oldIndex, newIndex);
    }
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
        useModelStore.temporal.getState().clear();
        
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
    
    resetModel();
    useModelStore.temporal.getState().clear();
  };

  const handleEntityCardClick = (e: React.MouseEvent, entity: Entity) => {
    e.stopPropagation();
    handleEntityClick(entity);
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
                        onEntityClick={handleEntityCardClick}
                      />
                    ))}

                  {/* Always visible plus button at the end (only when there are entities) */}
                  {model.entities.length > 0 && (
                    <button
                      onClick={addEntity}
                      className="w-12 h-12 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-700 focus:outline-none transition-all"
                      title="Add entity"
                    >
                      +
                    </button>
                  )}
                </div>
              </SortableContext>
            </DndContext>

            {model.entities.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-xl mb-2">No entities yet</div>
                <div className="text-sm mb-4">Click "Add Entity" to get started</div>
                <button
                  onClick={addEntity}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  + Add Entity
                </button>
              </div>
            )}
          </div>
        </div>

        <RightSidebar />
      </div>
    </div>
  );
};

export default BusinessDomainModeler;