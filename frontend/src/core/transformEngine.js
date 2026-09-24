/**
 * 2D Coordinate Transformation Engine (X' = AX)
 */

export function transformPoint(matrix2x2, point) {
  const a = matrix2x2 && typeof matrix2x2.a === 'number' && !isNaN(matrix2x2.a) ? matrix2x2.a : 1;
  const b = matrix2x2 && typeof matrix2x2.b === 'number' && !isNaN(matrix2x2.b) ? matrix2x2.b : 0;
  const c = matrix2x2 && typeof matrix2x2.c === 'number' && !isNaN(matrix2x2.c) ? matrix2x2.c : 0;
  const d = matrix2x2 && typeof matrix2x2.d === 'number' && !isNaN(matrix2x2.d) ? matrix2x2.d : 1;

  const { x, y } = point;
  return {
    x: a * x + b * y,
    y: c * x + d * y,
  };
}

export function getRotationMatrix(angleInDegrees) {
  const rad = (angleInDegrees * Math.PI) / 180;
  return {
    a: Math.cos(rad),
    b: -Math.sin(rad),
    c: Math.sin(rad),
    d: Math.cos(rad),
  };
}

export function getScalingMatrix(sx, sy) {
  return { a: sx, b: 0, c: 0, d: sy };
}

export function getShearMatrix(kx, ky) {
  return { a: 1, b: kx, c: ky, d: 1 };
}

/**
 * Calculates determinant of 2x2 matrix: det(A) = ad - bc
 */
export function computeDeterminant(matrix2x2) {
  const a = matrix2x2 && typeof matrix2x2.a === 'number' && !isNaN(matrix2x2.a) ? matrix2x2.a : 1;
  const b = matrix2x2 && typeof matrix2x2.b === 'number' && !isNaN(matrix2x2.b) ? matrix2x2.b : 0;
  const c = matrix2x2 && typeof matrix2x2.c === 'number' && !isNaN(matrix2x2.c) ? matrix2x2.c : 0;
  const d = matrix2x2 && typeof matrix2x2.d === 'number' && !isNaN(matrix2x2.d) ? matrix2x2.d : 1;
  return a * d - b * c;
}

/**
 * Categorizes the determinant into stretch, shrink, collapse, flip
 */
export function getDeterminantAnalysis(det) {
  const absDet = Math.abs(det);
  const eps = 1e-4;

  if (absDet < eps) {
    return {
      type: 'collapse',
      label: 'Dimension Collapse (Singularity)',
      shortBadge: 'Collapsed (0D/1D)',
      color: '#EF4444', // Red
      bgColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      description: 'det(A) = 0 squashes 2D planar space into a 1D line or 0D point. Area vanishes completely (0%) and information is irreversibly lost.',
      areaMultiplier: 0,
      areaStatus: 'Collapsed to 0 Area',
      orientationStatus: 'Degenerate (Colinear Basis)',
      orientationFlipped: false
    };
  }

  const isFlipped = det < -eps;
  const orientationStatus = isFlipped ? 'Reversed (Clockwise / Mirror Reflection)' : 'Standard (Counter-Clockwise)';

  if (absDet > 1.0 + eps) {
    return {
      type: isFlipped ? 'flip_stretch' : 'stretch',
      label: isFlipped ? 'Flip + Area Stretch' : 'Area Increase (Stretch)',
      shortBadge: isFlipped ? 'Flipped + Stretched' : 'Area Stretched',
      color: isFlipped ? '#A855F7' : '#3B82F6', // Purple or Blue
      bgColor: isFlipped ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
      borderColor: isFlipped ? 'rgba(168, 85, 247, 0.4)' : 'rgba(59, 130, 246, 0.4)',
      description: `|det(A)| = ${absDet.toFixed(2)} > 1 expands image area by ${(absDet * 100).toFixed(0)}%. ${isFlipped ? 'Negative sign flips the image inside-out (mirror reflection)!' : ''}`,
      areaMultiplier: absDet,
      areaStatus: `Increased by ${(absDet).toFixed(2)}×`,
      orientationStatus,
      orientationFlipped: isFlipped
    };
  }

  if (absDet < 1.0 - eps) {
    return {
      type: isFlipped ? 'flip_shrink' : 'shrink',
      label: isFlipped ? 'Flip + Area Shrink' : 'Area Decrease (Shrink)',
      shortBadge: isFlipped ? 'Flipped + Shrunk' : 'Area Shrunk',
      color: isFlipped ? '#EC4899' : '#F59E0B', // Pink or Amber
      bgColor: isFlipped ? 'rgba(236, 72, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
      borderColor: isFlipped ? 'rgba(236, 72, 153, 0.4)' : 'rgba(245, 158, 11, 0.4)',
      description: `0 < |det(A)| = ${absDet.toFixed(2)} < 1 compresses image area down to ${(absDet * 100).toFixed(0)}% of original. ${isFlipped ? 'Negative sign inverts the chirality!' : ''}`,
      areaMultiplier: absDet,
      areaStatus: `Decreased to ${(absDet).toFixed(2)}×`,
      orientationStatus,
      orientationFlipped: isFlipped
    };
  }

  // |det| ≈ 1.0
  if (isFlipped) {
    return {
      type: 'flip_preserve',
      label: 'Pure Orientation Flip (Mirror)',
      shortBadge: 'Flipped (Area Preserved)',
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.15)',
      borderColor: 'rgba(139, 92, 246, 0.4)',
      description: 'det(A) = -1.0 preserves 100% of the area, but completely mirrors and reverses orientation (left becomes right, clockwise becomes counter-clockwise).',
      areaMultiplier: 1.0,
      areaStatus: 'Exact 1.00× (Preserved)',
      orientationStatus,
      orientationFlipped: true
    };
  }

  return {
    type: 'preserve',
    label: 'Area Preserved (Equi-areal)',
    shortBadge: 'Area Preserved (1.00×)',
    color: '#10B981', // Emerald
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    description: 'det(A) = 1.00 maintains exact 2D area (such as pure rotation, pure shear, or identity). Shapes may bend or tilt, but total area is invariant.',
    areaMultiplier: 1.0,
    areaStatus: 'Exact 1.00× (Preserved)',
    orientationStatus,
    orientationFlipped: false
  };
}

/**
 * Computes the inverse of a 2x2 matrix:
 * A^-1 = (1 / det) * [ d  -b ]
 *                    [ -c  a ]
 * Returns null if det(A) == 0 (singular matrix)
 */
export function computeInverseMatrix(matrix2x2) {
  const a = matrix2x2 && typeof matrix2x2.a === 'number' && !isNaN(matrix2x2.a) ? matrix2x2.a : 1;
  const b = matrix2x2 && typeof matrix2x2.b === 'number' && !isNaN(matrix2x2.b) ? matrix2x2.b : 0;
  const c = matrix2x2 && typeof matrix2x2.c === 'number' && !isNaN(matrix2x2.c) ? matrix2x2.c : 0;
  const d = matrix2x2 && typeof matrix2x2.d === 'number' && !isNaN(matrix2x2.d) ? matrix2x2.d : 1;

  const det = a * d - b * c;
  if (Math.abs(det) < 1e-6) {
    return null; // Singular, no inverse exists
  }

  return {
    a: d / det,
    b: -b / det,
    c: -c / det,
    d: a / det,
    det: det
  };
}

/**
 * Multiplies two 2x2 matrices: M = M1 * M2
 */
export function multiply2x2(m1, m2) {
  const a1 = m1.a, b1 = m1.b, c1 = m1.c, d1 = m1.d;
  const a2 = m2.a, b2 = m2.b, c2 = m2.c, d2 = m2.d;
  return {
    a: a1 * a2 + b1 * c2,
    b: a1 * b2 + b1 * d2,
    c: c1 * a2 + d1 * c2,
    d: c1 * b2 + d1 * d2
  };
}

/**
 * Linearly interpolates between two 2x2 matrices: M(t) = (1-t)*M1 + t*M2
 */
export function interpolateMatrix(m1, m2, t) {
  return {
    a: m1.a * (1 - t) + m2.a * t,
    b: m1.b * (1 - t) + m2.b * t,
    c: m1.c * (1 - t) + m2.c * t,
    d: m1.d * (1 - t) + m2.d * t
  };
}

/**
 * Draws crisp procedural subject graphics on a canvas context centered around (0, 0)
 * in Cartesian units. Size parameter is the width/height in coordinate units.
 */
export function drawProceduralSubject(ctx, type = 'portrait', unitStep = 45, isLight = false) {
  ctx.save();
  const half = 1.8 * unitStep; // spans roughly -1.8 to +1.8 in units

  if (type === 'portrait') {
    // Face portrait with asymmetric features (hair curl on left, wink/glasses, badge)
    // 1. Head shape
    ctx.fillStyle = isLight ? '#FED7AA' : '#FBBF24';
    ctx.strokeStyle = isLight ? '#EA580C' : '#D97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Hair with distinct asymmetric parting on the left
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(0, -half * 0.2, half * 0.78, Math.PI * 0.85, Math.PI * 2.15);
    ctx.quadraticCurveTo(-half * 0.6, -half * 0.1, -half * 0.7, half * 0.2);
    ctx.quadraticCurveTo(-half * 0.3, -half * 0.5, 0, -half * 0.4);
    ctx.fill();

    // 3. Eyes (left eye round with iris, right eye winking star - makes flip obvious!)
    // Left eye (x = -half * 0.28)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-half * 0.28, -half * 0.08, half * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2563EB'; // Blue iris
    ctx.beginPath();
    ctx.arc(-half * 0.26, -half * 0.08, half * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-half * 0.26, -half * 0.08, half * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Right eye (x = +half * 0.28) - Winking arch
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(half * 0.28, -half * 0.04, half * 0.12, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // 4. Smile (asymmetric smirk)
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, half * 0.18, half * 0.28, 0.2, Math.PI * 0.85);
    ctx.stroke();

    // 5. Asymmetric Earring / Star on Left ear
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(-half * 0.76, half * 0.15, 6, 0, Math.PI * 2);
    ctx.fill();

    // 6. Bold label "L" (Left) and "R" (Right) to make orientation flip 100% unequivocal!
    ctx.font = '900 13px "JetBrains Mono", sans-serif';
    ctx.fillStyle = '#0284C7';
    ctx.fillText('L', -half * 0.65, -half * 0.45);
    ctx.fillStyle = '#10B981';
    ctx.fillText('R', half * 0.55, -half * 0.45);
  } else if (type === 'geometry') {
    // 4-Quadrant Asymmetric Calibration Target with letter "R"
    // Quadrant 1 (+, +): Cyan
    ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
    ctx.fillRect(0, -half * 0.85, half * 0.85, half * 0.85);
    // Quadrant 2 (-, +): Purple
    ctx.fillStyle = 'rgba(168, 85, 247, 0.75)';
    ctx.fillRect(-half * 0.85, -half * 0.85, half * 0.85, half * 0.85);
    // Quadrant 3 (-, -): Pink
    ctx.fillStyle = 'rgba(236, 72, 153, 0.75)';
    ctx.fillRect(-half * 0.85, 0, half * 0.85, half * 0.85);
    // Quadrant 4 (+, -): Amber
    ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
    ctx.fillRect(0, 0, half * 0.85, half * 0.85);

    // Outer border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-half * 0.85, -half * 0.85, half * 1.7, half * 1.7);

    // Bold asymmetric Letter "R" (textbook linear algebra test shape)
    ctx.font = `900 ${Math.round(half * 0.75)}px "Inter", "Arial Black", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText('R', 0, 0);
  } else if (type === 'rocket') {
    // Space Rocket with asymmetric flame and decal
    // Fuselage
    ctx.fillStyle = isLight ? '#E2E8F0' : '#F1F5F9';
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.85);
    ctx.quadraticCurveTo(half * 0.35, -half * 0.1, half * 0.3, half * 0.45);
    ctx.lineTo(-half * 0.3, half * 0.45);
    ctx.quadraticCurveTo(-half * 0.35, -half * 0.1, 0, -half * 0.85);
    ctx.fill();
    ctx.stroke();

    // Red nosecone
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.85);
    ctx.quadraticCurveTo(half * 0.2, -half * 0.5, 0, -half * 0.45);
    ctx.quadraticCurveTo(-half * 0.2, -half * 0.5, 0, -half * 0.85);
    ctx.fill();

    // Porthole Window
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(0, -half * 0.15, half * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Asymmetric Left Wing (Cyan)
    ctx.fillStyle = '#06B6D4';
    ctx.beginPath();
    ctx.moveTo(-half * 0.3, half * 0.2);
    ctx.lineTo(-half * 0.65, half * 0.55);
    ctx.lineTo(-half * 0.3, half * 0.45);
    ctx.fill();

    // Asymmetric Right Wing (Orange)
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(half * 0.3, half * 0.2);
    ctx.lineTo(half * 0.65, half * 0.55);
    ctx.lineTo(half * 0.3, half * 0.45);
    ctx.fill();

    // Thruster Flame
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-half * 0.18, half * 0.48);
    ctx.lineTo(0, half * 0.85);
    ctx.lineTo(half * 0.18, half * 0.48);
    ctx.fill();
  } else if (type === 'macro') {
    // Silicon Microchip with intricate circuits (fantastic for demonstrating zoom in/out!)
    // Outer Ceramic Package
    ctx.fillStyle = isLight ? '#334155' : '#0F172A';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-half * 0.85, -half * 0.85, half * 1.7, half * 1.7);
    ctx.strokeRect(-half * 0.85, -half * 0.85, half * 1.7, half * 1.7);

    // Silicon Die (Center dark green/slate square)
    ctx.fillStyle = '#064E3B';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-half * 0.55, -half * 0.55, half * 1.1, half * 1.1);
    ctx.strokeRect(-half * 0.55, -half * 0.55, half * 1.1, half * 1.1);

    // Gold Bond Pads & Micro-traces
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -4; i <= 4; i++) {
      const offset = (i / 4.5) * half * 0.75;
      // Top/Bottom pins
      ctx.moveTo(offset, -half * 0.85);
      ctx.lineTo(offset * 0.7, -half * 0.55);
      ctx.moveTo(offset, half * 0.85);
      ctx.lineTo(offset * 0.7, half * 0.55);
      // Left/Right pins
      ctx.moveTo(-half * 0.85, offset);
      ctx.lineTo(-half * 0.55, offset * 0.7);
      ctx.moveTo(half * 0.85, offset);
      ctx.lineTo(half * 0.55, offset * 0.7);
    }
    ctx.stroke();

    // Central CPU Core
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.fillRect(-half * 0.28, -half * 0.28, half * 0.56, half * 0.56);
    ctx.strokeRect(-half * 0.28, -half * 0.28, half * 0.56, half * 0.56);

    // Inner Silicon Die
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-half * 0.18, -half * 0.18, half * 0.36, half * 0.36);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-half * 0.18, -half * 0.18, half * 0.36, half * 0.36);
  }

  ctx.restore();
}


