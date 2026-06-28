import Phaser from "phaser";
import { clampZoom } from "./setupCamera";

const SIDEBAR_WIDTH = 64;

export function setupUI(
	scene: Phaser.Scene,
	mainCamera: Phaser.Cameras.Scene2D.Camera,
): void {
	const padding = 12;
	const spacing = 8;
	const { width, height } = scene.cameras.main;

	const sidebar = scene.add
		.rectangle(width - SIDEBAR_WIDTH / 2, height / 2, SIDEBAR_WIDTH, height, 0x000000, 0.6)
		.setScrollFactor(0);

	const plusButton = scene.add
		.image(width - SIDEBAR_WIDTH - padding, padding, "plusButton")
		.setOrigin(1, 0)
		.setInteractive()
		.setScrollFactor(0)
		.setTint(0xaaaaaa);

	plusButton.on("pointerdown", () => clampZoom(scene, +0.1));
	plusButton.on("pointerover", () => plusButton.clearTint());
	plusButton.on("pointerout", () => plusButton.setTint(0xaaaaaa));

	const minusButton = scene.add
		.image(width - SIDEBAR_WIDTH - padding, padding + plusButton.displayHeight + spacing, "minusButton")
		.setOrigin(1, 0)
		.setInteractive()
		.setScrollFactor(0)
		.setTint(0xaaaaaa);

	minusButton.on("pointerdown", () => clampZoom(scene, -0.1));
	minusButton.on("pointerover", () => minusButton.clearTint());
	minusButton.on("pointerout", () => minusButton.setTint(0xaaaaaa));

	// Keep UI elements out of the main world camera
	mainCamera.ignore([sidebar, plusButton, minusButton]);
}