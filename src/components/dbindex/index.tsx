'use client';

import React, { useState, useEffect } from 'react';

// --- Ícone de Arrastar ---
const DragHandleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500">
    <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
    <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
  </svg>
);


// --- Componente Principal ---
export default function AudioUploader() {
  const [db, setDb] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [savedAudios, setSavedAudios] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Estados para Drag-and-Drop ---
  const [activePlayers, setActivePlayers] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Efeito para inicializar o IndexedDB
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const request = indexedDB.open('audioDatabase', 1);

    request.onerror = (event) => {
      console.error("Erro ao abrir o IndexedDB:", event.target.error);
      setMessage('Erro ao carregar o banco de dados local.');
      setIsLoading(false);
    };

    request.onsuccess = (event) => {
      const database = event.target.result;
      setDb(database);
      loadAudios(database);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('audios')) {
        database.createObjectStore('audios', { keyPath: 'id', autoIncrement: true });
      }
    };
  }, []);

  // --- Funções de Manipulação de Dados ---
  const loadAudios = (database) => {
    const dbInstance = database || db;
    if (!dbInstance) return;

    setIsLoading(true);
    const transaction = dbInstance.transaction(['audios'], 'readonly');
    const store = transaction.objectStore('audios');
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      const audiosWithUrls = getAllRequest.result.map(audioRecord => ({
        ...audioRecord,
        url: URL.createObjectURL(audioRecord.file)
      }));
      setSavedAudios(audiosWithUrls);
      setIsLoading(false);
    };

    getAllRequest.onerror = (event) => {
      console.error("Erro ao carregar áudios:", event.target.error);
      setMessage('Não foi possível carregar os áudios salvos.');
      setIsLoading(false);
    };
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedAudio(file);
      setMessage('');
    } else {
      setSelectedAudio(null);
      setMessage('Por favor, selecione um arquivo de áudio válido.');
    }
  };

  const saveAudio = () => {
    if (!db || !selectedAudio) {
      setMessage('Selecione um arquivo de áudio antes de salvar.');
      return;
    }

    const transaction = db.transaction(['audios'], 'readwrite');
    const store = transaction.objectStore('audios');
    const audioRecord = {
      name: selectedAudio.name,
      type: selectedAudio.type,
      file: selectedAudio,
      createdAt: new Date()
    };
    
    const addRequest = store.add(audioRecord);

    addRequest.onsuccess = () => {
      setMessage(`Áudio "${selectedAudio.name}" salvo com sucesso!`);
      setSelectedAudio(null);
      document.getElementById('audio-input').value = '';
      loadAudios(db);
    };

    addRequest.onerror = (event) => {
      console.error("Erro ao salvar áudio:", event.target.error);
      setMessage('Ocorreu um erro ao salvar o áudio.');
    };
  };

  const deleteAudio = (id) => {
    if (!db) return;

    const transaction = db.transaction(['audios'], 'readwrite');
    const store = transaction.objectStore('audios');
    const deleteRequest = store.delete(id);

    deleteRequest.onsuccess = () => {
      setMessage('Áudio deletado com sucesso.');
      removePlayer(id); // Remove da lista de players ativos também
      loadAudios(db);
    };

    deleteRequest.onerror = (event) => {
      console.error("Erro ao deletar áudio:", event.target.error);
      setMessage('Erro ao deletar o áudio.');
    };
  };

  // --- Funções de Drag-and-Drop ---
  const handleDragStart = (e, audio) => {
    e.dataTransfer.setData('audioId', audio.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const   handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const audioId = parseInt(e.dataTransfer.getData('audioId'), 10);
    const audioToPlay = savedAudios.find(a => a.id === audioId);

    if (audioToPlay && !activePlayers.some(p => p.id === audioId)) {
      setActivePlayers(prevPlayers => [...prevPlayers, audioToPlay]);
    }
  };

  const removePlayer = (id) => {
    setActivePlayers(prevPlayers => prevPlayers.filter(p => p.id !== id));
  };

  // --- Renderização ---
  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      {/* Cabeçalho Fixo para Upload */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-700">
        <div className="max-w-5xl mx-auto p-4">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">Gravador de Áudio Local</h1>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              id="audio-input"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 transition-colors duration-200 cursor-pointer"
            />
            <button
              onClick={saveAudio}
              disabled={!selectedAudio}
              className="w-full sm:w-auto px-6 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex-shrink-0"
            >
              Salvar Áudio
            </button>
          </div>
          {message && <p className={`mt-3 text-center text-sm ${message.includes('Erro') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-36 sm:pt-32">
        <div className="max-w-5xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Coluna 1: Biblioteca de Áudios (Arrastáveis) */}
          <div className="bg-gray-800 p-6 rounded-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-white border-b-2 border-gray-600 pb-2">Sua Biblioteca</h2>
            {isLoading ? (
              <p className="text-center text-gray-400">Carregando áudios...</p>
            ) : savedAudios.length > 0 ? (
              <ul className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                {savedAudios.map((audio) => (
                  <li
                    key={audio.id}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, audio)}
                    className="bg-gray-700 p-3 rounded-lg flex items-center justify-between gap-4 cursor-grab active:cursor-grabbing animate-fade-in"
                  >
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <DragHandleIcon />
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-cyan-300 truncate" title={audio.name}>{audio.name}</p>
                        <p className="text-xs text-gray-400">Salvo em: {new Date(audio.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAudio(audio.id)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 flex-shrink-0"
                      aria-label="Deletar áudio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-400 py-8">Sua biblioteca está vazia.</p>
            )}
          </div>

          {/* Coluna 2: Players Ativos (Área de Drop) */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            className={`bg-gray-800 p-6 rounded-2xl transition-all duration-300 border-2 border-dashed ${isDraggingOver ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600'}`}
          >
            <h2 className="text-2xl font-semibold mb-4 text-white border-b-2 border-gray-600 pb-2">Players Ativos</h2>
            <div className="space-y-4 h-[60vh] overflow-y-auto pr-2">
              {activePlayers.length > 0 ? (
                activePlayers.map((audio) => (
                  <div key={audio.id} className="bg-gray-700 p-4 rounded-lg animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-cyan-300 truncate" title={audio.name}>{audio.name}</p>
                      <button onClick={() => removePlayer(audio.id)} className="text-gray-400 hover:text-white">&times;</button>
                    </div>
                    <audio controls src={audio.url} className="w-full h-10"></audio>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center">Arraste um áudio da sua biblioteca para tocar aqui.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

