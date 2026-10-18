import type { RefObject } from 'react'

type LayerProps = {
  layerRef: RefObject<HTMLDivElement | null>
}

export function CitySky({ layerRef }: LayerProps) {
  return <div ref={layerRef} className="city-layer city-sky" />
}

export function CityAurora({ layerRef }: LayerProps) {
  return <div ref={layerRef} className="city-layer city-aurora" />
}

export function CityIndustry({ layerRef }: LayerProps) {
  return (
    <div ref={layerRef} className="city-layer city-industry" aria-hidden="true">
      <svg viewBox="0 0 1200 280" preserveAspectRatio="xMidYMax slice">
        <path fill="#1a3d62" d="M0 180h1200v100H0z" />
        <path fill="#163552" d="M40 180h180v-40H40zm220 0h260v-28H260zm300 0h160v-52H560zm200 0h220v-24H760z" />
        <rect x="150" y="78" width="18" height="102" fill="#10283f" />
        <rect x="210" y="48" width="14" height="132" fill="#10283f" />
        <rect x="250" y="96" width="16" height="84" fill="#10283f" />
        <rect x="620" y="70" width="22" height="110" fill="#10283f" />
        <rect x="690" y="40" width="16" height="140" fill="#0d2236" />
        <path fill="#d7e7ea" opacity="0.55" d="M157 70c18-24 28-24 40-8 8 12-6 18-18 10-10-6-14-6-22-2z" />
        <path fill="#d7e7ea" opacity="0.45" d="M694 28c16-20 30-16 36 0 4 12-10 16-18 8-8-8-12-8-18-8z" />
      </svg>
    </div>
  )
}

export function CityHouses({ layerRef }: LayerProps) {
  return (
    <div ref={layerRef} className="city-layer city-houses" aria-hidden="true">
      <svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice">
        <g>
          <House x={40} y={120} w={110} h={200} fill="#f2c14e" windows="#16324a" />
          <House x={170} y={70} w={130} h={250} fill="#f4d27a" windows="#16324a" />
          <House x={320} y={150} w={100} h={170} fill="#e7a0b4" windows="#3a2430" />
          <House x={440} y={40} w={150} h={280} fill="#8ec6e6" windows="#14324a" />
          <House x={610} y={110} w={120} h={210} fill="#9dcfb4" windows="#16362c" />
          <House x={750} y={80} w={140} h={240} fill="#f0b4c4" windows="#3a2430" />
          <House x={910} y={140} w={110} h={180} fill="#f6d98a" windows="#16324a" />
          <House x={1040} y={90} w={120} h={230} fill="#7eb8d8" windows="#14324a" />
        </g>
      </svg>
    </div>
  )
}

export function CitySnow({ layerRef }: LayerProps) {
  return (
    <div ref={layerRef} className="city-layer city-snow" aria-hidden="true">
      <svg viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path fill="#f7fbff" d="M0 48c70 26 130-18 210-8s120 36 200 22 130-34 220-16 140 40 220 22 150-30 220-10 80 18 130 10v152H0z" />
        <path fill="#e7f1f8" d="M0 110c90 22 150-14 240-4s130 30 210 14 160-26 250-6 140 28 230 12 150-22 270-4v98H0z" />
      </svg>
    </div>
  )
}

function House({
  x,
  y,
  w,
  h,
  fill,
  windows,
}: {
  x: number
  y: number
  w: number
  h: number
  fill: string
  windows: string
}) {
  const cols = Math.max(2, Math.floor(w / 28))
  const rows = Math.max(3, Math.floor(h / 32))
  const panes = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      panes.push(
        <rect
          key={`${row}-${col}`}
          x={x + 12 + col * ((w - 20) / cols)}
          y={y + 16 + row * ((h - 28) / rows)}
          width={Math.max(6, (w - 20) / cols - 8)}
          height={8}
          fill={windows}
          opacity={0.8}
        />,
      )
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      {panes}
    </g>
  )
}
