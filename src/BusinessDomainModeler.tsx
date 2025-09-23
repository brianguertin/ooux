import React, { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

const BusinessDomainModeler = () => {
  const [model, setModel] = useState({
    entities: [],
    relationships: []
  });
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isCreatingRelationship, setIsCreatingRelationship] = useState(false);
  const [relationshipStart, setRelationshipStart] = useState(null);
  const [dragState, setDragState] = useState(null);
  
  // Add missing state variables
  const [history, setHistory] = useState([{ entities: [], relationships: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Predefined relationship types
  const relationshipTypes = [
    'relates to',
    'contains',
    'belongs to'
  ];

  // Save state to history for undo/redo
  const saveToHistory = useCallback((newModel) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newModel)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
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
  const deleteEntity = (entityId) => {
    const newModel = {
      entities: model.entities.filter(e => e.id !== entityId),
      relationships: model.relationships.filter(r => r.from !== entityId && r.to !== entityId)
    };
    
    setModel(newModel);
    saveToHistory(newModel);
    setSelectedEntity(null);
  };

  // Update entity
  const updateEntity = (entityId, updates) => {
    const newModel = {
      ...model,
      entities: model.entities.map(e => 
        e.id === entityId ? { ...e, ...updates } : e
      )
    };
    
    setModel(newModel);
    setSelectedEntity({ ...selectedEntity, ...updates });
  };

  // Handle entity click for relationship creation
  const handleEntityClick = (e, entity) => {
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

  // Handle entity drag for reordering (horizontal)
  const handleMouseDown = (e, entity) => {
    if (isCreatingRelationship) {
      return; // Don't drag when creating relationships
    }

    setDragState({
      isDragging: true,
      entityId: entity.id,
      startX: e.clientX, // Use X for horizontal movement
      currentOrder: entity.order
    });
  };

  const handleMouseMove = (e) => {
    if (dragState && dragState.isDragging) {
      // Calculate which position we should move to based on mouse X
      const deltaX = e.clientX - dragState.startX;
      const entityWidth = 320; // Approximate width including margin
      const orderChange = Math.round(deltaX / entityWidth);
      const newOrder = Math.max(0, Math.min(model.entities.length - 1, dragState.currentOrder + orderChange));
      
      if (newOrder !== dragState.currentOrder) {
        // Reorder entities
        const sortedEntities = [...model.entities].sort((a, b) => a.order - b.order);
        const draggedEntity = sortedEntities.find(e => e.id === dragState.entityId);
        const otherEntities = sortedEntities.filter(e => e.id !== dragState.entityId);
        
        // Insert at new position
        otherEntities.splice(newOrder, 0, draggedEntity);
        
        // Update order for all entities
        const reorderedEntities = otherEntities.map((entity, index) => ({
          ...entity,
          order: index
        }));
        
        const newModel = {
          ...model,
          entities: reorderedEntities
        };
        
        setModel(newModel);
        setDragState({
          ...dragState,
          currentOrder: newOrder
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState && dragState.isDragging) {
      saveToHistory(model);
    }
    setDragState(null);
  };

  // Add attribute, state, or action
  const addAttribute = () => {
    if (!selectedEntity) return;
    const newAttributes = [...selectedEntity.attributes, { name: 'attribute', type: 'string' }];
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
  const removeAttribute = (index) => {
    if (!selectedEntity) return;
    const newAttributes = selectedEntity.attributes.filter((_, i) => i !== index);
    updateEntity(selectedEntity.id, { attributes: newAttributes });
  };

  const removeState = (index) => {
    if (!selectedEntity) return;
    const newStates = selectedEntity.states.filter((_, i) => i !== index);
    updateEntity(selectedEntity.id, { states: newStates });
  };

  const removeAction = (index) => {
    if (!selectedEntity) return;
    const newActions = selectedEntity.actions.filter((_, i) => i !== index);
    updateEntity(selectedEntity.id, { actions: newActions });
  };

  // Update items
  const updateAttribute = (index, field, value) => {
    if (!selectedEntity) return;
    const newAttributes = [...selectedEntity.attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    updateEntity(selectedEntity.id, { attributes: newAttributes });
  };

  const updateState = (index, value) => {
    if (!selectedEntity) return;
    const newStates = [...selectedEntity.states];
    newStates[index] = value;
    updateEntity(selectedEntity.id, { states: newStates });
  };

  const updateAction = (index, value) => {
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

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        
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
        alert(`Import failed: ${error.message}`);
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
  const updateRelationshipLabel = (relId, newLabel) => {
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

  // Get relationships for an entity
  const getEntityRelationships = (entityId) => {
    return {
      outgoing: model.relationships.filter(r => r.from === entityId),
      incoming: model.relationships.filter(r => r.to === entityId)
    };
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        <button 
          onClick={newModel}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          New
        </button>
        <button 
          onClick={importJSON}
          className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
        >
          Import JSON
        </button>
        <button 
          onClick={exportAsJSON}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Export JSON
        </button>
        <button 
          onClick={exportAsPNG}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
        >
          Export PNG
        </button>
        
        {/* Hidden file input for JSON import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
        <div className="ml-auto text-sm text-gray-500">
          Ctrl+Z: Undo | Ctrl+Y: Redo | Del: Delete Selected
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-48 bg-white border-r border-gray-200 p-4">
          <h3 className="font-semibold mb-4">Tools</h3>
          <div className="space-y-2">
            <button
              onClick={addEntity}
              className="w-full px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              + Add Entity
            </button>
            <button
              onClick={() => setIsCreatingRelationship(!isCreatingRelationship)}
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

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-auto">
          <div 
            ref={canvasRef}
            className="w-full min-h-full p-6 bg-gray-50"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="flex gap-6 justify-start items-start">
              {/* Entities in column layout */}
              {[...model.entities]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(entity => (
                <div
                  key={entity.id}
                  className={`bg-white border-2 rounded-lg p-4 select-none transition-all ${
                    selectedEntity?.id === entity.id 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${relationshipStart?.id === entity.id ? 'border-orange-500 shadow-orange-200 shadow-lg' : ''} ${
                    isCreatingRelationship ? 'cursor-pointer' : 'cursor-move'
                  } ${dragState?.entityId === entity.id ? 'opacity-75 transform scale-105' : ''}`}
                  style={{ 
                    width: '280px',
                    minHeight: '120px'
                  }}
                  onClick={(e) => handleEntityClick(e, entity)}
                  onMouseDown={(e) => handleMouseDown(e, entity)}
                >
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
                            const target = model.entities.find(e => e.id === rel.to);
                            const displayLabel = rel.label === 'belongs to' ? 'contains' : rel.label;
                            return (
                              <div key={rel.id}>• {displayLabel} {target?.name}</div>
                            );
                          })}
                          {rels.incoming.map(rel => {
                            const source = model.entities.find(e => e.id === rel.from);
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
              ))}
            </div>
            
            {model.entities.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-xl mb-2">No entities yet</div>
                <div className="text-sm">Click "Add Entity" to get started</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          {selectedEntity ? (
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
                {(selectedEntity.attributes || []).map((attr, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={attr.name || ''}
                      onChange={(e) => updateAttribute(i, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="name"
                    />
                    <select
                      value={attr.type || 'string'}
                      onChange={(e) => updateAttribute(i, 'type', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="date">date</option>
                      <option value="enum">enum</option>
                    </select>
                    <button
                      onClick={() => removeAttribute(i)}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAttribute}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Attribute
                </button>
              </div>

              {/* States */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">States:</label>
                {(selectedEntity.states || []).map((state, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={state || ''}
                      onChange={(e) => updateState(i, e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                    <button
                      onClick={() => removeState(i)}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addState}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add State
                </button>
              </div>

              {/* Actions */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Actions:</label>
                {(selectedEntity.actions || []).map((action, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={action || ''}
                      onChange={(e) => updateAction(i, e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                    <button
                      onClick={() => removeAction(i)}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAction}
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
                <h4 className="font-medium text-sm mb-2">Relationships:</h4>
                {(() => {
                  const rels = getEntityRelationships(selectedEntity.id);
                  const hasRelationships = rels.outgoing.length > 0 || rels.incoming.length > 0;
                  
                  if (!hasRelationships) {
                    return <div className="text-xs text-gray-500">No relationships</div>;
                  }
                  
                  return (
                    <div className="space-y-2">
                      {rels.outgoing.map(rel => {
                        const targetEntity = model.entities.find(e => e.id === rel.to);
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
                        const sourceEntity = model.entities.find(e => e.id === rel.from);
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
          ) : (
            <div className="text-gray-500 text-sm">
              Select an entity to edit its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDomainModeler;