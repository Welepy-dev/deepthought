export default function LeaderboardsPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b-4 border-black shrink-0">
        <span className="font-pressStart text-xs text-contrast">Leaderboards</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
        <p className="font-pressStart text-[10px] text-contrast text-center">Coming soon</p>
        <p className="font-pressStart text-[9px] text-white/40 text-center leading-relaxed">
          Rankings are being finalized.
        </p>
      </div>
    </div>
  )
}
