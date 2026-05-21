import { useThree } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";

export const Boundaries = () => {
  const { viewport } = useThree();
  const wallThickness = 1;

  return (
    <>
      {/* floor */}
      <RigidBody
        type="fixed"
        position={[0, -1.5, 0]}
        colliders={false}
        restitution={0.1}
        friction={1}
      >
        <mesh>
          <boxGeometry args={[viewport.width, 3, viewport.height]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>

        <CuboidCollider args={[viewport.width / 2, 1.5, viewport.height / 2]} />
      </RigidBody>

      {/* Walls */}
      <RigidBody
        type="fixed"
        position={[0, 5, -viewport.height / 2 - wallThickness / 2]}
        colliders={false}
        restitution={0.1}
        friction={0.95}
      >
        <mesh>
          <boxGeometry args={[viewport.width, 10, wallThickness]} />
        </mesh>

        <CuboidCollider args={[viewport.width / 2, 10, wallThickness / 2]} />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[0, 5, viewport.height / 2 + wallThickness / 2]}
        colliders={false}
        restitution={0.1}
        friction={0.95}
      >
        <mesh>
          <boxGeometry args={[viewport.width, 10, wallThickness]} />
        </mesh>

        <CuboidCollider args={[viewport.width / 2, 5, wallThickness / 2]} />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[-viewport.width / 2 - wallThickness / 2, 5, 0]}
        colliders={false}
        restitution={0.1}
        friction={0.95}
      >
        <mesh>
          <boxGeometry args={[wallThickness, 10, viewport.height]} />
        </mesh>

        <CuboidCollider args={[wallThickness / 2, 5, viewport.height / 2]} />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[viewport.width / 2 + wallThickness / 2, 5, 0]}
        colliders={false}
        restitution={0.1}
        friction={0.95}
      >
        <mesh>
          <boxGeometry args={[wallThickness, 10, viewport.height]} />
        </mesh>

        <CuboidCollider args={[wallThickness / 2, 5, viewport.height / 2]} />
      </RigidBody>
    </>
  );
};
