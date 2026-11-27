import { useNavigate } from 'react-router-dom'

export default function ReportLaunch({ label, parcelId, number, className }: { label: string; parcelId?: number; number?: string; className?: string }) {
  const navigate = useNavigate()
  const open = () => {
    const params = new URLSearchParams()
    if (parcelId) params.set('parcel', String(parcelId))
    if (number) params.set('number', number)
    navigate(`/report?${params}`)
  }
  return (
    <button type="button" className={className ?? 'report-launch-button'} onPointerDown={(event) => event.stopPropagation()} onClick={open}>
      {label}
    </button>
  )
}
