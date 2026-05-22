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

	create() {
	// Center the map on screen
		const offsetX = this.cameras.main.width / 2
		const offsetY = this.cameras.main.height / 3

		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			const isoX = pointer.x - offsetX
			const isoY = pointer.y - offsetY
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
				const texture	= tileType === 0 ? 'grass'
								: tileType === 1 ? 'wall'
								: 'water'

				const tile = this.add.image(
					x + offsetX,
					y + offsetY,
					texture
				)

				// Set depth for correct layering
				tile.setDepth(col + row)
			}
		}
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
