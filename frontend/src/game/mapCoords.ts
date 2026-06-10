/**
 * mapCoords.ts
 *
 * ─── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * Phaser and Tiled work on a 64×64 "world grid". Most of it is empty (GID 0).
 * The actual walkable floor is a small L-shaped region somewhere in the middle
 * of that grid. Working with raw world coords like (28, 18) or (49, 33) in
 * game logic is error-prone and meaningless.
 *
 * This file defines a "room coordinate" system with a human-chosen origin so
 * that every tile in the room has a coord that makes spatial sense.
 *
 *
 * ─── THE MAP LAYOUT (world grid) ─────────────────────────────────────────────
 *
 *   col:  0        14        28                 49
 *                             |                  |
 *   row 18:                  [======= Zone A ====]   GID 3  (22 cols × 32 rows)
 *                             |                  |
 *   row 27:  [== Zone B ==]  [======= Zone A ====]   GID 4 joins
 *             |           |   |                  |   (14 cols × 18 rows)
 *   row 44:  [== Zone B ==]  [======= Zone A ====]   GID 4 ends
 *                             |                  |
 *   row 49:                  [======= Zone A ====]   GID 3 ends
 *
 *
 * ─── CHOOSING THE ORIGIN ─────────────────────────────────────────────────────
 *
 * The origin (0, 0) was placed at the MIDDLE OF THE RIGHT BORDER of Zone A.
 * This tile is the room entrance — the point players arrive from.
 *
 * Right border of Zone A = world col 49  (maxCol of Zone A)
 * Middle row of Zone A   = world row 33  (minRow 18 + half of 32 rows = 18 + 16 = 34... 
 *                                         but we use floor((18+49)/2) = 33 for odd splits)
 *
 *   ← TO CHANGE THE ORIGIN: update ORIGIN_WORLD_X and ORIGIN_WORLD_Y below.
 *      Everything else derives from those two constants automatically.
 *
 *
 * ─── HOW THE CONVERSION WORKS ────────────────────────────────────────────────
 *
 * The conversion is just a translation (shift), not a rotation or scale.
 * We pick a world tile as "the zero point" and express every other tile
 * as a signed offset from it:
 *
 *   local_x = world_x - ORIGIN_WORLD_X
 *   local_y = world_y - ORIGIN_WORLD_Y
 *
 * And the reverse:
 *
 *   world_x = local_x + ORIGIN_WORLD_X
 *   world_y = local_y + ORIGIN_WORLD_Y
 *
 * So a tile at world (49, 33) becomes local (0,  0)  ← entrance
 *    a tile at world (28, 18) becomes local (-21, -15) ← far top-left corner
 *    a tile at world (49, 49) becomes local (0,  16)  ← bottom of right border
 *    a tile at world (14, 27) becomes local (-35, -6) ← far left Zone B corner
 *
 * Negative X = further into the room (west)
 * Negative Y = higher up in the room  (north)
 * Positive Y = lower in the room      (south)
 *
 * This mirrors how Habbo rooms work: the entrance is the reference point,
 * and the room extends inward from there.
 *
 *
 * ─── THREE COORDINATE LAYERS IN THIS CODEBASE ────────────────────────────────
 *
 *   local  (lx, ly)   Game logic, server messages, player positions.
 *                     Origin = entrance tile. Use these everywhere in gameplay.
 *
 *   world  (wx, wy)   Phaser/Tiled internal grid (64×64).
 *                     Use only when talking to Phaser: cartToIso(), tilemap queries.
 *
 *   screen (sx, sy)   Pixel position on canvas after cartToIso() + offset.
 *                     Use only for rendering/positioning Phaser game objects.
 *
 *
 * ─── PUBLIC API ──────────────────────────────────────────────────────────────
 *
 *   toWorld(lx, ly)              → { wx, wy }   local  → world
 *   toLocal(wx, wy)              → { lx, ly }   world  → local
 *   isValidTile(lx, ly)          → boolean      is this local coord on the floor?
 *   isValidWorldTile(wx, wy)     → boolean      same check, world coords
 *   findNearestValidTile(lx, ly) → { lx, ly }   nearest walkable tile to a point
 */

// ─── ORIGIN ───────────────────────────────────────────────────────────────────
//
// ← CHANGE THESE TWO LINES to move the origin to a different tile.
//    All conversions, valid-tile checks, and spawn logic update automatically.
//
//   ORIGIN_WORLD_X: world column of the chosen (0,0) tile
//   ORIGIN_WORLD_Y: world row    of the chosen (0,0) tile
//
//   Current choice: middle of the right border of Zone A
//     right border = col 49  (Zone A maxCol)
//     middle row   = floor((18 + 49) / 2) = 33
//
export const ORIGIN_WORLD_X = 48; // world col → local x = 0
export const ORIGIN_WORLD_Y = 33; // world row → local y = 0


// ─── FLOOR ZONE DEFINITIONS (world coords) ───────────────────────────────────
//
// These match the actual tile data in map1.tmj.
// ← Update if you redesign the map in Tiled.
//
const ZONE_A = { minCol: 28, maxCol: 49, minRow: 18, maxRow: 49 }; // GID 3
const ZONE_B = { minCol: 14, maxCol: 27, minRow: 27, maxRow: 44 }; // GID 4


// ─── VALID TILE SET ───────────────────────────────────────────────────────────
//
// Pre-built at startup from the zone definitions above.
// Stored as "lx,ly" strings for O(1) lookup.
// Local coords, so the set automatically reflects any origin change.
//
function buildValidSet(): Set<string> {
    const s = new Set<string>();

    for (let wy = ZONE_A.minRow; wy <= ZONE_A.maxRow; wy++) {
        for (let wx = ZONE_A.minCol; wx <= ZONE_A.maxCol; wx++) {
            const { lx, ly } = toLocal(wx, wy);
            s.add(`${lx},${ly}`);
        }
    }

    for (let wy = ZONE_B.minRow; wy <= ZONE_B.maxRow; wy++) {
        for (let wx = ZONE_B.minCol; wx <= ZONE_B.maxCol; wx++) {
            const { lx, ly } = toLocal(wx, wy);
            s.add(`${lx},${ly}`);
        }
    }

    return s;
}

// ─── CONVERSIONS ─────────────────────────────────────────────────────────────

/** Local room coords → world tile coords (input for cartToIso / Phaser) */
export function toWorld(lx: number, ly: number): { wx: number; wy: number } {
    return {
        wx: lx + ORIGIN_WORLD_X,
        wy: ly + ORIGIN_WORLD_Y,
    };
}

/** World tile coords → local room coords (use for all game logic) */
export function toLocal(wx: number, wy: number): { lx: number; ly: number } {
    return {
        lx: wx - ORIGIN_WORLD_X,
        ly: wy - ORIGIN_WORLD_Y,
    };
}

// Built after toLocal is defined (buildValidSet calls toLocal)
const VALID_TILES: Set<string> = buildValidSet();

// ─── VALIDATION ──────────────────────────────────────────────────────────────

/** True if local coord (lx, ly) is a walkable floor tile */
export function isValidTile(lx: number, ly: number): boolean {
    return VALID_TILES.has(`${lx},${ly}`);
}

/** Same check using world coords */
export function isValidWorldTile(wx: number, wy: number): boolean {
    const { lx, ly } = toLocal(wx, wy);
    return isValidTile(lx, ly);
}

/**
 * Find the nearest walkable tile to a preferred local position.
 * Searches outward in expanding squares until it finds one.
 * Returns local coords, or null if nothing found within 40 tiles.
 */
export function findNearestValidTile(
    preferLX: number,
    preferLY: number,
): { lx: number; ly: number } | null {
    if (isValidTile(preferLX, preferLY)) return { lx: preferLX, ly: preferLY };

    for (let radius = 1; radius <= 40; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                const lx = preferLX + dx;
                const ly = preferLY + dy;
                if (isValidTile(lx, ly)) return { lx, ly };
            }
        }
    }
    return null;
}