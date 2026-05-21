import { useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";

export const Boundaries = () => {
  const { viewport } = useThree();
  const wallThickness = 1;

  return (
    <>
      {/* floor */}
      <RigidBody type="fixed" position={[0, -0.5, 0]} colliders="cuboid">
        <mesh>
          <boxGeometry args={[viewport.width, 1, viewport.height]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Walls */}
      <RigidBody type="fixed" position={[0, 5, 0]} colliders="cuboid">
        <mesh>
          <boxGeometry args={[viewport.width, 10, wallThickness]} />
          <meshStandardMaterial color="#ff4444" opacity={1} />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[0, 5, viewport.height / 2 + wallThickness / 2]}
        colliders="cuboid"
      >
        <mesh>
          <boxGeometry args={[viewport.width, 10, wallThickness]} />
          <meshStandardMaterial color="#ff4444" opacity={1} />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[-viewport.width / 2 - wallThickness / 2, 5, 0]}
        colliders="cuboid"
      >
        <mesh>
          <boxGeometry args={[wallThickness, 10, viewport.height]} />
          <meshStandardMaterial color="#ff4444" opacity={1} />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[viewport.width / 2 + wallThickness / 2, 5, 0]}
        colliders="cuboid"
      >
        <mesh>
          <boxGeometry args={[wallThickness, 10, viewport.height]} />
          <meshStandardMaterial color="#ff4444" opacity={1} />
        </mesh>
      </RigidBody>
    </>
  );
};
