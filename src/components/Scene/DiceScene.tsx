import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useMemo } from "react";
import { buildSpawnPlan } from "../Dice/spawnPlanning";
import { Boundaries } from "./Boundaries";
import { Die } from "../Dice/Die";
import { useDiceStore } from "../../store/useDiceStore";

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

export const DiceScene = () => {
  const showPhysicsDebug =
    import.meta.env.DEV && import.meta.env.VITE_RAPIER_DEBUG === "true";

  return (
    <Canvas style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}>
      <OrthographicCamera
        makeDefault
        position={[0, 10, 0]}
        zoom={50}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

      <Physics gravity={[0, -30, 0]} debug={showPhysicsDebug}>
        <Boundaries />
        <DiceRollLayer />
      </Physics>

      <OrbitControls />
    </Canvas>
  );
};
