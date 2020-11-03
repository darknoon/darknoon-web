const layers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

const lwidth = 20
const lheight = 20
const actwidth = 10
const spacing = 20

const Network = ({}) => {
  return (
    <svg viewBox="0 0 600 200">
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      {layers.map(i => (
        <>
          <g transform={`translate(${i * (lwidth + spacing * 2) + spacing} 0)`}>
            <rect width={lwidth} height={lheight} fill="orange" />
          </g>
          <g transform={`translate(${i * (lwidth + spacing * 2)} 0)`}>
            <rect
              y={lheight / 2 - actwidth / 2}
              width={actwidth}
              height={actwidth}
              fill="white"
              radius={3}
            />
            <polyline
              points={`${lwidth},${lheight / 2} ${lwidth + 10},${lheight / 2}`}
              fill="none"
              stroke="black"
              marker-end="url(#arrow)"
            />
          </g>
        </>
      ))}
    </svg>
  )
}
