import { useEffect, useRef } from 'react'
import type { Place } from '../data/places'

type PlaceDialogProps = {
  place: Place
  onClose: () => void
}

export default function PlaceDialog({ place, onClose }: PlaceDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = `place-${place.id}-title`

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="place-overlay" onClick={onClose}>
      <article
        className="place-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="place-dialog-photo">
          <img src={place.image} alt={place.title} />
          <button ref={closeRef} type="button" className="place-close" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <div className="place-dialog-copy">
          <span>{place.district}</span>
          <h2 id={titleId}>{place.title}</h2>
          <p className="place-address">{place.address}</p>
          <p>{place.text}</p>
        </div>
      </article>
    </div>
  )
}
