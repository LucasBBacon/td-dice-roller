import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import { useDiceStore } from "../../store/useDiceStore";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  THROW_ANGLE_MAX_DEG,
  THROW_ANGLE_MIN_DEG,
} from "../../config/dicePhysics";

export const D20 = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { triggerRoll, skipAnimation, addRollResult } = useDiceStore();
  const { viewport } = useThree();

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

    if (skipAnimation) {
      const randomLocator =
        locators[Math.floor(Math.random() * locators.length)];

      const localDirection = randomLocator.position.clone().normalize();
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

      const padding = 1.5;
      rb.setTranslation(
        {
          x: (Math.random() - 0.5) * (viewport.width - padding * 2),
          y: 0,
          z: (Math.random() - 0.5) * (viewport.height - padding * 2),
        },
        true,
      );
      rb.setRotation(snapRotation, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

      const rolledValue = parseInt(randomLocator.name.split("_")[1], 10);
      setTimeout(() => addRollResult(rolledValue), 50);
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

      // Use a bounded horizontal angle so throw direction is tunable.
      const throwImpulse = {
        x: Math.cos(throwAngleRad) * throwStrength,
        y: Math.random() * 3,
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
      restitution={0.3}
      friction={0.9}
      linearDamping={1.5}
      angularDamping={2.8}
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
