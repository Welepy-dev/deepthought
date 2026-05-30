import Phaser from "phaser";
import { TILE_WIDTH, TILE_HEIGHT } from "./constants";
import { setupCamera } from "./setupCamera";
import { setupUI } from "./setupUI";
import { setupInput } from "./setupInput";
import { setupMap } from "./setupMap";

class GameScene extends Phaser.Scene {
	private offsetX = 0;
	private offsetY = 0;

	preload() {
		this.load.image("floor", "assets/tilesets/floors.png");
		this.load.image("props", "assets/tilesets/Props.png");
		this.load.image("walls", "assets/tilesets/walls.png");
		this.load.image("plusButton", "assets/buttons/plusButton.png");
		this.load.image("minusButton", "assets/buttons/minusButton.png");
		this.load.image("dragCursor", "assets/buttons/dragCursor.png");
		this.load.tilemapTiledJSON("map", "assets/cluster/map1.tmj");
	}

	create() {
		this.offsetX = this.cameras.main.width / 2;
		this.offsetY = this.cameras.main.height / 2;

		// Secondary camera for fixed UI elements (buttons, HUD)
		const uiCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
		uiCamera.setScroll(0, 0);

		const { map } = setupMap(this, this.offsetX, this.offsetY);
		setupCamera(this, map);
		setupInput(this);
		setupUI(this, this.cameras.main);
	}

	update(_time: number, _delta: number): void {
		// Game loop logic goes here
	}
}

export function startGame(parent: string | HTMLElement): Phaser.Game {
	return new Phaser.Game({
		type: Phaser.AUTO,
		parent,
		width: 1600,
		height: 800,
		backgroundColor: "#111125",
		scene: [GameScene],
		physics: {
			default: "arcade",
			arcade: {
				debug: false,
				gravity: { x: 0, y: 0 },
			},
		},
	});
}