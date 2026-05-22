// #region Scene Configuration
export const SCENE_CONFIG = {
  camera: {
    position: [0, 10, 0] as const,
    zoom: 50,
    rotation: [-Math.PI / 2, 0, 0] as const,
  },
  lighting: {
    ambientIntensity: 0.5,
    directionalPosition: [5, 10, 5] as const,
    directionalIntensity: 1,
  },
  physics: {
    gravity: [0, -30, 0],
  },
  boundaries: {
    wallThickness: 1,
    floorY: -1.5,
    floorHeight: 3,
    floorRestitution: 0.1,
    floorFriction: 1,
    wallY: 5,
    wallHeight: 10,
    wallRestitution: 0.1,
    wallFriction: 0.95,
  },
} as const;
// #endregion