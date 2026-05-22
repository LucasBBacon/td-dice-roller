// #region Imports
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useMemo } from "react";
import { buildSpawnPlan } from "../Dice/spawnPlanning";
import { Boundaries } from "./Boundaries";
import { Die } from "../Dice/Die";
import { SCENE_CONFIG } from "../../config/scenePhysics";
import { useDiceStore } from "../../store/useDiceStore";
// #endregion

// #region Dice Layer
const DiceRollLayer = () => {
  const activeDice = useDiceStore((state) => state.activeDice);
  const { viewport } = useThree();

  const spawnPlan = useMemo(
    () => buildSpawnPlan(activeDice.length, viewport.width, viewport.height),
    [activeDice, viewport.height, viewport.width],
  );

  return (
    <>
      {activeDice.map((die, index) => (
        <Die
          key={die.id}
          dieType={die.dieType}
          rollId={die.rollId}
          throwStartPosition={spawnPlan.throwPositions[index]}
          skipSnapPosition={spawnPlan.skipPositions[index]}
        />
      ))}
    </>
  );
};
// #endregion

// #region Scene Root
export const DiceScene = () => {
  const showPhysicsDebug =
    import.meta.env.DEV && import.meta.env.VITE_RAPIER_DEBUG === "true";
  const { camera, lighting, physics } = SCENE_CONFIG;
  const gravity: [number, number, number] = [...physics.gravity];

  return (
    <Canvas style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}>
      <OrthographicCamera
        makeDefault
        position={camera.position}
        zoom={camera.zoom}
        rotation={camera.rotation}
      />
      <ambientLight intensity={lighting.ambientIntensity} />
      <directionalLight
        position={lighting.directionalPosition}
        intensity={lighting.directionalIntensity}
        castShadow
      />

      <Physics gravity={gravity} debug={showPhysicsDebug}>
        <Boundaries />
        <DiceRollLayer />
      </Physics>

      <OrbitControls />
    </Canvas>
  );
};
// #endregion
