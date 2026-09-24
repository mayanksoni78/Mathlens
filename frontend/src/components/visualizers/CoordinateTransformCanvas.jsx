import React, { useRef, useEffect, useState } from 'react';
import { transformPoint, computeDeterminant, getDeterminantAnalysis, drawProceduralSubject } from '../../core/transformEngine';

export default function CoordinateTransformCanvas({ 
  matrix2x2,
  subjectType = null, // null for pure vectors, or 'portrait' | 'geometry' | 'rocket' | 'custom'
  customImage = null,
  showImage = Boolean(subjectType),
  showParallelogram = true,
  showBasisVectors = true,
  showGhostOutline = true,
  showGrid = true,
  showOrientationArc = true,
  title = "Vector Transformation Plot (X' = AX)",
  subtitle = "Grid: 1 unit = 45px",
  onHoverCoords = null
}) {
  const canvasRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  // Extract entries safely whether matrix2x2 is object {a,b,c,d} or 2D array [[a,b],[c,d]]
  const a = matrix2x2 && typeof matrix2x2.a === 'number' && !isNaN(matrix2x2.a)
    ? matrix2x2.a
    : (Array.isArray(matrix2x2) && matrix2x2[0] ? matrix2x2[0][0] : 1);
  const b = matrix2x2 && typeof matrix2x2.b === 'number' && !isNaN(matrix2x2.b)
    ? matrix2x2.b
    : (Array.isArray(matrix2x2) && matrix2x2[0] ? matrix2x2[0][1] : 0);
  const c = matrix2x2 && typeof matrix2x2.c === 'number' && !isNaN(matrix2x2.c)
    ? matrix2x2.c
    : (Array.isArray(matrix2x2) && matrix2x2[1] ? matrix2x2[1][0] : 0);
  const d = matrix2x2 && typeof matrix2x2.d === 'number' && !isNaN(matrix2x2.d)
    ? matrix2x2.d
    : (Array.isArray(matrix2x2) && matrix2x2[1] ? matrix2x2[1][1] : 1);

  const safeMatrix = { a, b, c, d };
  const rawDet = computeDeterminant(safeMatrix);
  const detAnalysis = getDeterminantAnalysis(rawDet);

  const drawArrow = (ctx, fromX, fromY, toX, toY, color, width = 3, label = '') => {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();

    if (label) {
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(label, toX + Math.cos(angle) * 14, toY + Math.sin(angle) * 14);
    }
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // Set higher canvas resolution for sharp rendering
    const width = canvas.width = 720;
    const height = canvas.height = 520;

    const centerX = width / 2;
    const centerY = height / 2;
    const unitStep = 45; // 45px per 1 mathematical grid unit

    const toScreen = (p) => ({
      x: centerX + p.x * unitStep,
      y: centerY - p.y * unitStep
    });

    // Clear background
    ctx.fillStyle = isLight ? '#F8FAFC' : '#06080E';
    ctx.fillRect(0, 0, width, height);

    const gridUnitsX = Math.floor((width / 2) / unitStep);
    const gridUnitsY = Math.floor((height / 2) / unitStep);

    // 1. Standard static Cartesian grid lines
    if (showGrid) {
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = -gridUnitsX; i <= gridUnitsX; i++) {
        if (i === 0) continue;
        const x = centerX + i * unitStep;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let j = -gridUnitsY; j <= gridUnitsY; j++) {
        if (j === 0) continue;
        const y = centerY + j * unitStep;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // 2. Transformed Grid Lines (Deformed coordinate web)
    if (showGrid && (a !== 1 || b !== 0 || c !== 0 || d !== 1)) {
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let i = -4; i <= 4; i++) {
        const startPoint = toScreen(transformPoint(safeMatrix, { x: i, y: -4 }));
        const endPoint = toScreen(transformPoint(safeMatrix, { x: i, y: 4 }));
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
      }
      for (let j = -4; j <= 4; j++) {
        const startPoint = toScreen(transformPoint(safeMatrix, { x: -4, y: j }));
        const endPoint = toScreen(transformPoint(safeMatrix, { x: 4, y: j }));
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Main Cartesian Axes X & Y with Glow
    ctx.save();
    ctx.shadowColor = '#2563EB';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, centerY);
    ctx.lineTo(width - 15, centerY);
    ctx.moveTo(centerX, 15);
    ctx.lineTo(centerX, height - 15);
    ctx.stroke();
    ctx.restore();

    // Axis Arrow Tips
    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.moveTo(width - 12, centerY - 5);
    ctx.lineTo(width - 2, centerY);
    ctx.lineTo(width - 12, centerY + 5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX - 5, 12);
    ctx.lineTo(centerX, 2);
    ctx.lineTo(centerX + 5, 12);
    ctx.fill();

    // 4. Ghost Outline of Original Image / Unit Region (Untransformed Identity)
    if (showGhostOutline && showImage) {
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(100, 116, 139, 0.35)' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      const halfBox = 1.8 * unitStep;
      ctx.strokeRect(centerX - halfBox, centerY - halfBox, halfBox * 2, halfBox * 2);
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = isLight ? 'rgba(100, 116, 139, 0.6)' : 'rgba(148, 163, 184, 0.4)';
      ctx.fillText('Original 2D Boundary', centerX - halfBox + 6, centerY - halfBox + 14);
      ctx.restore();
    }

    // 5. Draw Transformed Subject Image (x' = Ax)
    if (showImage && subjectType) {
      ctx.save();
      ctx.translate(centerX, centerY);
      // Canvas affine matrix: m11=a, m12=-c, m21=-b, m22=d (accounting for screen Y inversion)
      ctx.transform(a, -c, -b, d, 0, 0);

      if (subjectType === 'custom' && customImage && customImage.complete && customImage.naturalWidth > 0) {
        const imgSize = 3.6 * unitStep;
        ctx.drawImage(customImage, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-imgSize / 2, -imgSize / 2, imgSize, imgSize);
      } else {
        drawProceduralSubject(ctx, subjectType, unitStep, isLight);
      }
      ctx.restore();
    }

    // 6. If det(A) == 0 (Dimension Collapse to Line or Point), render singularity subspace line!
    if (detAnalysis.type === 'collapse') {
      ctx.save();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowBlur = 12;

      // Determine collapse line direction vector (from non-zero column)
      let dirX = a;
      let dirY = c;
      if (Math.abs(dirX) < 1e-4 && Math.abs(dirY) < 1e-4) {
        dirX = b;
        dirY = d;
      }

      if (Math.abs(dirX) > 1e-4 || Math.abs(dirY) > 1e-4) {
        const len = Math.hypot(dirX, dirY);
        const uX = dirX / len;
        const uY = dirY / len;
        const span = 800;
        const p1 = toScreen({ x: -span * uX, y: -span * uY });
        const p2 = toScreen({ x: span * uX, y: span * uY });

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Label on collapse line
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#EF4444';
        const labelPos = toScreen({ x: 2.2 * uX, y: 2.2 * uY });
        ctx.fillText('1D Collapse Subspace (Area = 0)', labelPos.x + 8, labelPos.y - 8);
      } else {
        // Complete collapse to 0D point (all zeros)
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillText('0D Point Singularity (Origin)', centerX + 12, centerY - 12);
      }
      ctx.restore();
    }

    // 7. Transformed Unit Square Parallelogram for det(A) Area Visualizer
    const origin = toScreen({ x: 0, y: 0 });
    const iHatTransformed = toScreen(transformPoint(safeMatrix, { x: 1, y: 0 }));
    const jHatTransformed = toScreen(transformPoint(safeMatrix, { x: 0, y: 1 }));
    const cornerTransformed = toScreen(transformPoint(safeMatrix, { x: 1, y: 1 }));

    if (showParallelogram && detAnalysis.type !== 'collapse') {
      ctx.save();
      // Match color to determinant status
      let fillCol = isLight ? 'rgba(59, 130, 246, 0.18)' : 'rgba(56, 189, 248, 0.2)';
      let strokeCol = isLight ? 'rgba(59, 130, 246, 0.6)' : 'rgba(56, 189, 248, 0.6)';

      if (detAnalysis.orientationFlipped) {
        fillCol = isLight ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.25)';
        strokeCol = isLight ? 'rgba(168, 85, 247, 0.7)' : 'rgba(168, 85, 247, 0.8)';
      } else if (detAnalysis.type === 'stretch') {
        fillCol = isLight ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.22)';
        strokeCol = isLight ? 'rgba(16, 185, 129, 0.7)' : 'rgba(16, 185, 129, 0.7)';
      } else if (detAnalysis.type === 'shrink') {
        fillCol = isLight ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.25)';
        strokeCol = isLight ? 'rgba(245, 158, 11, 0.7)' : 'rgba(245, 158, 11, 0.7)';
      }

      ctx.fillStyle = fillCol;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(iHatTransformed.x, iHatTransformed.y);
      ctx.lineTo(cornerTransformed.x, cornerTransformed.y);
      ctx.lineTo(jHatTransformed.x, jHatTransformed.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Label parallelogram center with area value
      const centerP = {
        x: (origin.x + cornerTransformed.x) / 2,
        y: (origin.y + cornerTransformed.y) / 2
      };
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = strokeCol;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Area = |det| = ${Math.abs(rawDet).toFixed(2)}`, centerP.x, centerP.y);
      ctx.restore();
    }

    // 8. Original Basis Ghosts
    if (showBasisVectors) {
      const origIHat = toScreen({ x: 1, y: 0 });
      const origJHat = toScreen({ x: 0, y: 1 });
      drawArrow(ctx, origin.x, origin.y, origIHat.x, origIHat.y, 'rgba(236, 72, 153, 0.35)', 2, 'i');
      drawArrow(ctx, origin.x, origin.y, origJHat.x, origJHat.y, 'rgba(16, 185, 129, 0.35)', 2, 'j');

      // Transformed i-hat Vector [a, c]^T
      drawArrow(ctx, origin.x, origin.y, iHatTransformed.x, iHatTransformed.y, '#EC4899', 3.5, "i'=[a,c]");

      // Transformed j-hat Vector [b, d]^T
      drawArrow(ctx, origin.x, origin.y, jHatTransformed.x, jHatTransformed.y, '#10B981', 3.5, "j'=[b,d]");
    }

    // 9. Orientation Chirality Arc (shows rotation from i' to j')
    if (showOrientationArc && detAnalysis.type !== 'collapse') {
      const angI = Math.atan2(origin.y - iHatTransformed.y, iHatTransformed.x - origin.x);
      const angJ = Math.atan2(origin.y - jHatTransformed.y, jHatTransformed.x - origin.x);

      ctx.save();
      const arcRadius = 32;
      const isNegative = rawDet < 0;
      ctx.strokeStyle = isNegative ? '#A855F7' : '#06B6D4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // In canvas coordinates, draw arc between angles
      ctx.arc(origin.x, origin.y, arcRadius, -angI, -angJ, !isNegative);
      ctx.stroke();

      // Chirality badge
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = isNegative ? '#A855F7' : '#06B6D4';
      ctx.fillText(
        isNegative ? 'CW: Inverted (-)' : 'CCW: Standard (+)',
        origin.x + (isNegative ? -85 : 42),
        origin.y - 28
      );
      ctx.restore();
    }

    // 10. Axis Tick Labels with Pill Backdrops
    ctx.font = '600 11px "JetBrains Mono", monospace';
    for (let i = -gridUnitsX + 1; i <= gridUnitsX - 1; i++) {
      if (i === 0) continue;
      const posX = centerX + i * unitStep;
      const posY = centerY + 18;
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(6, 8, 14, 0.85)';
      ctx.fillRect(posX - 10, posY - 7, 20, 14);
      ctx.fillStyle = isLight ? '#334155' : '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i}`, posX, posY);
    }

    for (let j = -gridUnitsY + 1; j <= gridUnitsY - 1; j++) {
      if (j === 0) continue;
      const posX = centerX - 18;
      const posY = centerY - j * unitStep;
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(6, 8, 14, 0.85)';
      ctx.fillRect(posX - 12, posY - 7, 22, 14);
      ctx.fillStyle = isLight ? '#334155' : '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${j}`, posX, posY);
    }

    // Origin (0,0) Badge
    ctx.fillStyle = isLight ? '#E2E8F0' : 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(centerX - 36, centerY + 8, 30, 16);
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(centerX - 36, centerY + 8, 30, 16);

    ctx.fillStyle = isLight ? '#0284C7' : '#38BDF8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('(0,0)', centerX - 21, centerY + 16);

  }, [safeMatrix.a, safeMatrix.b, safeMatrix.c, safeMatrix.d, subjectType, customImage, showImage, showParallelogram, showBasisVectors, showGhostOutline, showGrid, showOrientationArc]);

  // Handle canvas mouse move for interactive coordinate probing
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const unitStep = 45;

    const cartX = (canvasX - centerX) / unitStep;
    const cartY = (centerY - canvasY) / unitStep;

    const transformed = transformPoint(safeMatrix, { x: cartX, y: cartY });
    const probe = {
      x: Number(cartX.toFixed(2)),
      y: Number(cartY.toFixed(2)),
      tx: Number(transformed.x.toFixed(2)),
      ty: Number(transformed.y.toFixed(2))
    };
    setHoverInfo(probe);
    if (onHoverCoords) onHoverCoords(probe);
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
    if (onHoverCoords) onHoverCoords(null);
  };

  return (
    <div className="transform-canvas-card" style={{ width: '100%', position: 'relative' }}>
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{title}</span>
        <span className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>{subtitle}</span>
      </div>

      <div style={{ position: 'relative', width: '100%', marginTop: '0.75rem' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '520px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            cursor: 'crosshair'
          }}
        />

        {/* Live Transformation Inspector Overlay */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'var(--bg-secondary)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${detAnalysis.borderColor}`,
          borderRadius: '10px',
          padding: '0.5rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            det(A) = <strong style={{ color: detAnalysis.color }}>{rawDet.toFixed(2)}</strong>
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            color: detAnalysis.color, 
            background: detAnalysis.bgColor, 
            padding: '0.2rem 0.6rem', 
            borderRadius: '9999px', 
            fontWeight: 700 
          }}>
            {detAnalysis.shortBadge}
          </span>
        </div>

        {/* Interactive Mouse Probe HUD */}
        {hoverInfo && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#F8FAFC',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            gap: '0.85rem',
            pointerEvents: 'none'
          }}>
            <span>Original: <strong>({hoverInfo.x}, {hoverInfo.y})</strong></span>
            <span style={{ color: 'var(--accent-cyan)' }}>➔ Transformed: <strong>({hoverInfo.tx}, {hoverInfo.ty})</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

