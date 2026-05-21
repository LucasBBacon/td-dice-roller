import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { useDiceStore } from "../../store/useDiceStore";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export const D20 = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { triggerRoll, skipAnimation, addRollResult } = useDiceStore();

  // load model and its embedded materials
  // nodes contain the geometry, materials contain the blender materials
  const { nodes, materials } = useGLTF("/models/d20.glb");

  useEffect(() => {
    if (triggerRoll <= 0 || !rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;

    // reset position
    rb.setTranslation({ x: 3, y: 5, z: 4 }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // apply random impulses to simulate rolling
    const throwImpulse = {
      x: (Math.random() - 0.5) * -10,
      y: Math.random() * 5,
      z: (Math.random() - 0.5) * -10,
    };
    const torqueImpulse = {
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 5,
    };

    rb.applyImpulse(throwImpulse, true);
    rb.applyTorqueImpulse(torqueImpulse, true);
  }, [triggerRoll, skipAnimation]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="hull"
      restitution={0.6}
      friction={0.5}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.Icosphere as THREE.Mesh).geometry}
        material={materials.Material}
      />
    </RigidBody>
  );
};

useGLTF.preload("/models/d20.glb");
