// PhaserGame.jsx - the bridge, nothing more
import { useEffect, useRef } from "react";
import { startGame } from "./client";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = startGame(containerRef.current);
    return () => game.destroy(true);
  }, []);

  return <div ref={containerRef} />;
}