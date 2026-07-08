import { SERVER_ORIGIN } from '../config/api'

interface Props {
  url?: string | null
  name: string
  size?: number
  className?: string
}

/** Avatar com fallback para as iniciais do nome quando não há imagem. */
export default function Avatar({ url, name, size = 40, className = '' }: Props) {
  const src = url ? (url.startsWith('/uploads/') ? `${SERVER_ORIGIN}${url}` : url) : null
  const style = { width: size, height: size }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`border-b-2 border-r-2 border-l border-t border-black object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      style={style}
      className={`bg-black/40 border-b-2 border-r-2 border-l border-t border-black flex items-center justify-center shrink-0 ${className}`}
    >
      <span className="font-pressStart text-contrast" style={{ fontSize: size * 0.4 }}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
