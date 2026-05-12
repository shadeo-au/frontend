import type { GridSize, HouseRoom, HousePlan, Orientation, WallSide } from './types';

const COMPASS_ORDER: Orientation[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const WALL_BASE_INDEX: Record<WallSide, number> = {
  top: 0,
  right: 2,
  bottom: 4,
  left: 6,
};

export function orientationForWall(wall: WallSide, houseFacing: Orientation): Orientation {
  const facingIdx = COMPASS_ORDER.indexOf(houseFacing);
  const wallIdx = WALL_BASE_INDEX[wall];
  return COMPASS_ORDER[(facingIdx + wallIdx) % 8];
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rectsShareEdge(a: Rect, b: Rect): boolean {
  // share a horizontal edge
  const horizontalTouch =
    (a.y + a.h === b.y || b.y + b.h === a.y) &&
    Math.max(a.x, b.x) < Math.min(a.x + a.w, b.x + b.w);
  const verticalTouch =
    (a.x + a.w === b.x || b.x + b.w === a.x) &&
    Math.max(a.y, b.y) < Math.min(a.y + a.h, b.y + b.h);
  return horizontalTouch || verticalTouch;
}

export function rectTouchesBoundary(r: Rect, grid: GridSize): boolean {
  return r.x === 0 || r.y === 0 || r.x + r.w === grid.cols || r.y + r.h === grid.rows;
}

export function isRoomPlacementValid(
  candidate: Rect,
  existing: HouseRoom[],
  grid: GridSize,
): boolean {
  if (candidate.w < 1 || candidate.h < 1) return false;
  if (candidate.x < 0 || candidate.y < 0) return false;
  if (candidate.x + candidate.w > grid.cols) return false;
  if (candidate.y + candidate.h > grid.rows) return false;
  for (const r of existing) {
    if (rectsOverlap(candidate, r)) return false;
  }
  if (rectTouchesBoundary(candidate, grid)) return true;
  for (const r of existing) {
    if (rectsShareEdge(candidate, r)) return true;
  }
  return false;
}

export function normaliseRect(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(a.x - b.x) + 1;
  const h = Math.abs(a.y - b.y) + 1;
  return { x, y, w, h };
}

/**
 * Wall cell positions for a given room wall.
 * cellIndex runs left→right or top→bottom along the wall.
 * Returns the cell coords on the OUTSIDE of the wall (used for hit testing).
 */
export interface WallCell {
  cellIndex: number;
  // SVG coordinates of the midpoint of the wall cell
  cx: number;
  cy: number;
  // SVG endpoints of the wall segment (used for drawing window/door glyphs)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function wallCellsOfRoom(room: HouseRoom, wall: WallSide): WallCell[] {
  const out: WallCell[] = [];
  switch (wall) {
    case 'top':
      for (let i = 0; i < room.w; i++) {
        const x = room.x + i;
        out.push({ cellIndex: i, x1: x, y1: room.y, x2: x + 1, y2: room.y, cx: x + 0.5, cy: room.y });
      }
      break;
    case 'bottom':
      for (let i = 0; i < room.w; i++) {
        const x = room.x + room.w - 1 - i;
        out.push({ cellIndex: i, x1: x + 1, y1: room.y + room.h, x2: x, y2: room.y + room.h, cx: x + 0.5, cy: room.y + room.h });
      }
      break;
    case 'right':
      for (let i = 0; i < room.h; i++) {
        const y = room.y + i;
        out.push({ cellIndex: i, x1: room.x + room.w, y1: y, x2: room.x + room.w, y2: y + 1, cx: room.x + room.w, cy: y + 0.5 });
      }
      break;
    case 'left':
      for (let i = 0; i < room.h; i++) {
        const y = room.y + room.h - 1 - i;
        out.push({ cellIndex: i, x1: room.x, y1: y + 1, x2: room.x, y2: y, cx: room.x, cy: y + 0.5 });
      }
      break;
  }
  return out;
}

export function wallLength(room: HouseRoom, wall: WallSide): number {
  return wall === 'top' || wall === 'bottom' ? room.w : room.h;
}

/**
 * Check whether a wall cell at (room, wall, cellIndex) is on the OUTER boundary
 * (i.e. the wall faces outside the house, not another room).
 */
export function isExternalWallCell(
  plan: HousePlan,
  roomId: string,
  wall: WallSide,
  cellIndex: number,
): boolean {
  const room = plan.rooms.find((r) => r.id === roomId);
  if (!room) return false;
  const cell = wallCellsOfRoom(room, wall)[cellIndex];
  if (!cell) return false;

  // Find which grid cell sits on the OUTSIDE of this wall segment.
  // We look at the cell adjacent to (cx, cy) in the direction normal to the wall.
  let outsideX = 0;
  let outsideY = 0;
  switch (wall) {
    case 'top': outsideX = Math.floor(cell.cx); outsideY = cell.cy - 1; break;
    case 'bottom': outsideX = Math.floor(cell.cx); outsideY = cell.cy; break;
    case 'left': outsideX = cell.cx - 1; outsideY = Math.floor(cell.cy); break;
    case 'right': outsideX = cell.cx; outsideY = Math.floor(cell.cy); break;
  }
  // outside boundary?
  if (outsideX < 0 || outsideY < 0) return true;
  if (outsideX >= plan.gridSize.cols) return true;
  if (outsideY >= plan.gridSize.rows) return true;
  // is another room covering this outside cell?
  for (const r of plan.rooms) {
    if (r.id === roomId) continue;
    if (outsideX >= r.x && outsideX < r.x + r.w && outsideY >= r.y && outsideY < r.y + r.h) {
      return false;
    }
  }
  return true;
}

export function newRoomLabel(existing: HouseRoom[]): string {
  return `Room ${existing.length + 1}`;
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeEmptyPlan(grid: GridSize = { cols: 12, rows: 9 }): HousePlan {
  return {
    gridSize: grid,
    houseFacing: 'N',
    floorLevel: 'unknown',
    frontDoorId: null,
    rooms: [],
    windows: [],
    doors: [],
  };
}
