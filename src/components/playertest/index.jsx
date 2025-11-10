import React, { useState, useRef, useEffect, useCallback } from 'react';

const AudioPlayer = () => {
    // Refs para acessar elementos do DOM diretamente
    const audioRef = useRef(null);
    const progressBarRef = useRef(null);
    const draggingHandleRef = useRef(null);

    // Estado para gerenciar a UI e a lógica do player
    const [trackName, setTrackName] = useState('Nenhuma faixa carregada');
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLooping, setIsLooping] = useState(false);
    
    // Usamos refs para os tempos de loop para evitar re-renderizações durante o arraste
    const loopStartTimeRef = useRef(0);
    const loopEndTimeRef = useRef(0);
    
    // Estado para forçar a atualização da UI do tempo de loop
    const [loopUi, setLoopUi] = useState({ start: 0, end: 0 });

    // --- FUNÇÕES AUXILIARES ---
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // --- MANIPULADORES DE EVENTO DO PLAYER ---

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const objectURL = URL.createObjectURL(file);
            audioRef.current.src = objectURL;
            setTrackName(file.name);
            audioRef.current.load();
        }
    };

    const onLoadedMetadata = () => {
        const audioDuration = audioRef.current.duration;
        setDuration(audioDuration);
        loopEndTimeRef.current = audioDuration;
        setLoopUi({ start: 0, end: audioDuration });
        setIsReady(true);
    };

    const onTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        setCurrentTime(current);

        if (isLooping && (current >= loopEndTimeRef.current || current < loopStartTimeRef.current)) {
            audioRef.current.currentTime = loopStartTimeRef.current;
        }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const togglePlayPause = () => {
        if (!isReady) return;
        const audio = audioRef.current;
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    };
    
    const handleProgressClick = (event) => {
        if (!isReady || event.target.classList.contains('loop-handle')) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickPositionX = event.clientX - rect.left;
        const seekTime = (clickPositionX / rect.width) * duration;
        audioRef.current.currentTime = seekTime;
    };

    // --- LÓGICA DE ARRASTAR OS SELETORES (HANDLES) ---

    const updateLoopRangeVisual = useCallback(() => {
        setLoopUi({ start: loopStartTimeRef.current, end: loopEndTimeRef.current });
    }, []);

    const handleDragMove = useCallback((e) => {
        if (draggingHandleRef.current === null) return;
        e.preventDefault();

        const rect = progressBarRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let positionX = clientX - rect.left;
        let percent = (positionX / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));

        const newTime = (percent / 100) * duration;

        if (draggingHandleRef.current === 'start') {
            loopStartTimeRef.current = Math.min(newTime, loopEndTimeRef.current);
        } else {
            loopEndTimeRef.current = Math.max(newTime, loopStartTimeRef.current);
        }
        updateLoopRangeVisual();
    }, [duration, updateLoopRangeVisual]);
    
    const handleDragEnd = useCallback(() => {
        draggingHandleRef.current = null;
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchmove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchend', handleDragEnd);

        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, [handleDragMove, handleDragEnd]);


    // --- CÁLCULOS PARA RENDERIZAÇÃO ---
    const progressPercent = (currentTime / duration) * 100 || 0;
    const startHandlePercent = (loopUi.start / duration) * 100 || 0;
    const endHandlePercent = (loopUi.end / duration) * 100 || 0;

    return (
        <>
            {/* O link para o Font Awesome deve ser adicionado no seu arquivo _app.js ou _document.js 
              para ser carregado globalmente em sua aplicação Next.js.
              Exemplo para _document.js:
              <Head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
              </Head>
            */}
            <style jsx="true" global="true">{`
                body {
                    -webkit-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
            `}</style>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 w-full max-w-md mx-auto shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">Player de Áudio</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 truncate">{trackName}</p>

                <audio
                    ref={audioRef}
                    onLoadedMetadata={onLoadedMetadata}
                    onTimeUpdate={onTimeUpdate}
                    onPlay={onPlay}
                    onPause={onPause}
                    className="hidden"
                />

                <div className="mb-4 pt-2">
                    <div
                        ref={progressBarRef}
                        onClick={handleProgressClick}
                        className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 cursor-pointer relative group"
                    >
                        {/* Highlight do Range do Loop */}
                        <div
                            id="loop-range"
                            className={`absolute h-full z-10 pointer-events-none rounded-full ${isLooping ? 'bg-blue-500/50' : 'bg-blue-500/30'}`}
                            style={{ left: `${startHandlePercent}%`, width: `${endHandlePercent - startHandlePercent}%` }}
                        />
                        {/* Progresso da música */}
                        <div
                            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full relative group-hover:bg-green-500"
                            style={{ width: `${progressPercent}%` }}
                        >
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 bg-white dark:bg-gray-300 rounded-full absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 shadow-lg" />
                        </div>
                        {/* Seletores de Loop */}
                        <div
                            id="start-handle"
                            onMouseDown={() => draggingHandleRef.current = 'start'}
                            onTouchStart={() => draggingHandleRef.current = 'start'}
                            className="loop-handle"
                            style={{ left: `${startHandlePercent}%` }}
                        >
                            <div className="loop-handle-line" />
                        </div>
                        <div
                            id="end-handle"
                            onMouseDown={() => draggingHandleRef.current = 'end'}
                            onTouchStart={() => draggingHandleRef.current = 'end'}
                            className="loop-handle"
                            style={{ left: `${endHandlePercent}%` }}
                        >
                            <div className="loop-handle-line" />
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-center space-x-6 mb-6">
                    <button onClick={togglePlayPause} disabled={!isReady} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-3xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                    </button>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3 text-center">Loop de Trecho</h3>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3 h-4">
                        {isReady ? `Loop: ${formatTime(loopUi.start)} - ${formatTime(loopUi.end)}` : ''}
                    </p>
                    <button onClick={() => setIsLooping(!isLooping)} disabled={!isReady} className={`w-full text-white py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${isLooping ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-500 dark:bg-gray-600'}`}>
                        <i className={`fas fa-sync-alt ${isLooping ? 'animate-spin' : ''}`}></i>
                        <span>{isLooping ? 'Desativar Loop' : 'Ativar Loop'}</span>
                    </button>
                </div>
                
                <div className="mt-6">
                    <label htmlFor="file-input" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center">
                        <i className="fas fa-folder-open mr-2"></i>
                        Carregar Áudio
                    </label>
                    <input type="file" id="file-input" onChange={handleFileChange} accept="audio/*" className="hidden" />
                </div>
            </div>
            
            {/* Estilos para os seletores de loop */}
            <style jsx="true">{`
                .loop-handle {
                    position: absolute;
                    top: -6px;
                    width: 12px;
                    height: 28px;
                    background-color: rgba(255, 255, 255, 0.8);
                    border: 2px solid #4A90E2;
                    border-radius: 4px;
                    cursor: ew-resize;
                    transform: translateX(-50%);
                    z-index: 20;
                    box-shadow: 0px 0px 5px rgba(0,0,0,0.3);
                }
                .loop-handle-line {
                    width: 2px;
                    height: 12px;
                    background-color: #4A90E2;
                    margin: 0 auto;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
            `}</style>
        </>
    );
};

export default AudioPlayer;

