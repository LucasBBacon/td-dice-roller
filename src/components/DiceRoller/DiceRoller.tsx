import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Die } from "../Die/Die";
import { useDiceStore } from "../../store/useDiceStore";

export default function DiceRoller() {
  const triggerRoll = useDiceStore((s) => s.triggerRoll);
  const result = useDiceStore((s) => s.result);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* UI Overlay */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
        <button
          onClick={triggerRoll}
          style={{ padding: "10px 20px", fontSize: "18px", cursor: "pointer" }}
        >
          Roll Dice
        </button>
        {result && (
          <h2 style={{ color: "white", marginTop: "10px" }}>
            Result: {result}
          </h2>
        )}
      </div>

      <Canvas orthographic camera={{ position: [0, 10, 0], zoom: 50, up: [0, 0, -1] }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} castShadow intensity={1.5} />

        <Physics>
          <RigidBody type="fixed" restitution={0.2} friction={0.8}>
            <mesh position={[0, -0.5, 0]} receiveShadow>
              <boxGeometry args={[100, 1, 100]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          </RigidBody>

          <Die />
        </Physics>
      </Canvas>
    </div>
  );
}
