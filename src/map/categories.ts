export const landLegend = [
  { title: 'Земли сельскохозяйственного назначения', fill: '#f3e7a1', stroke: '#8c7a22' },
  { title: 'Земли населенных пунктов', fill: '#f4c7c3', stroke: '#a85b55' },
  { title: 'Земли промышленности и иного назначения', fill: '#c4a484', stroke: '#7a5a3a' },
  { title: 'Земли особо охраняемых территорий', fill: '#8faf78', stroke: '#4f6b3d' },
  { title: 'Земли лесного фонда', fill: '#b7d7a8', stroke: '#5d8a48' },
  { title: 'Земли водного фонда', fill: '#b9d4f2', stroke: '#4d78b0' },
  { title: 'Земли запаса', fill: '#e4d0ea', stroke: '#8d6a96' },
  { title: 'Категория не установлена', fill: '#d0d5db', stroke: '#6b7280' },
] as const

export function categoryPaint(value: string): { fill: string; stroke: string } {
  const text = value.toLowerCase().replaceAll('ё', 'е')
  if (text.includes('сельскохозяй')) return landLegend[0]
  if (text.includes('населен')) return landLegend[1]
  if (text.includes('промышлен') || text.includes('энергетик') || text.includes('транспорт') || text.includes('специальн')) {
    return landLegend[2]
  }
  if (text.includes('особо охраня')) return landLegend[3]
  if (text.includes('лесн')) return landLegend[4]
  if (text.includes('водн')) return landLegend[5]
  if (text.includes('запас')) return landLegend[6]
  return landLegend[7]
}
