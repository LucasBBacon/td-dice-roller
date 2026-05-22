// #region Imports
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useEffect, useMemo } from "react";
import { buildSpawnPlan } from "../Dice/spawnPlanning";
import { Boundaries } from "./Boundaries";
import { Die } from "../Dice/Die";
import { DIE_LAUNCH_CONFIG } from "../../config/dicePhysics";
import { SCENE_CONFIG } from "../../config/scenePhysics";
import { useDiceStore } from "../../store/useDiceStore";
// #endregion

// #region Dice Layer
const DiceRollLayer = () => {
  const activeDice = useDiceStore((state) => state.activeDice);
  const activeRollId = useDiceStore((state) => state.activeRollId);
  const beginRollLaunch = useDiceStore((state) => state.beginRollLaunch);
  const abortRoll = useDiceStore((state) => state.abortRoll);
  const expectedDiceCount = useDiceStore((state) => state.expectedDiceCount);
  const isRolling = useDiceStore((state) => state.isRolling);
  const readyDiceCount = useDiceStore((state) => state.readyDiceCount);
  const readyRetryCount = useDiceStore((state) => state.readyRetryCount);
  const retrySpawnReadiness = useDiceStore((state) => state.retrySpawnReadiness);
  const rollPhase = useDiceStore((state) => state.rollPhase);
  const { viewport } = useThree();

  const spawnPlan = useMemo(
    () => buildSpawnPlan(activeDice.length, viewport.width, viewport.height),
    [activeDice, viewport.height, viewport.width],
  );

  useEffect(() => {
    if (
      !isRolling ||
      rollPhase !== "spawning" ||
      expectedDiceCount <= 0 ||
      readyDiceCount >= expectedDiceCount
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      const state = useDiceStore.getState();
      if (
        !state.isRolling ||
        state.rollPhase !== "spawning" ||
        state.activeRollId !== activeRollId ||
        state.readyDiceCount >= state.expectedDiceCount
      ) {
        return;
      }

      if (state.readyRetryCount < 1) {
        retrySpawnReadiness(activeRollId);
        return;
      }

      abortRoll(activeRollId);
    }, DIE_LAUNCH_CONFIG.batchReadyTimeoutMs);

    return () => clearTimeout(timeout);
  }, [
    abortRoll,
    activeRollId,
    expectedDiceCount,
    isRolling,
    readyDiceCount,
    readyRetryCount,
    retrySpawnReadiness,
    rollPhase,
  ]);

  useEffect(() => {
    if (
      !isRolling ||
      rollPhase !== "spawning" ||
      expectedDiceCount <= 0 ||
      readyDiceCount < expectedDiceCount
    ) {
      return;
    }

    const settleTimer = setTimeout(() => {
      beginRollLaunch(activeRollId);
    }, DIE_LAUNCH_CONFIG.batchReadySettleDelayMs);

    return () => clearTimeout(settleTimer);
  }, [
    activeRollId,
    beginRollLaunch,
    expectedDiceCount,
    isRolling,
    readyDiceCount,
    rollPhase,
  ]);

  return (
    <>
      {activeDice.map((die, index) => (
        <Die
          key={die.id}
          dieId={die.id}
          dieType={die.dieType}
          dieIndex={die.index}
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
