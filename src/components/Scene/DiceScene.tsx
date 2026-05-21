import { OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Boundaries } from "./Boundaries";
import { D6 } from "../Dice/D6";
import { D20 } from "../Dice/D20";

export const DiceScene = () => {
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

      <Physics gravity={[0, -30, 0]}>
        <Boundaries />
        <D20 />
      </Physics>
    </Canvas>
  );
};
