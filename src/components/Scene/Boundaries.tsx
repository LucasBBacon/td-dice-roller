import { useThree } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { SCENE_CONFIG } from "../../config/scenePhysics";

export const Boundaries = () => {
  const { viewport } = useThree();
  const { boundaries } = SCENE_CONFIG;
  const wallThickness = boundaries.wallThickness;

  return (
    <>
      {/* floor */}
      <RigidBody
        type="fixed"
        position={[0, boundaries.floorY, 0]}
        colliders={false}
        restitution={boundaries.floorRestitution}
        friction={boundaries.floorFriction}
      >
        <mesh>
          <boxGeometry args={[viewport.width, boundaries.floorHeight, viewport.height]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>

        <CuboidCollider
          args={[
            viewport.width / 2,
            boundaries.floorHeight / 2,
            viewport.height / 2,
          ]}
        />
      </RigidBody>

      {/* Walls */}
      <RigidBody
        type="fixed"
        position={[0, boundaries.wallY, -viewport.height / 2 - wallThickness / 2]}
        colliders={false}
        restitution={boundaries.wallRestitution}
        friction={boundaries.wallFriction}
      >
        <mesh>
          <boxGeometry args={[viewport.width, boundaries.wallHeight, wallThickness]} />
        </mesh>

        <CuboidCollider
          args={[viewport.width / 2, boundaries.wallHeight, wallThickness / 2]}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[0, boundaries.wallY, viewport.height / 2 + wallThickness / 2]}
        colliders={false}
        restitution={boundaries.wallRestitution}
        friction={boundaries.wallFriction}
      >
        <mesh>
          <boxGeometry args={[viewport.width, boundaries.wallHeight, wallThickness]} />
        </mesh>

        <CuboidCollider
          args={[viewport.width / 2, boundaries.wallY, wallThickness / 2]}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[-viewport.width / 2 - wallThickness / 2, boundaries.wallY, 0]}
        colliders={false}
        restitution={boundaries.wallRestitution}
        friction={boundaries.wallFriction}
      >
        <mesh>
          <boxGeometry args={[wallThickness, boundaries.wallHeight, viewport.height]} />
        </mesh>

        <CuboidCollider
          args={[wallThickness / 2, boundaries.wallY, viewport.height / 2]}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[viewport.width / 2 + wallThickness / 2, boundaries.wallY, 0]}
        colliders={false}
        restitution={boundaries.wallRestitution}
        friction={boundaries.wallFriction}
      >
        <mesh>
          <boxGeometry args={[wallThickness, boundaries.wallHeight, viewport.height]} />
        </mesh>

        <CuboidCollider
          args={[wallThickness / 2, boundaries.wallY, viewport.height / 2]}
        />
      </RigidBody>
    </>
  );
};
