import React, { useState, useRef, useCallback, useEffect } from 'react';

// --- Constantes do Canvas ---

// Define o tamanho total do "mundo" do seu canvas
const CANVAS_WORLD_WIDTH = 2000;
const CANVAS_WORLD_HEIGHT = 1500;

// Define os limites de zoom
// const MIN_ZOOM = 0.2; // REMOVIDO: Agora é dinâmico
const MAX_ZOOM = 4;   // 400%

// Define a "largura" de visualização base para o nível de zoom 1x
// A altura será calculada dinamicamente
const INITIAL_VIEWBOX_WIDTH = 800;

// --- Componente Principal ---

export default function App() {
  // Referência ao elemento SVG principal
  const svgRef = useRef(null);

  // Estado para o viewBox (controla pan e zoom)
  // { x, y, width, height }
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: INITIAL_VIEWBOX_WIDTH,
    height: INITIAL_VIEWBOX_WIDTH / (16/9), // Começa com um aspect ratio 16:9 (será atualizado no useEffect)
  });

  // Estado para o nível de zoom atual (para facilitar os cálculos)
  const [zoomLevel, setZoomLevel] = useState(1);

  // Estado para os objetos no canvas
  const [objects, setObjects] = useState([
    { id: 'obj1', x: 100, y: 100, width: 150, height: 100, fill: '#3b82f6' },
    { id: 'obj2', x: 300, y: 250, width: 80, height: 120, fill: '#10b981' },
  ]);

  // Estado para controlar o arraste de objetos
  // Guarda os detalhes do objeto que está a ser arrastado
  const [draggingObject, setDraggingObject] = useState(null); // null | { id, startX, startY, initialX, initialY }

  // Estado para controlar o pan (arraste do canvas)
  const [isPanning, setIsPanning] = useState(null); // null | { startX, startY, initialViewBoxX, initialViewBoxY }

  /**
   * Converte coordenadas da tela (ex: e.clientX) para coordenadas do mundo SVG.
   */
  const getScreenToWorldPoint = useCallback((clientX, clientY) => {
    if (!svgRef.current) return null;

    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    
    // Transforma o ponto usando a matriz de transformação inversa do SVG
    const worldPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    return worldPoint;
  }, [svgRef]);

  /**
   * Função para ajustar o viewBox ao tamanho atual do SVG na tela.
   * Isso garante que o canvas preencha a tela sem "letterboxing" e o zoom inicial esteja correto.
   */
  const adjustViewBoxToScreen = useCallback(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const screenWidth = svg.clientWidth;
    const screenHeight = svg.clientHeight;

    if (screenWidth === 0 || screenHeight === 0) return;

    const screenAspectRatio = screenWidth / screenHeight;
    const worldAspectRatio = CANVAS_WORLD_WIDTH / CANVAS_WORLD_HEIGHT;

    // --- Cálculo do Zoom Mínimo Dinâmico (Modo "FILL" / "COVER") ---
    let minZoomViewBoxWidth;
    if (worldAspectRatio > screenAspectRatio) {
      // Mundo é mais largo que a tela (ex: 4:3 em tela 9:16). Ajusta pela altura.
      // O viewBoxHeight deve ser 1500 (altura do mundo).
      const minZoomViewBoxHeight = CANVAS_WORLD_HEIGHT;
      // Calcula a largura que o viewBox teria nessa altura, mantendo o aspect ratio da tela.
      minZoomViewBoxWidth = minZoomViewBoxHeight * screenAspectRatio;
    } else {
      // Mundo é mais alto que a tela (ex: 4:3 em tela 16:9). Ajusta pela largura.
      // O viewBoxWidth deve ser 2000 (largura do mundo).
      minZoomViewBoxWidth = CANVAS_WORLD_WIDTH;
    }
    // O zoom mínimo é o que resulta nesse viewBoxWidth.
    const newMinZoom = INITIAL_VIEWBOX_WIDTH / minZoomViewBoxWidth;
    // --- Fim do Cálculo ---

    // Garante que o zoomLevel atual não é menor que o novo minZoom
    // Se for (ex: após redimensionar), atualiza o estado do zoomLevel e usa o novo valor
    let effectiveZoomLevel = zoomLevel;
    if (zoomLevel < newMinZoom) {
        effectiveZoomLevel = newMinZoom;
        setZoomLevel(newMinZoom); // Atualiza o estado
    }

    // Calcula as novas dimensões com base no *effectiveZoomLevel*
    const newWidth = INITIAL_VIEWBOX_WIDTH / effectiveZoomLevel;
    const newHeight = newWidth / screenAspectRatio;

    // Usa a atualização funcional do setViewBox para obter o estado atual (currentViewBox)
    // e evitar depender de 'viewBox.x' ou 'viewBox.y'
    setViewBox(currentViewBox => {
      // Garante que o viewBox não seja maior que o mundo, ou centraliza se for
      let newX = currentViewBox.x;
      let newY = currentViewBox.y;

      if (newWidth >= CANVAS_WORLD_WIDTH) {
        newX = (CANVAS_WORLD_WIDTH - newWidth) / 2;
      } else {
        newX = Math.max(0, Math.min(newX, CANVAS_WORLD_WIDTH - newWidth));
      }

      if (newHeight >= CANVAS_WORLD_HEIGHT) {
        newY = (CANVAS_WORLD_HEIGHT - newHeight) / 2;
      } else {
        newY = Math.max(0, Math.min(newY, CANVAS_WORLD_HEIGHT - newHeight));
      }

      // Retorna o novo estado do viewBox
      return { x: newX, y: newY, width: newWidth, height: newHeight };
    });
    // Não chamamos setZoomLevel aqui, pois já foi feito acima se necessário
  }, [zoomLevel]); // A dependência de zoomLevel está correta


  // Efeito para ajustar o viewBox na montagem e no redimensionamento
  useEffect(() => {
    adjustViewBoxToScreen();
    window.addEventListener('resize', adjustViewBoxToScreen);
    return () => window.removeEventListener('resize', adjustViewBoxToScreen);
  }, [adjustViewBoxToScreen]); // O useEffect depende da função, que por sua vez depende de zoomLevel


  /**
   * Manipulador de Zoom (Roda do Rato)
   */
  const handleWheel = useCallback((e) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    
    // Lê as dimensões REAIS do SVG na tela
    const screenWidth = svg.clientWidth;
    const screenHeight = svg.clientHeight;
    if (screenWidth === 0 || screenHeight === 0) return; // Evita divisão por zero
    // Calcula o aspect ratio REAL da tela
    const screenAspectRatio = screenWidth / screenHeight;
    const worldAspectRatio = CANVAS_WORLD_WIDTH / CANVAS_WORLD_HEIGHT;

    // --- Cálculo do Zoom Mínimo Dinâmico (Modo "FILL" / "COVER") ---
    let minZoomViewBoxWidth;
    if (worldAspectRatio > screenAspectRatio) {
      // Mundo é mais largo que a tela. Ajusta pela altura (para "preencher").
      // O viewBoxHeight deve ser 1500.
      const minZoomViewBoxHeight = CANVAS_WORLD_HEIGHT;
      // Calcula a largura que o viewBox teria nessa altura, mantendo o aspect ratio da tela.
      minZoomViewBoxWidth = minZoomViewBoxHeight * screenAspectRatio;
    } else {
      // Mundo é mais alto que a tela. Ajusta pela largura (para "preencher").
      // O viewBoxWidth deve ser 2000.
      minZoomViewBoxWidth = CANVAS_WORLD_WIDTH;
    }
    // O zoom mínimo é o que resulta nesse viewBoxWidth.
    const newMinZoom = INITIAL_VIEWBOX_WIDTH / minZoomViewBoxWidth;
    // --- Fim do Cálculo ---

    const zoomDirection = e.deltaY > 0 ? 1.1 : 0.9; // Fator de zoom
    
    // Calcula o novo nível de zoom e garante que está dentro dos limites
    const newZoomLevel = zoomLevel * zoomDirection;
    
    // Usa o newMinZoom calculado em vez de um MIN_ZOOM estático
    const clampedZoom = Math.max(newMinZoom, Math.min(MAX_ZOOM, newZoomLevel));

    if (clampedZoom === zoomLevel) return; // Não faz nada se o zoom estiver no limite

    const worldPoint = getScreenToWorldPoint(e.clientX, e.clientY);
    if (!worldPoint) return;

    // Calcula as novas dimensões do viewBox
    // A largura é baseada no zoom
    const newWidth = INITIAL_VIEWBOX_WIDTH / clampedZoom;
    
    // A altura é calculada usando o aspect ratio DA TELA
    const newHeight = newWidth / screenAspectRatio;

    // Calcula o novo (x, y) do viewBox para que o ponto sob o rato permaneça no lugar
    const mouseRatioX = (worldPoint.x - viewBox.x) / viewBox.width;
    const mouseRatioY = (worldPoint.y - viewBox.y) / viewBox.height;

    let newX = worldPoint.x - (mouseRatioX * newWidth);
    let newY = worldPoint.y - (mouseRatioY * newHeight);

    // --- Verificação de Limites do Canvas (Pan/Zoom) ---
    // Lógica para X (Largura)
    if (newWidth >= CANVAS_WORLD_WIDTH) {
      // Zoomed OUT (viewbox é mais largo que o mundo)
      // Centraliza o mundo
      newX = (CANVAS_WORLD_WIDTH - newWidth) / 2;
    } else {
      // Zoomed IN (viewbox é mais estreito que o mundo)
      // Impede que o viewbox saia dos limites 0 e LARGURA_MUNDO
      newX = Math.max(0, Math.min(newX, CANVAS_WORLD_WIDTH - newWidth));
    }

    // Lógica para Y (Altura)
    if (newHeight >= CANVAS_WORLD_HEIGHT) {
      // Zoomed OUT
      // Centraliza o mundo
      newY = (CANVAS_WORLD_HEIGHT - newHeight) / 2;
    } else {
      // Zoomed IN
      // Impede que o viewbox saia dos limites 0 e ALTURA_MUNDO
      newY = Math.max(0, Math.min(newY, CANVAS_WORLD_HEIGHT - newHeight));
    }

    // Atualiza o estado
    setZoomLevel(clampedZoom);
    setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });

  }, [viewBox, zoomLevel, getScreenToWorldPoint]);

  /**
   * Inicia o arraste de um objeto
   */
  const handleObjectMouseDown = useCallback((e, objectId) => {
    e.preventDefault();
    e.stopPropagation(); // Impede que o mousedown ative o pan do canvas

    const obj = objects.find(o => o.id === objectId);
    if (!obj) return;

    const startPoint = getScreenToWorldPoint(e.clientX, e.clientY);
    if (!startPoint) return;

    // Guarda o estado inicial do arraste
    setDraggingObject({
      id: objectId,
      startX: startPoint.x, // Posição do rato no mundo
      startY: startPoint.y,
      initialX: obj.x, // Posição inicial do objeto
      initialY: obj.y,
    });
  }, [objects, getScreenToWorldPoint]);

  /**
   * Inicia o pan (arraste do canvas)
   */
  const handleSvgMouseDown = useCallback((e) => {
    e.preventDefault();
    // Só inicia o pan se não estivermos a clicar num objeto (o draggingObject será null)
    if (draggingObject) return;

    setIsPanning({
      startX: e.clientX, // Posição do rato na tela
      startY: e.clientY,
      initialViewBoxX: viewBox.x, // Posição inicial do viewBox
      initialViewBoxY: viewBox.y,
    });
  }, [draggingObject, viewBox.x, viewBox.y]);

  /**
   * Manipulador de Movimento do Rato (para Pan e Arraste de Objeto)
   */
  const handleMouseMove = useCallback((e) => {
    e.preventDefault();

    // --- Lógica de Arraste de Objeto ---
    if (draggingObject) {
      const worldPoint = getScreenToWorldPoint(e.clientX, e.clientY);
      if (!worldPoint) return;
      
      const { id, startX, startY, initialX, initialY } = draggingObject;
      
      // Calcula o quanto o rato se moveu no mundo
      const dx = worldPoint.x - startX;
      const dy = worldPoint.y - startY;

      // Calcula a nova posição do objeto
      let newX = initialX + dx;
      let newY = initialY + dy;

      const obj = objects.find(o => o.id === id);
      if (!obj) return;

      // --- Verificação de Limites do Objeto ---
      // Impede que o objeto saia para fora do mundo do canvas
      newX = Math.max(0, Math.min(newX, CANVAS_WORLD_WIDTH - obj.width));
      newY = Math.max(0, Math.min(newY, CANVAS_WORLD_HEIGHT - obj.height));

      // Atualiza o estado dos objetos
      setObjects(prevObjects =>
        prevObjects.map(o =>
          o.id === id ? { ...o, x: newX, y: newY } : o
        )
      );
    }
    // --- Lógica de Pan do Canvas ---
    else if (isPanning) {
      if (!svgRef.current) return;
      
      const svg = svgRef.current;
      const screenWidth = svg.clientWidth;
      if (screenWidth === 0) return;

      const { startX, startY, initialViewBoxX, initialViewBoxY } = isPanning;

      // Calcula o delta do movimento na tela
      const dx_screen = e.clientX - startX;
      const dy_screen = e.clientY - startY;

      // Converte o delta da tela para o delta do mundo
      const scale = viewBox.width / screenWidth; // Usa o screenWidth lido
      const dx_world = dx_screen * scale;
      const dy_world = dy_screen * scale;

      // O pan move o viewBox na direção oposta ao rato
      let newX = initialViewBoxX - dx_world;
      let newY = initialViewBoxY - dy_world;

      // --- Verificação de Limites do Canvas (Pan) ---
      // Aplica a mesma lógica de limites do zoom
      // Lógica para X
      if (viewBox.width >= CANVAS_WORLD_WIDTH) {
        newX = (CANVAS_WORLD_WIDTH - viewBox.width) / 2;
      } else {
        newX = Math.max(0, Math.min(newX, CANVAS_WORLD_WIDTH - viewBox.width));
      }
      // Lógica para Y
      if (viewBox.height >= CANVAS_WORLD_HEIGHT) {
        newY = (CANVAS_WORLD_HEIGHT - viewBox.height) / 2;
      } else {
        newY = Math.max(0, Math.min(newY, CANVAS_WORLD_HEIGHT - viewBox.height));
      }

      setViewBox(prev => ({ ...prev, x: newX, y: newY }));
    }
  }, [draggingObject, isPanning, getScreenToWorldPoint, objects, viewBox.width, viewBox.height]);

  /**
   * Manipulador de Soltar o Rato (Termina Pan e Arraste)
   */
  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    setDraggingObject(null); // Termina o arraste
    setIsPanning(null); // Termina o pan
  }, []);

  // --- Efeito para adicionar e remover listeners globais ---
  // Usamos listeners no 'window' para 'mousemove' e 'mouseup'
  // para que o arraste continue mesmo se o rato sair do SVG.
  useEffect(() => {
    if (draggingObject || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingObject, isPanning, handleMouseMove, handleMouseUp]);

  // --- Renderização ---
  return (
    // O div principal agora preenche a tela e esconde qualquer estouro
    <div className="w-screen h-screen overflow-hidden bg-gray-900">
      {/* O SVG preenche totalmente o div principal */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-white"
        // O viewBox é controlado pelo estado
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onWheel={handleWheel}
        onMouseDown={handleSvgMouseDown}
        // Define preserveAspectRatio para garantir que o viewBox preenche o SVG completamente
        // e se ajusta ao aspect ratio do contêiner.
        preserveAspectRatio="xMidYMid meet"
      >
        {/* --- Definições de Padrões (Pattern Definitions) --- */}
        <defs>
          <pattern
            id="dot-grid"
            x="0"
            y="0"
            width="50" // Espaçamento entre os pontos horizontalmente
            height="50" // Espaçamento entre os pontos verticalmente
            patternUnits="userSpaceOnUse" // Garante que o padrão não escala com o zoom do viewBox
          >
            <circle cx="2" cy="2" r="1.5" fill="#a0aec0" /> {/* O ponto em si */}
            <circle cx="27" cy="2" r="1.5" fill="#a0aec0" />
            <circle cx="2" cy="27" r="1.5" fill="#a0aec0" />
            <circle cx="27" cy="27" r="1.5" fill="#a0aec0" />
          </pattern>
        </defs>

        {/* Fundo que define os limites do "mundo" */}
        <rect
          x="0"
            y="0"
            width={CANVAS_WORLD_WIDTH}
            height={CANVAS_WORLD_HEIGHT}
            // Usa o padrão de pontos para preencher o fundo
            fill="url(#dot-grid)" 
            stroke="#cbd5e1"
          strokeWidth="2"
        />

        {/* Renderiza todos os objetos */}
          {objects.map(obj => (
          <rect
            key={obj.id}
              x={obj.x}
              y={obj.y}
              width={obj.width}
              height={obj.height}
              fill={obj.fill}
              stroke="#1e293b"
              strokeWidth="2"
            className="cursor-move"
            onMouseDown={(e) => handleObjectMouseDown(e, obj.id)}
          />
        ))}
      </svg>
    </div>
  );
}