export default function AnnouncementsPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b-4 border-black shrink-0">
        <span className="font-pressStart text-xs text-contrast">Announcements</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="font-pressStart text-[10px] text-white/40 text-center leading-relaxed">
          No announcements yet.
        </p>
      </div>
    </div>
  )
}
