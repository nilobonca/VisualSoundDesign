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

  useEffect(() => {
    // Group by Project ID
    const projectMap = new Map<string, Layer>();

    activeLayers.filter(l => l.isProject).forEach(layer => {
      // If layer has a projectId, use it as the key.
      // If not, it's a legacy project (single page), use its own ID as the key.
      const pId = layer.projectId || layer.id;

      if (!projectMap.has(pId)) {
        projectMap.set(pId, layer);
      }
      // If we already have a layer for this project, maybe pick the one with the earliest creation? 
      // For now, first found wins.
    });

    setProjects(Array.from(projectMap.values()));
  }, [activeLayers]);

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
    const newPage: Layer = {
      id: crypto.randomUUID(),
      type: 'group',
      name: newName,
      visible: true,
      locked: false,
      parentId: null,
      depth: 0,
      isProject: true,
      projectId: newProjectId,
      order: 0
    };
    addLayer(newPage);
    // Don't auto-redirect, let the user see the new project in the list or click to open.
  };

  const handleOpenProject = (layer: Layer) => {
    // If it has a projectId, navigate to that.
    // If not, it's legacy, navigate to its ID.
    const targetId = layer.projectId || layer.id;
    router.push(`/project/${targetId}`);
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      // We need to delete ALL layers with this projectId
      // Or if legacy, just the layer.

      // Find the project layer to check if it has projectId
      const projectLayer = projects.find(p => p.id === id || p.projectId === id); // id passed might be layer ID or project ID?
      // The list renders 'projects' which are Layers. So 'id' is layer.id.

      const targetLayer = activeLayers.find(l => l.id === id);
      if (targetLayer?.projectId) {
        // Delete all pages in this project
        const pages = activeLayers.filter(l => l.projectId === targetLayer.projectId);
        pages.forEach(p => deleteLayer(p.id));
      } else {
        deleteLayer(id);
      }
    }
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
    </div>
  );
}