import React, { useState, useEffect } from 'react';
import { useIDB } from '@/utils/indexedDB';
import { useRouter } from 'next/router';
import { Plus, Folder, Trash2, Edit2, Check, X } from 'lucide-react';
import { Layer } from '@/interfaces/utils/indexedDB';

export default function Dashboard() {
  const router = useRouter();
  const { activeLayers, addLayer, updateLayer, deleteLayer } = useIDB();
  const [projects, setProjects] = useState<Layer[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    projectId: string | null;
    x: number;
    y: number;
  }>({ isOpen: false, projectId: null, x: 0, y: 0 });

  // Handle outside click to close modal
  useEffect(() => {
    const handleOutsideClick = () => {
      if (deleteModal.isOpen) {
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
      }
    };
    if (deleteModal.isOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [deleteModal.isOpen]);

  // Project Loading & Auto-Migration
  useEffect(() => {
    const pMap = new Map<string, Layer>(); // Metadata Layers
    const pGroups = new Map<string, Layer[]>(); // Page Groups

    let migrationNeeded = false;
    const actionsToPerform: (() => void)[] = [];

    activeLayers.forEach(l => {
      if (l.isProjectMetadata) {
        pMap.set(l.id, l);
      } else if (l.isProject) { // Pages
        const pid = l.projectId || l.id;
        if (!pGroups.has(pid)) pGroups.set(pid, []);
        pGroups.get(pid)?.push(l);
      }
    });

    // Check for "Orphaned" Groups (Legacy) and mock them or queue migration
    pGroups.forEach((pages, pid) => {
      if (!pMap.has(pid)) {
        // Found a group without metadata.
        // We need to display it, and ideally clean it up.
        // To avoid infinite loops in useEffect if addLayer triggers re-render immediately,
        // we should be careful. `addLayer` usually updates IndexedDB then state.

        const firstPage = pages[0];
        // Create a temporary object for display
        const metaLayer: Layer = {
          id: pid,
          type: 'group',
          name: firstPage.name, // Inherit name from first page for now
          visible: true,
          locked: false,
          parentId: null,
          depth: 0,
          isProject: false,
          isProjectMetadata: true,
          projectId: pid,
          order: 0
        };
        pMap.set(pid, metaLayer);

        // Queue actual migration
        actionsToPerform.push(() => addLayer(metaLayer));
        migrationNeeded = true;
      }
    });

    setProjects(Array.from(pMap.values()));

    // Execute migration if needed
    if (migrationNeeded && actionsToPerform.length > 0) {
      // Debounce or just run?
      // Since activeLayers dependency will re-trigger, we need to ensure we don't
      // create duplicate layers. `addLayer` id check handles that?
      // The check `!pMap.has(pid)` prevents duplicates IF state updates fast enough.
      // But to be safe, we only do this if we are SURE it's missing.
      console.log("Migrating legacy projects:", actionsToPerform.length);
      actionsToPerform.forEach(action => action());
    }

  }, [activeLayers, addLayer]);

  const handleCreateProject = () => {
    // Calculate new name
    let newName = 'Projeto 1';
    let counter = 1;
    const existingNames = new Set(projects.map(p => p.name.trim()));

    while (existingNames.has(`Projeto ${counter}`)) {
      counter++;
    }
    newName = `Projeto ${counter}`;

    const newProjectId = crypto.randomUUID();

    // 1. Create Metadata Layer
    const projectMeta: Layer = {
      id: newProjectId,
      type: 'group',
      name: newName,
      visible: true,
      locked: false,
      parentId: null,
      depth: 0,
      isProject: false,
      isProjectMetadata: true,
      projectId: newProjectId,
      order: 0
    };
    addLayer(projectMeta);

    // 2. Create First Page
    const newPage: Layer = {
      id: crypto.randomUUID(),
      type: 'group',
      name: 'Página 1',
      visible: true,
      locked: false,
      parentId: null,
      depth: 0,
      isProject: true, // Keep isProject=true so it's treated as a page
      projectId: newProjectId,
      order: 0
    };
    addLayer(newPage);
  };

  const handleOpenProject = (layer: Layer) => {
    // layer is the Metadata Layer
    // Navigate to project wrapper
    router.push(`/project/${layer.id}`);
  };

  const handleDeleteSubAction = (id: string | null) => {
    if (!id) return;
    // Delete Metadata Layer
    deleteLayer(id);

    // Delete all pages in this project
    const pages = activeLayers.filter(l => l.projectId === id || (l.projectId === undefined && l.id === id));
    pages.forEach(p => deleteLayer(p.id));
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Calculate position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    // Position modal above the click target, centered
    const x = rect.left + rect.width / 2;
    const y = rect.top; // Position above the button

    setDeleteModal({
      isOpen: true,
      projectId: id,
      x,
      y
    });
  };

  const startEditing = (e: React.MouseEvent, project: Layer) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId) {
      const project = projects.find(p => p.id === editingId);
      if (project) {
        updateLayer({ ...project, name: editName });
      }
      setEditingId(null);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Meus Projetos
            </h1>
            <p className="text-neutral-400 mt-2">Gerencie seus canvas e soundboards</p>
          </div>
          <button
            onClick={handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:scale-105 font-medium"
          >
            <Plus size={20} />
            Novo Projeto
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Card (Visual Shortcut) */}
          <button
            onClick={handleCreateProject}
            className="group border-2 border-dashed border-neutral-800 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:bg-neutral-900/50 h-64"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-900 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
              <Plus size={32} className="text-neutral-600 group-hover:text-blue-400" />
            </div>
            <span className="text-neutral-500 group-hover:text-blue-400 font-medium">Criar Novo Projeto</span>
          </button>

          {/* Project Cards */}
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => handleOpenProject(project)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 hover:shadow-xl transition-all cursor-pointer group relative h-64 flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-80 group-hover:opacity-100 transition-opacity">
                <Folder size={48} className="text-blue-500" />

                {editingId === project.id ? (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="bg-neutral-950 border border-blue-500 rounded px-2 py-1 text-center focus:outline-none"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-500 hover:text-green-400"><Check size={18} /></button>
                    <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X size={18} /></button>
                  </div>
                ) : (
                  <h3 className="text-xl font-semibold text-center break-words w-full px-4">{project.name}</h3>
                )}
              </div>

              <div className="mt-auto flex justify-between items-center pt-4 border-t border-neutral-800">
                <span className="text-xs text-neutral-500">
                  {/* Could add creation date here if available in Layer */}
                  ID: {project.id.slice(0, 8)}...
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startEditing(e, project)}
                    className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                    title="Renomear"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    className="p-2 hover:bg-red-900/30 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteModal.isOpen && (
        <div
          className="fixed z-50 bg-neutral-800 border border-neutral-700 shadow-xl rounded-lg p-4 w-64 flex flex-col gap-3"
          style={{
            top: deleteModal.y - 120, // Position well above the cursor
            left: deleteModal.x - 128, // Center horizontally (w-64 is 256px, so -128)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-white font-semibold text-center">Excluir Projeto?</h4>
          <p className="text-neutral-400 text-xs text-center">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
              className="flex-1 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDeleteSubAction(deleteModal.projectId)}
              className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm text-white transition-colors"
            >
              Excluir
            </button>
          </div>
          {/* Arrow/Triangle pointing down */}
          <div
            className="absolute w-3 h-3 bg-neutral-800 border-r border-b border-neutral-700 transform rotate-45 left-1/2 -bottom-1.5 -translate-x-1/2"
          ></div>
        </div>
      )}
    </div>
  );
}