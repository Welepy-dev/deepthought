// PhaserGame.jsx - bridge, nothing more
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { startGame } from "../game/client";
import { logout } from "../auth/logout";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

    const game = startGame(containerRef.current);

    return () => game.destroy(true);
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="relative bg-neutral_contrast border-b-8 border-r-8 border-l-4 border-t-4 border-black">
      
      {/* 🔴 UI OVERLAY */}
      <button
        onClick={handleLogout}
        className="absolute top-2 right-2 z-50 px-3 py-1 bg-black text-white text-xs font-pressStart"
      >
        Logout
      </button>

      {/* 🎮 GAME CONTAINER */}
      <div ref={containerRef} />
    </div>
  );
}