import { useNavigate } from 'react-router-dom'
import { logout } from '../../../auth/logout'

interface User {
  id: string
  login: string
  displayName: string
  avatar: string | null
  campus: string | null
  coalition: string | null
  level: number
  xp: number
  evalPoints: number
  role: string
  bio: string | null
}

interface Props {
  user: User | null
}

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-pressStart text-[9px] text-contrast uppercase">{label}</span>
      <span className="font-pressStart text-[10px] text-white">{value ?? '—'}</span>
    </div>
  )
}

export default function ProfilePanel({ user }: Props) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    // Navegar para fora de /Game desmonta o PhaserGame, que já trata de
    // destruir o jogo e desligar o socket no cleanup do useEffect.
    navigate('/', { replace: true })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-pressStart text-[10px] text-white/50">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b-4 border-black shrink-0">
        <span className="font-pressStart text-xs text-contrast">Profile</span>
      </div>

      <div className="flex flex-col items-center gap-3 p-4 border-b-4 border-black">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-16 h-16 border-b-4 border-r-4 border-l-2 border-t-2 border-black object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-black/40 border-b-4 border-r-4 border-l-2 border-t-2 border-black flex items-center justify-center">
            <span className="font-pressStart text-contrast text-xl">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <p className="font-pressStart text-xs text-white text-center">{user.displayName}</p>
        <p className="font-pressStart text-[10px] text-white/50">@{user.login}</p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <Row label="Level"  value={user.level.toFixed(2)} />
        <Row label="XP"     value={user.xp.toLocaleString()} />
        <Row label="Eval pts" value={user.evalPoints} />
        <Row label="Campus"   value={user.campus} />
        <Row label="Coalition" value={user.coalition} />
        <Row label="Role"     value={user.role} />
        {user.bio && (
          <div className="flex flex-col gap-0.5">
            <span className="font-pressStart text-[9px] text-contrast uppercase">Bio</span>
            <p className="font-pressStart text-[10px] text-white leading-relaxed">{user.bio}</p>
          </div>
        )}
      </div>

      <div className="mt-auto p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-black text-red-400 font-pressStart text-[10px] border-b-4 border-r-4 border-l-2 border-t-2 border-neutral_contrast"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
