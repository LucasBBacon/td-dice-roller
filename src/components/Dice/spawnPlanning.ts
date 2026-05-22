// #region Imports
import { SPAWN_PLANNING } from "../../config/spawnPlanning";
// #endregion

// #region Public Types
export type SpawnPoint = {
  x: number;
  z: number;
};

export type SpawnPlan = {
  throwPositions: SpawnPoint[];
  skipPositions: SpawnPoint[];
};
// #endregion

// #region Constants
const DIE_SIZE_UNITS = SPAWN_PLANNING.dieSizeUnits;
const SPACING_PADDING_UNITS = SPAWN_PLANNING.spacingPaddingUnits;
const MIN_CENTER_DISTANCE = DIE_SIZE_UNITS + SPACING_PADDING_UNITS;
const MAX_RANDOM_ATTEMPTS_PER_POINT = SPAWN_PLANNING.maxRandomAttemptsPerPoint;
// #endregion

// #region Shared Geometry Helpers
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const hasOverlap = (candidate: SpawnPoint, existing: SpawnPoint[], minDistance: number) => {
  const minDistanceSquared = minDistance * minDistance;

  return existing.some((point) => {
    const dx = point.x - candidate.x;
    const dz = point.z - candidate.z;
    return dx * dx + dz * dz < minDistanceSquared;
  });
};

// #endregion

// #region Skip Layout Planning

const createGridFallbackPoints = (
  count: number,
  width: number,
  height: number,
  margin: number,
  minDistance: number,
) => {
  const usableWidth = Math.max(0, width - margin * 2);
  const usableHeight = Math.max(0, height - margin * 2);
  const columns = Math.max(1, Math.floor(usableWidth / minDistance));
  const rows = Math.max(1, Math.floor(usableHeight / minDistance));
  const xStart = -usableWidth / 2 + minDistance / 2;
  const zStart = -usableHeight / 2 + minDistance / 2;

  const points: SpawnPoint[] = [];

  for (let row = 0; row < rows && points.length < count; row += 1) {
    for (let column = 0; column < columns && points.length < count; column += 1) {
      points.push({
        x: xStart + column * minDistance,
        z: zStart + row * minDistance,
      });
    }
  }

  return points;
};

const createNonOverlappingPoints = (
  count: number,
  width: number,
  height: number,
  margin: number,
  minDistance: number,
) => {
  if (count <= 0) {
    return [];
  }

  const usableWidth = Math.max(0, width - margin * 2);
  const usableHeight = Math.max(0, height - margin * 2);
  const minX = -usableWidth / 2;
  const maxX = usableWidth / 2;
  const minZ = -usableHeight / 2;
  const maxZ = usableHeight / 2;

  const points: SpawnPoint[] = [];

  for (let i = 0; i < count; i += 1) {
    let placed = false;

    for (let attempt = 0; attempt < MAX_RANDOM_ATTEMPTS_PER_POINT; attempt += 1) {
      const candidate = {
        x: randomInRange(minX, maxX),
        z: randomInRange(minZ, maxZ),
      };

      if (!hasOverlap(candidate, points, minDistance)) {
        points.push(candidate);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const fallback = createGridFallbackPoints(
        count - points.length,
        width,
        height,
        margin,
        minDistance,
      );

      fallback.forEach((candidate) => {
        if (points.length < count && !hasOverlap(candidate, points, minDistance)) {
          points.push(candidate);
        }
      });
      break;
    }
  }

  if (points.length < count) {
    const tightFallback = createGridFallbackPoints(
      count - points.length,
      width,
      height,
      0,
      DIE_SIZE_UNITS,
    );

    tightFallback.forEach((candidate) => {
      if (points.length < count && !hasOverlap(candidate, points, DIE_SIZE_UNITS)) {
        points.push(candidate);
      }
    });
  }

  return points;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
// #endregion

// #region Throw Layout Planning
const createBottomRightThrowPoints = (
  count: number,
  viewportWidth: number,
  viewportHeight: number,
  minDistance: number,
) => {
  if (count <= 0) {
    return [];
  }

  const edgeInset = SPAWN_PLANNING.throwEdgeInset;
  const maxX = viewportWidth / 2 - edgeInset;
  const maxZ = viewportHeight / 2 - edgeInset;
  const minX = -viewportWidth / 2 + edgeInset;
  const minZ = -viewportHeight / 2 + edgeInset;

  const spacing = minDistance * SPAWN_PLANNING.throwSpacingMultiplier;
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const jitter = minDistance * SPAWN_PLANNING.throwJitterMultiplier;

  const points: SpawnPoint[] = [];

  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / columns);
    const column = i % columns;
    const baseX = maxX - column * spacing;
    const baseZ = maxZ - row * spacing;

    let placed = false;

    for (let attempt = 0; attempt < SPAWN_PLANNING.throwPositionAttempts; attempt += 1) {
      const candidate = {
        x: clamp(baseX + randomInRange(-jitter, jitter), minX, maxX),
        z: clamp(baseZ + randomInRange(-jitter, jitter), minZ, maxZ),
      };

      if (!hasOverlap(candidate, points, minDistance)) {
        points.push(candidate);
        placed = true;
        break;
      }
    }

    if (!placed) {
      points.push({
        x: clamp(baseX, minX, maxX),
        z: clamp(baseZ, minZ, maxZ),
      });
    }
  }

  return points;
};
// #endregion

// #region Public Planner
export const buildSpawnPlan = (
  diceCount: number,
  viewportWidth: number,
  viewportHeight: number,
): SpawnPlan => {
  const skipMargin = SPAWN_PLANNING.skipMargin;

  const throwPositions = createBottomRightThrowPoints(
    diceCount,
    viewportWidth,
    viewportHeight,
    MIN_CENTER_DISTANCE,
  );

  const skipPositions = createNonOverlappingPoints(
    diceCount,
    viewportWidth,
    viewportHeight,
    skipMargin,
    MIN_CENTER_DISTANCE,
  );

  return {
    throwPositions,
    skipPositions,
  };
};
// #endregion
