import Phaser from "phaser";

const TILE_HEIGHT = 32;
const TILE_WIDTH = 64;

class GameScene extends Phaser.Scene {
	private mapData: number[][] = [
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
	]
	private offsetX = 0
	private offsetY = 0

	preload() {
		// Inside your Phaser preload() function:
		this.load.image('wooden-floor', 'assets/woodenfloor.png');
	}

	create() {
	// Center the map on screen
		this.offsetX = this.cameras.main.width / 2
		this.offsetY = this.cameras.main.height / 3

		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			const isoX = pointer.x - this.offsetX
			const isoY = pointer.y - this.offsetY
			let { x: tileX, y: tileY } = isoToCart(isoX, isoY)
			
			tileX = Math.floor(tileX)
			tileY = Math.floor(tileY)
			
			if (tileX >= 0 && tileX < this.mapData[0].length && 
				tileY >= 0 && tileY < this.mapData.length) {
					console.log(`Clicked tile: (${tileX}, ${tileY}) - Type: ${this.mapData[tileY][tileX]}`)
			}
		})

		for (let row = 0; row < this.mapData.length; row++) {
			for (let col = 0; col < this.mapData[row].length; col++) {
				const tileType = this.mapData[row][col]
				const { x, y } = cartToIso(col, row)

				// Choose tile texture based on type
				if (tileType === 0) continue // Skip empty tiles
				if (tileType === 1) var texture = 'wooden-floor' // Placeholder for different types

				const tile = this.add.image(
					x + this.offsetX,
					y + this.offsetY,
					texture
				)

				// Set depth for correct layering
				tile.setDepth(col + row)
			}
		}

	}

	update(time: number, delta: number): void {
		const worldX = this.input.activePointer.worldX - this.offsetX
		const worldY = this.input.activePointer.worldY - this.offsetY
		const { x: tileX, y: tileY } = isoToCart(worldX, worldY)
		// console.log(`Mouse at world coords: (${worldX.toFixed(2)}, ${worldY.toFixed(2)}) - Tile coords: (${tileX.toFixed(2)}, ${tileY.toFixed(2)})`)
	}

}

function cartToIso(cartX: number, cartY: number): { x: number, y: number } {
	const x = (cartX - cartY) * (TILE_WIDTH / 2);
	const y = (cartX + cartY) * (TILE_HEIGHT / 2);
	return { x, y };
}

function isoToCart(isoX: number, isoY: number): { x: number, y: number } {
	const x = (isoY / (TILE_HEIGHT / 2) + isoX / (TILE_WIDTH / 2)) / 2;
	const y = (isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2;
	return { x, y };
}

export function startGame(parent: string | HTMLElement): Phaser.Game {
	return new Phaser.Game({
		type: Phaser.AUTO,
		parent,
		width: 800,
		height: 600,
		backgroundColor: "#4488cc",
		scene: [GameScene],
		physics: {
			default: 'arcade',
			arcade: {
				debug: false,
				gravity: { x: 0, y: 0 },
			},
		},
		// scene: [MenuScene, GameScene],
	});
}
