import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useDiceStore } from "../../store/useDiceStore";
import {
  THROW_ANGLE_MAX_DEG,
  THROW_ANGLE_MIN_DEG,
} from "../../config/dicePhysics";
import { useGLTF } from "@react-three/drei";

export const D6 = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const triggerRoll = useDiceStore((state) => state.triggerRoll);
  const skipAnimation = useDiceStore((state) => state.skipAnimation);
  const addRollResult = useDiceStore((state) => state.addRollResult);
  const { viewport } = useThree();

  // load model and its embedded materials
  // nodes contain the geometry, materials contain the blender materials
  const { nodes, materials } = useGLTF("/models/D6.glb");
  const locators = useMemo(() => {
    return Object.values(nodes).filter((node) =>
      node.name.startsWith("value_"),
    );
  }, [nodes]);

  useEffect(() => {
    if (triggerRoll <= 0 || !rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;

    if (skipAnimation) {
      // snap to a random face and a random position on the board
      const randomFace = locators[Math.floor(Math.random() * locators.length)];
      const localDirection = randomFace.position.clone().normalize();
      const globalUp = new THREE.Vector3(0, 1, 0);
      const snapRotation = new THREE.Quaternion().setFromUnitVectors(
        localDirection,
        globalUp,
      );
      const randomYaw = new THREE.Quaternion().setFromAxisAngle(
        globalUp,
        Math.random() * Math.PI * 2,
      );
      snapRotation.premultiply(randomYaw);
      const padding = 1;
      rb.setTranslation(
        {
          x: (Math.random() - 0.5) * (viewport.width - padding * 2),
          y: 0.5,
          z: (Math.random() - 0.5) * (viewport.height - padding * 2),
        },
        true,
      );
      setTimeout(
        () => addRollResult(parseInt(randomFace.name.split("_")[1], 10)),
        100,
      );
    } else {
      const spawnMargin = 1.5;
      const throwStartX = viewport.width / 2 - spawnMargin;
      const throwStartZ = viewport.height / 2 - spawnMargin;

      // reset position
      rb.setTranslation({ x: throwStartX, y: 5, z: throwStartZ }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

      const throwImpulseMultiplier = 70;
      const torqueImpulseMultiplier = 20;
      const throwAngleDeg = THREE.MathUtils.randFloat(
        THROW_ANGLE_MIN_DEG,
        THROW_ANGLE_MAX_DEG,
      );
      const throwAngleRad = THREE.MathUtils.degToRad(throwAngleDeg);
      const throwStrength = THREE.MathUtils.randFloat(
        throwImpulseMultiplier * 0.7,
        throwImpulseMultiplier,
      );

      // apply random impulses to simulate rolling
      const throwImpulse = {
        x: Math.cos(throwAngleRad) * throwStrength,
        y: Math.random() * 2.2,
        z: Math.sin(throwAngleRad) * throwStrength,
      };
      const torqueImpulse = {
        x: (Math.random() - 0.5) * torqueImpulseMultiplier,
        y: (Math.random() - 0.5) * torqueImpulseMultiplier,
        z: (Math.random() - 0.5) * torqueImpulseMultiplier,
      };

      rb.applyImpulse(throwImpulse, true);
      rb.applyTorqueImpulse(torqueImpulse, true);
    }
  }, [
    triggerRoll,
    skipAnimation,
    locators,
    addRollResult,
    viewport.width,
    viewport.height,
  ]);

  const handleSleep = () => {
    if (!rigidBodyRef.current || skipAnimation) return;

    // calculate which face is pointing up
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
      const localPos = locator.position.clone();
      const worldOrientedPos = localPos.applyQuaternion(quaternion);

      if (worldOrientedPos.y > maxY) {
        maxY = worldOrientedPos.y;
        rolledValue = parseInt(locator.name.split("_")[1], 10);
      }
    });

    addRollResult(rolledValue);
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="cuboid"
      restitution={0.25}
      friction={0.9}
      linearDamping={1.4}
      angularDamping={2.6}
      onSleep={handleSleep}
      ccd={true}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.D6 as THREE.Mesh).geometry}
        material={materials.D6}
      />
    </RigidBody>
  );
};

useGLTF.preload("/models/d6.glb");
