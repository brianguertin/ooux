import React from 'react';

interface ToolbarProps {
  onNewModel: () => void;
  onImportJSON: () => void;
  onExportJSON: () => void;
  onExportPNG: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onNewModel,
  onImportJSON,
  onExportJSON,
  onExportPNG,
  fileInputRef,
  onFileImport,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
      <button
        onClick={onNewModel}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        New
      </button>
      <button
        onClick={onImportJSON}
        className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
      >
        Import JSON
      </button>
      <button
        onClick={onExportJSON}
        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
      >
        Export JSON
      </button>
      <button
        onClick={onExportPNG}
        className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
      >
        Export PNG
      </button>

      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onFileImport}
        style={{ display: 'none' }}
      />
      <div className="ml-auto text-sm text-gray-500">
        Ctrl+Z: Undo | Ctrl+Y: Redo | Del: Delete Selected
      </div>
    </div>
  );
};

export default Toolbar;