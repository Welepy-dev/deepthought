import Phaser from "phaser";
import { clampZoom } from "./setupCamera";

// Total width of the React sidebar (64px nav + 288px panel)
const REACT_SIDEBAR_WIDTH = 352;

export function setupUI(
	scene: Phaser.Scene,
	mainCamera: Phaser.Cameras.Scene2D.Camera,
): void {
	const padding = 12;
	const spacing = 8;
	const { width } = scene.cameras.main;

	// Position zoom controls just to the left of the React sidebar
	const zoomX = width - REACT_SIDEBAR_WIDTH - padding;

	const plusButton = scene.add
		.image(zoomX, padding, "plusButton")
		.setOrigin(1, 0)
		.setInteractive()
		.setScrollFactor(0)
		.setTint(0xaaaaaa);

	plusButton.on("pointerdown", () => clampZoom(scene, +0.1));
	plusButton.on("pointerover", () => plusButton.clearTint());
	plusButton.on("pointerout", () => plusButton.setTint(0xaaaaaa));

	const minusButton = scene.add
		.image(zoomX, padding + plusButton.displayHeight + spacing, "minusButton")
		.setOrigin(1, 0)
		.setInteractive()
		.setScrollFactor(0)
		.setTint(0xaaaaaa);

	minusButton.on("pointerdown", () => clampZoom(scene, -0.1));
	minusButton.on("pointerover", () => minusButton.clearTint());
	minusButton.on("pointerout", () => minusButton.setTint(0xaaaaaa));

	mainCamera.ignore([plusButton, minusButton]);
}
