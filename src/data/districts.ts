export type District = {
  id: string
  name: string
  lat: number
  lon: number
}

export const districts: District[] = [
  { id: 'central', name: 'Центральный', lat: 69.349, lon: 88.201 },
  { id: 'talnakh', name: 'Талнах', lat: 69.486, lon: 88.397 },
  { id: 'kayerkan', name: 'Кайеркан', lat: 69.35, lon: 87.765 },
  { id: 'oganer', name: 'Оганер', lat: 69.359, lon: 88.368 },
]
