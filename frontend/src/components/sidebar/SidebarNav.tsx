import announcementsIcon from '../../../assets/icons/anouncements.png'
import resourcesIcon     from '../../../assets/icons/resources.png'
import findPeersIcon     from '../../../assets/icons/find-peers.png'
import chatIcon          from '../../../assets/icons/chat.png'
import profileIcon       from '../../../assets/icons/profile.png'
import leaderboardsIcon  from '../../../assets/icons/leaderboards.png'
import feedbackIcon      from '../../../assets/icons/feedback.png'

export type PanelId =
  | 'announcements'
  | 'resources'
  | 'findPeers'
  | 'chat'
  | 'profile'
  | 'leaderboards'
  | 'feedback'

interface NavItem {
  id: PanelId
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'announcements', label: 'Announcements', icon: announcementsIcon },
  { id: 'resources',     label: 'Resources',     icon: resourcesIcon     },
  { id: 'findPeers',     label: 'Find Peers',    icon: findPeersIcon     },
  { id: 'chat',          label: 'Chat',          icon: chatIcon          },
  { id: 'profile',       label: 'Profile',       icon: profileIcon       },
  { id: 'leaderboards',  label: 'Leaderboards',  icon: leaderboardsIcon  },
  { id: 'feedback',      label: 'Feedback',      icon: feedbackIcon      },
]

interface Props {
  activePanel: PanelId
  onSelect: (id: PanelId) => void
}

export default function SidebarNav({ activePanel, onSelect }: Props) {
  return (
    <div className="w-16 h-full bg-black/60 flex flex-col items-center justify-around py-4 shrink-0">
      {NAV_ITEMS.map(item => {
        const isActive = item.id === activePanel
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            title={item.label}
            className={`relative flex items-center justify-center w-9 h-9 transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-50 hover:opacity-90'
            }`}
          >
            {isActive && (
              <span className="absolute inset-0 bg-white/10 border border-white/20" />
            )}
            <img
              src={item.icon}
              alt={item.label}
              className="w-[22px] h-[22px] object-contain relative z-10"
              draggable={false}
            />
          </button>
        )
      })}
    </div>
  )
}
