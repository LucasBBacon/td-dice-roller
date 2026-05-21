import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import { useDiceStore } from "../../store/useDiceStore";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export const D20 = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { triggerRoll, skipAnimation, addRollResult } = useDiceStore();

  // load model and its embedded materials
  // nodes contain the geometry, materials contain the blender materials
  const { nodes, materials } = useGLTF("/models/d20.glb");
  const locators = useMemo(() => {
    return Object.values(nodes).filter((node) =>
      node.name.startsWith("value_"),
    );
  }, [nodes]);

  useEffect(() => {
    if (triggerRoll <= 0 || !rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;

    // reset position
    rb.setTranslation({ x: 3, y: 5, z: 4 }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // apply random impulses to simulate rolling
    const throwImpulse = {
      x: (Math.random() - 0.5) * -100,
      y: Math.random() * 5,
      z: (Math.random() - 0.5) * -100,
    };
    const torqueImpulse = {
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 5,
    };

    rb.applyImpulse(throwImpulse, true);
    rb.applyTorqueImpulse(torqueImpulse, true);
  }, [triggerRoll, skipAnimation]);

  const handleSleep = () => {
    if (!rigidBodyRef.current || skipAnimation) return;

    // Get the die's final rotation in the physics world
    const rotation = rigidBodyRef.current.rotation();
    const quaternion = new THREE.Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w,
    );

    let rolledValue = 1;
    let maxY = -Infinity;

    locators.forEach((locator) => {
      // clone to avoid mutating original GLFT code
      const localPos = locator.position.clone();
      // rotate pos by die's current world rotation
      const worldOrientedPos = localPos.applyQuaternion(quaternion);
      // locator pointing highest is the rolled face
      if (worldOrientedPos.y > maxY) {
        maxY = worldOrientedPos.y;
        // extract number from name
        rolledValue = parseInt(locator.name.split("_")[1], 10);
      }
    });

    addRollResult(rolledValue);
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="hull"
      restitution={0.6}
      friction={0.5}
      onSleep={handleSleep}
      ccd={true}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.D20 as THREE.Mesh).geometry}
        material={materials.D20}
      />
    </RigidBody>
  );
};

useGLTF.preload("/models/d20.glb");
