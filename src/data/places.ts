export type Place = {
  id: string
  title: string
  district: string
  address: string
  text: string
  image: string
}

export const places: Place[] = [
  {
    id: 'theater',
    title: 'Заполярный театр драмы им. Маяковского',
    district: 'Центральный',
    address: 'Ленинский проспект, 34',
    text: 'Самый северный драматический театр. Спектакли идут в доме на главном проспекте города.',
    image: '/places/theater.jpg',
  },
  {
    id: 'museum',
    title: 'Музей Норильска',
    district: 'Центральный',
    address: 'Ленинский проспект, 14',
    text: 'История промышленного района: руда, быт и люди, которые строили город.',
    image: '/places/museum.jpg',
  },
  {
    id: 'first-house',
    title: 'Первый дом Норильска',
    district: 'Центральный',
    address: 'Ленинский проспект, 14а',
    text: 'Дом 1921 года, с которого начался город. Сейчас это площадка музея.',
    image: '/places/first-house.jpg',
  },
  {
    id: 'leninsky',
    title: 'Ленинский проспект',
    district: 'Центральный',
    address: 'Главная улица города',
    text: 'Проспект с площадями Октябрьской, Гвардейской и Металлургов.',
    image: '/places/leninsky.jpg',
  },
  {
    id: 'gallery',
    title: 'Норильская художественная галерея',
    district: 'Центральный',
    address: 'улица Талнахская, 78',
    text: 'Картины северных и сибирских художников. Улица Талнахская находится в центре, это не район Талнах.',
    image: '/places/gallery.webp',
  },
  {
    id: 'arena',
    title: 'СРК «Арена-Норильск»',
    district: 'Центральный',
    address: 'площадь Металлургов, 10',
    text: 'Главный торговый и спортивно-развлекательный комплекс: магазины, фитнес и аквапарк.',
    image: '/places/arena.jpg',
  },
  {
    id: 'otdelnaya',
    title: 'Гора Отдельная',
    district: 'Талнах',
    address: 'район Талнах',
    text: 'Горнолыжный комплекс с трассами, подъёмником и видом на рудники.',
    image: '/places/otdelnaya.webp',
  },
  {
    id: 'dolgoe',
    title: 'Озеро Долгое',
    district: 'Центральный',
    address: 'южная окраина',
    text: 'Место прогулок на южной окраине города.',
    image: '/places/dolgoe.jpeg',
  },
  {
    id: 'talnakh',
    title: 'Талнахский филиал музея',
    district: 'Талнах',
    address: 'улица Енисейская, 8а',
    text: 'Рядом геологический парк под открытым небом и лестница к смотровой площадке пятого микрорайона.',
    image: '/places/talnakh.jpg',
  },
  {
    id: 'arktika',
    title: 'Галерея уличных искусств «АРкТика»',
    district: 'Кайеркан',
    address: 'улица Норильская, 20',
    text: 'Проект Агентства развития Норильска. В Кайеркане гостей встречает панно «Сова».',
    image: '/places/arktika.jpeg',
  },
]
