import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CityAurora, CityHouses, CityIndustry, CitySky, CitySnow } from '../components/CityParade'
import PlaceDialog from '../components/PlaceDialog'
import { districts } from '../data/districts'
import { places, type Place } from '../data/places'
import { landLegend } from '../map/categories'

const categoryNotes = [
  'Теплицы, локальные продукты и продовольственные проекты.',
  'Жилые кварталы, улицы и участки внутри города.',
  'Производство, транспорт, энергетика и иной специальный режим.',
  'Территории с особым режимом охраны.',
  'Лесные земли вокруг районов.',
  'Реки, озёра и иные водные земли.',
  'Земли, не переданные в иные категории.',
  'Категория в открытых сведениях не указана.',
]

const districtNotes: Record<string, string> = {
  central: 'Центр города, жилые кварталы и деловая жизнь.',
  talnakh: 'Северный район у промышленного горизонта.',
  kayerkan: 'Западный район за рекой и карьерами.',
  oganer: 'Южный жилой район ближе к аэропорту.',
}

export default function HomePage() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const closePlace = useCallback(() => setSelectedPlace(null), [])
  const sceneRef = useRef<HTMLElement>(null)
  const skyRef = useRef<HTMLDivElement>(null)
  const auroraRef = useRef<HTMLDivElement>(null)
  const industryRef = useRef<HTMLDivElement>(null)
  const housesRef = useRef<HTMLDivElement>(null)
  const snowRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    const apply = (progress: number) => {
      const shift = reduced ? 0 : progress
      if (skyRef.current) skyRef.current.style.transform = `translate3d(0, ${shift * -36}px, 0)`
      if (auroraRef.current) auroraRef.current.style.transform = `translate3d(${shift * 40}px, ${shift * -80}px, 0)`
      if (industryRef.current) {
        industryRef.current.style.transform = `translate3d(${shift * -28}px, ${shift * -90}px, 0)`
      }
      if (housesRef.current) {
        housesRef.current.style.transform = `translate3d(${shift * 22}px, ${shift * -150}px, 0)`
      }
      if (snowRef.current) snowRef.current.style.transform = `translate3d(0, ${shift * 120}px, 0)`
      if (copyRef.current) {
        copyRef.current.style.transform = `translate3d(0, ${shift * -70}px, 0)`
        copyRef.current.style.opacity = String(1 - Math.min(shift * 1.15, 1))
      }
    }

    const update = () => {
      frame = 0
      const total = scene.offsetHeight - window.innerHeight
      const passed = Math.min(Math.max(-scene.getBoundingClientRect().top, 0), Math.max(total, 0))
      apply(total > 0 ? passed / total : 0)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <main className="home-page">
      <section className="city-scroll" ref={sceneRef}>
        <div className="city-sticky">
          <CitySky layerRef={skyRef} />
          <CityAurora layerRef={auroraRef} />
          <CityIndustry layerRef={industryRef} />
          <CityHouses layerRef={housesRef} />
          <CitySnow layerRef={snowRef} />
          <div className="city-copy" ref={copyRef}>
            <h1>Инвестиционный потенциал Норильска</h1>
            <p className="home-lead">Центральный район, Талнах, Кайеркан и Оганер.</p>
            <Link to="/map" className="gis-accent-btn">
              Открыть карту
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>Категории земли</h2>
          <p>Те же цвета, что на карте</p>
        </div>
        <div className="land-rows">
          {landLegend.map((item, index) => (
            <Link key={item.title} to="/map" className="land-row">
              <i className="land-swatch" style={{ background: item.fill, borderColor: item.stroke }} />
              <strong>{item.title}</strong>
              <span>{categoryNotes[index]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>Места</h2>
          <p>Нажмите фото</p>
        </div>
        <div className="film" tabIndex={0}>
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              className="place-shot"
              onClick={() => setSelectedPlace(place)}
            >
              <img src={place.image} alt="" />
              <span className="place-shot-label">
                <small>{place.district}</small>
                <strong>{place.title}</strong>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section home-section--last">
        <div className="home-section-head">
          <h2>Районы</h2>
          <p>Четыре части Норильска</p>
        </div>
        <div className="district-index">
          {districts.map((district) => (
            <Link key={district.id} to="/map">
              <strong>{district.name}</strong>
              <span>{districtNotes[district.id]}</span>
            </Link>
          ))}
        </div>
      </section>

      {selectedPlace ? <PlaceDialog place={selectedPlace} onClose={closePlace} /> : null}
    </main>
  )
}
