import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { useDiceStore } from "../../store/useDiceStore";
import * as THREE from "three";
import { calculateUpFace } from "../../d6Calculation";

export function Die() {
  // ref to access Rapier's specific methods
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const rollCount = useDiceStore((s) => s.rollCount);
  const setResult = useDiceStore((s) => s.setResult);

  useEffect(() => {
    if (rollCount === 0 || !rigidBodyRef.current) return;

    // Reset the position to off-center
    rigidBodyRef.current.setTranslation({ x: 4, y: 5, z: 4 }, true);

    // Kill any existing momentum
    rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // Throw towards center
    rigidBodyRef.current.applyImpulse({ x: -4, y: -2, z: -4 }, true);

    // Apply random spin
    const spinStrength = 2;
    rigidBodyRef.current.applyTorqueImpulse(
      {
        x: (Math.random() - 0.5) * spinStrength,
        y: (Math.random() - 0.5) * spinStrength,
        z: (Math.random() - 0.5) * spinStrength,
      },
      true,
    );
  }, [rollCount]);

  const handleSleep = () => {
    if (!rigidBodyRef.current || rollCount === 0) return;

    // get the final rotation quaternion from rapier
    const { x, y, z, w } = rigidBodyRef.current.rotation();
    const quaternion = new THREE.Quaternion(x, y, z, w);

    const result = calculateUpFace(quaternion);
    setResult(result);
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 0.5, 0]}
      colliders="cuboid"
      restitution={0.6}
      friction={0.4}
      onSleep={handleSleep}
    >
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>
    </RigidBody>
  );
}
