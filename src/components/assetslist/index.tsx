import { useEffect, useState } from "react";

const DragHandleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500">
    <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
    <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
  </svg>)


interface AssetslistProps {}



const Assetslist: React.FC<AssetslistProps> = () =>{
    const [db, setDb] = useState(null);
    const [selectedAudio, setSelectedAudio] = useState(null);
    const [savedAudios, setSavedAudios] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [activePlayers, setActivePlayers] = useState([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Efeito para inicializar o IndexedDB
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const request = indexedDB.open('audioDatabase', 1);

        request.onerror = (event) => {
        console.error("Erro ao abrir o IndexedDB:", event.target?.error);
        setMessage('Erro ao carregar o banco de dados local.');
        setIsLoading(false);
        };

        request.onsuccess = (event) => {
        const database = event.target?.result;
        setDb(database);
        loadAudios(database);
        };

        request.onupgradeneeded = (event) => {
        const database = event.target?.result;
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

  const handleDrop = (e) => {
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


    return (
        <div className="bg-gray-100 p-1 pt-4 max-w-45">
            {isLoading ? (
              <p className="text-center text-gray-400">Carregando áudios...</p>
            ) : savedAudios.length > 0 ? (
              <ul className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                {savedAudios.map((audio) => (
                  <li
                    key={audio.id}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, audio)}
                    className="p-1 flex items-center gap-4 cursor-grab active:cursor-grabbing animate-fade-in"
                  >
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <DragHandleIcon />
                      <div className="flex-grow min-w-0">
                        <p className="font-medium truncate" title={audio.name}>{audio.name}</p>
                        <p className="text-xs text-gray-400">Salvo em: {new Date(audio.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-400 py-8">Sua biblioteca está vazia.</p>
            )}
          </div>
    )
}

export default Assetslist;