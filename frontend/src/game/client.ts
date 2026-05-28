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
	private highlightTile!: Phaser.GameObjects.Image

preload() {
    this.load.image('highlight', 'assets/tilehighlight.png');
    this.load.image('floors', 'assets/floors.png');
    this.load.image('props',  'assets/props.png');
    this.load.image('walls',  'assets/walls.png');
    // Load the tmj as plain JSON, not a tilemap
    this.load.json('map', 'assets/cluster/clusterV3.tmj');
}

create() {
    this.offsetX = this.cameras.main.width / 2;
    this.offsetY = this.cameras.main.height / 3;

    // GID ranges from your .tmj tilesets block:
    // floors: GID 1–4, props: GID 5–8, walls: GID 9+
    const GID_TO_TEXTURE: Record<number, string> = {
        1: 'floors', 2: 'floors', 3: 'floors', 4: 'floors',
        5: 'props',  6: 'props',  7: 'props',  8: 'props',
        9: 'walls',  10: 'walls', 11: 'walls', 12: 'walls',
        13: 'walls', 14: 'walls',
    };

    const mapJson = this.cache.json.get('map');

    for (const layer of mapJson.layers) {
        for (const chunk of layer.chunks) {
            for (let i = 0; i < chunk.data.length; i++) {
                const gid = chunk.data[i];
                if (gid === 0) continue;

                const texture = GID_TO_TEXTURE[gid];
                if (!texture) continue;

                // chunk.x/y are tile coords, i gives row/col within chunk
                const col = chunk.x + (i % chunk.width);
                const row = chunk.y + Math.floor(i / chunk.width);

                const { x, y } = cartToIso(col, row);
                const tile = this.add.image(
                    x + this.offsetX,
                    y + this.offsetY,
                    texture
                );
                tile.setDepth(col + row);
            }
        }
    }

    this.highlightTile = this.add.image(0, 0, 'highlight');
    this.highlightTile.setVisible(false);
}

	update(time: number, delta: number): void {
		const worldX = this.input.activePointer.worldX - this.offsetX
		const worldY = this.input.activePointer.worldY - this.offsetY
		const { x: hoverX, y: hoverY } = isoToCart(worldX, worldY)

		if (hoverX >= 0 && hoverX < this.mapData[0].length && 
			hoverY >= 0 && hoverY < this.mapData.length) {
				const isoPos = cartToIso(hoverX, hoverY)
				this.highlightTile.setPosition(isoPos.x + this.offsetX, isoPos.y + this.offsetY)
				this.highlightTile.setDepth(hoverX + hoverY + 0.5)
				this.highlightTile.setVisible(true)
		} else {
			this.highlightTile.setVisible(false)
		}

	}
}

function cartToIso(cartX: number, cartY: number): { x: number, y: number } {
	const x = (cartX - cartY) * (TILE_WIDTH / 2);
	const y = (cartX + cartY) * (TILE_HEIGHT / 2);
	return { x, y };
}

function isoToCart(isoX: number, isoY: number): { x: number, y: number } {
	const x = Math.floor((isoY / (TILE_HEIGHT / 2) + isoX / (TILE_WIDTH / 2)) / 2);
	const y = Math.floor((isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2);
	return { x, y };
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
			default: 'arcade',
			arcade: {
				debug: false,
				gravity: { x: 0, y: 0 },
			},
		},
		// scene: [MenuScene, GameScene],
	});
}
