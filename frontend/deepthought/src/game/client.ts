// game/main.js - pure Phaser from here on
import Phaser from "phaser";
// import { GameScene } from "./scenes/GameScene";
// import { MenuScene } from "./scenes/MenuScene";

export function startGame(parent: string | HTMLElement): Phaser.Game {
	return new Phaser.Game({
		type: Phaser.AUTO,
		parent,
		width: 800,
		height: 600,
		// scene: [MenuScene, GameScene],
	});
}