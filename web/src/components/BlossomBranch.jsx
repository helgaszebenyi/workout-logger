import { useEffect, useRef, useState } from 'react';

// The cherry-blossom branch on the sign-in screen. It reaches from behind the
// card's top-right corner all the way to the top-right corner of the window.
//
// How it fits any screen without looking stretched:
// - The CSS decides how big the .branch box is (from the card to the corner).
// - A ResizeObserver tells us that size in pixels whenever it changes.
// - We then draw the SVG in real pixels: a curved stem, and a flower (or a
//   little twig with a flower) every FLOWER_GAP pixels along it. So a bigger
//   screen gets a longer branch with MORE flowers, not bigger gaps.
//
// Purely decorative, so it's hidden from screen readers.

const FLOWER_GAP = 62;                             // pixels between flowers
const SIZES = [1.45, 1.05, 1.7, 1.2, 1.55, 0.95];  // flower scales, repeated
const TWIG_EVERY = 3;                              // every 3rd spot is a twig
const CARD_OVERLAP = 50; // the box starts 50 px inside the card (see .branch in styles.css)

export default function BlossomBranch() {
  const boxRef = useRef(null);
  const [size, setSize] = useState(null);

  // Measure the box now and every time it changes size (window resize, rotate).
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="branch" aria-hidden="true">
      {size && <BranchDrawing {...size} />}
    </div>
  );
}

function BranchDrawing({ width, height }) {
  const stem = makeStem(width, height);
  const spots = placeFlowers(stem, width);

  return (
    <svg className="branch-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        {/* One blossom (about 36 px wide at scale 1), reused for every flower. */}
        <g id="blossom">
          <g fill="#f4b6c2">
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse key={angle} cx="0" cy="-9" rx="6" ry="9" transform={`rotate(${angle})`} />
            ))}
          </g>
          <circle r="3.2" fill="#b5476a" />
        </g>
      </defs>

      <path className="branch-line" d={stem.path} strokeWidth="6" />
      {spots.filter((spot) => spot.twig).map((spot) => (
        <path key={`t${spot.index}`} className="branch-line" d={spot.twig} strokeWidth="3.5" />
      ))}
      {spots.map((spot) => (
        <use
          key={`f${spot.index}`}
          href="#blossom"
          transform={`translate(${spot.x} ${spot.y}) rotate(${spot.index * 37}) scale(${spot.scale})`}
        />
      ))}
    </svg>
  );
}

// The stem: one smooth curve from the bottom-left corner of the box (behind
// the card) to just past its top-right corner (the window's corner).
// Returns the SVG path plus a list of points along it, so we can find
// "the point 120 px along the stem" later.
function makeStem(w, h) {
  const p0 = [0, h];
  const p1 = [w * 0.3, h * 0.75];
  const p2 = [w * 0.55, h * 0.35];
  const p3 = [w + 20, h * 0.03];

  const points = [];
  let length = 0;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const [x, y] = bezier(p0, p1, p2, p3, t);
    if (i > 0) {
      const previous = points[i - 1];
      length += Math.hypot(x - previous.x, y - previous.y);
    }
    points.push({ x, y, length });
  }

  const path = `M${p0} C${p1} ${p2} ${p3}`;
  return { path, points, length };
}

// A cubic Bézier curve: the point at t (0 = start, 1 = end).
function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [0, 1].map((axis) =>
    u * u * u * p0[axis] + 3 * u * u * t * p1[axis] + 3 * u * t * t * p2[axis] + t * t * t * p3[axis],
  );
}

// The point `distance` pixels along the stem, and which way the stem goes there.
function pointAlong(stem, distance) {
  const found = stem.points.findIndex((point) => point.length >= distance);
  const i = found === -1 ? stem.points.length - 1 : Math.max(found, 1);
  const here = stem.points[i];
  const before = stem.points[i - 1];
  const dx = here.x - before.x;
  const dy = here.y - before.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: here.x, y: here.y, dirX: dx / len, dirY: dy / len };
}

// A flower every FLOWER_GAP pixels. Every TWIG_EVERY-th one sits on the end of
// a short side twig, alternating above and below the stem.
// Only flowers that fit completely are kept: none half-hidden behind the card,
// and none cut off by the top or right edge of the window.
function placeFlowers(stem, width) {
  const spots = [];
  for (let index = 0, d = 40; d < stem.length - 10; index++, d += FLOWER_GAP) {
    const { x, y, dirX, dirY } = pointAlong(stem, d);
    const scale = SIZES[index % SIZES.length];
    const spot = { index, x, y, scale };

    if (index % TWIG_EVERY === 1) {
      // Sideways direction (perpendicular to the stem), flipped every other twig.
      const side = index % 2 === 0 ? 1 : -1;
      const nx = -dirY * side;
      const ny = dirX * side;
      const twigLength = 46;
      const endX = x + nx * twigLength + dirX * 14;
      const endY = y + ny * twigLength + dirY * 14;
      spot.twig = `M${x} ${y} Q${x + nx * twigLength * 0.7} ${y + ny * twigLength * 0.7} ${endX} ${endY}`;
      spot.x = endX;
      spot.y = endY;
      spot.scale = scale * 0.85;
    }

    const radius = 18 * spot.scale; // the blossom is about 36 px wide at scale 1
    const fits =
      spot.x - radius > CARD_OVERLAP + 4 && // fully to the right of the card
      spot.y - radius > 2 &&                // not cut off at the top
      spot.x + radius < width - 2;          // not cut off at the right
    if (fits) spots.push(spot);
  }
  return spots;
}
