/**
 * Abstract dot-grid map motif for the rural hub hero — pure SVG/CSS, no map library.
 */
export function RuralHubMap() {
  const gridDots: { cx: number; cy: number }[] = [];
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      gridDots.push({ cx: 24 + col * 28, cy: 24 + row * 28 });
    }
  }

  const nodes = [
    { id: "hub", cx: 240, cy: 140, r: 7, connected: true },
    { id: "n1", cx: 120, cy: 90, r: 5, connected: true },
    { id: "n2", cx: 360, cy: 80, r: 5, connected: true },
    { id: "n3", cx: 80, cy: 180, r: 5, connected: true },
    { id: "n4", cx: 400, cy: 170, r: 5, connected: true },
    { id: "n5", cx: 180, cy: 220, r: 5, connected: true },
    { id: "n6", cx: 320, cy: 210, r: 5, connected: true },
    { id: "n7", cx: 150, cy: 50, r: 4, connected: false },
    { id: "n8", cx: 420, cy: 120, r: 4, connected: false },
  ];

  const connections = [
    { id: "c1", x1: 120, y1: 90, x2: 240, y2: 140, delay: "0s" },
    { id: "c2", x1: 360, y1: 80, x2: 240, y2: 140, delay: "0.6s" },
    { id: "c3", x1: 80, y1: 180, x2: 240, y2: 140, delay: "1.2s" },
    { id: "c4", x1: 400, y1: 170, x2: 240, y2: 140, delay: "1.8s" },
    { id: "c5", x1: 180, y1: 220, x2: 240, y2: 140, delay: "2.4s" },
    { id: "c6", x1: 320, y1: 210, x2: 240, y2: 140, delay: "3s" },
  ];

  return (
    <div
      className="relative w-full overflow-hidden rounded-radius-xl border border-border-subtle bg-surface-sunken"
      aria-hidden
    >
      <svg
        viewBox="0 0 480 280"
        className="h-auto w-full"
        role="img"
        aria-label="Abstract map of connected rural imaging sites"
      >
        <defs>
          <radialGradient id="rural-map-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#F1F5F9" stopOpacity="1" />
            <stop offset="100%" stopColor="#F1F5F9" stopOpacity="0.2" />
          </radialGradient>
          <filter id="rural-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="480" height="280" fill="url(#rural-map-fade)" />

        {gridDots.map((dot, i) => (
          <circle
            key={`grid-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r={1.2}
            fill="#CBD5E1"
            opacity={0.55}
          />
        ))}

        {connections.map((line) => (
          <g key={line.id}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#99F6E4"
              strokeWidth={1.5}
              strokeOpacity={0.45}
            />
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#14B8A6"
              strokeWidth={2}
              strokeOpacity={0.35}
              strokeDasharray="6 10"
              className="rural-map-path-animate"
            />
            <circle r={4} fill="#14B8A6" className="rural-map-pulse-dot">
              <animateMotion
                dur="3.6s"
                repeatCount="indefinite"
                begin={line.delay}
                path={`M${line.x1},${line.y1} L${line.x2},${line.y2}`}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.85;1"
                dur="3.6s"
                repeatCount="indefinite"
                begin={line.delay}
              />
            </circle>
          </g>
        ))}

        {nodes.map((node) => (
          <g key={node.id} filter={node.connected ? "url(#rural-node-glow)" : undefined}>
            {node.connected ? (
              <circle cx={node.cx} cy={node.cy} r={node.r + 4} fill="#14B8A6" opacity={0.15} />
            ) : null}
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={node.connected ? "#14B8A6" : "#94A3B8"}
              stroke={node.connected ? "#0D9488" : "#CBD5E1"}
              strokeWidth={1.5}
            />
          </g>
        ))}

        <circle cx={240} cy={140} r={10} fill="none" stroke="#14B8A6" strokeWidth={1} opacity={0.4}>
          <animate attributeName="r" values="10;18;10" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
