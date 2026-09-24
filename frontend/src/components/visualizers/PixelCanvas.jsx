import React, { useRef, useEffect } from 'react';

export default function PixelCanvas({
  matrix,
  colorGrid,
  hoveredCell,
  onHoverCell,
  onClickCell,
  highlightColor = '#3B82F6',
  pixelSize = 72,
  title = "Digital Image Canvas"
}) {
  const canvasRef = useRef(null);

  const rows = matrix ? matrix.length : colorGrid ? colorGrid.length : 0;
  const cols = matrix ? matrix[0].length : colorGrid ? colorGrid[0].length : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows || !cols) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const width = cols * pixelSize;
    const height = rows * pixelSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // 1. Draw solid pixel fill boxes
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let fillStyle = '#000000';
        if (matrix) {
          const v = matrix[r][c];
          fillStyle = `rgb(${v}, ${v}, ${v})`;
        } else if (colorGrid) {
          const pixel = colorGrid[r][c];
          fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
      }
    }

    // 2. Draw sharp adaptive grid lines on top of all pixels
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let brightness = 0;
        if (matrix) {
          brightness = matrix[r][c];
        } else if (colorGrid) {
          const pixel = colorGrid[r][c];
          brightness = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b;
        }

        // Adaptive high contrast grid stroke for both black (0) and white (255) pixels
        if (brightness < 75) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)'; // High visibility light line on black/dark
        } else if (brightness > 180) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'; // High visibility dark line on white/light
        } else {
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.32)';
        }

        ctx.lineWidth = 1;
        // Inset by 0.5px so outer edge lines are strictly inside canvas bounds and never clipped
        ctx.strokeRect(c * pixelSize + 0.5, r * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);

        // Highlight hovered or selected cell
        if (hoveredCell && hoveredCell.row === r && hoveredCell.col === c) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = highlightColor;
          ctx.strokeRect(c * pixelSize + 1.5, r * pixelSize + 1.5, pixelSize - 3, pixelSize - 3);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.22)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.restore();
  }, [matrix, colorGrid, hoveredCell, rows, cols, pixelSize, highlightColor]);

  const getCellFromEvent = (e) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / pixelSize);
    const row = Math.floor(y / pixelSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col, x: e.clientX, y: e.clientY };
    }
    return null;
  };

  const handleMouseMove = (e) => {
    if (!onHoverCell) return;
    const cell = getCellFromEvent(e);
    onHoverCell(cell);
  };

  const handleClick = (e) => {
    const cell = getCellFromEvent(e);
    if (cell && onClickCell) {
      onClickCell(cell);
    }
  };

  const handleMouseLeave = () => {
    if (onHoverCell) onHoverCell(null);
  };

  return (
    <div className="canvas-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <div className="canvas-header" style={{ marginBottom: '1rem' }}>
          <h3>{title}</h3>
        </div>
        <div 
          className="canvas-wrapper" 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'center', 
            width: '100%', 
            margin: 'auto 0', 
            padding: 0,
            cursor: 'pointer' 
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
            className="pixel-canvas"
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
}
