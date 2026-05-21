import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useDiceStore } from "../../store/useDiceStore";

const FACE_NORMALS = [
  { value: 1, normal: new THREE.Vector3(0, 1, 0) }, // TOP
  { value: 6, normal: new THREE.Vector3(0, -1, 0) }, // BOTTOM
  { value: 2, normal: new THREE.Vector3(0, 0, 1) }, // FRONT
  { value: 5, normal: new THREE.Vector3(0, 0, -1) }, // BACK
  { value: 3, normal: new THREE.Vector3(1, 0, 0) }, // RIGHT
  { value: 4, normal: new THREE.Vector3(-1, 0, 0) }, // LEFT
];

export const D6 = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const triggerRoll = useDiceStore((state) => state.triggerRoll);
  const skipAnimation = useDiceStore((state) => state.skipAnimation);
  const addRollResult = useDiceStore((state) => state.addRollResult);

  useEffect(() => {
    if (triggerRoll <= 0 || !rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;

    // reset position
    rb.setTranslation({ x: 3, y: 5, z: 3 }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

    if (skipAnimation) {
      // fast-forward: snap to a random rotation and put to sleep instantly
      const randomFace =
        FACE_NORMALS[Math.floor(Math.random() * FACE_NORMALS.length)];
      // TODO: add quaternion math to snap specific face up
      // for now, drop it with zero velocity close to the ground
      rb.setTranslation({ x: 0, y: 0.5, z: 0 }, true);
      setTimeout(() => addRollResult(randomFace.value), 100);
    } else {
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
    }
  }, [triggerRoll, skipAnimation]);

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

    let bestMatch = 1;
    let maxDot = -Infinity;

    FACE_NORMALS.forEach(({ value, normal }) => {
      // rotate local normal by the dies current rotation
      const worldNormal = normal.clone().applyQuaternion(quaternion);
      // compare with global UP vector
      const dot = worldNormal.dot(new THREE.Vector3(0, 1, 0));

      if (dot > maxDot) {
        maxDot = dot;
        bestMatch = value;
      }
    });

    addRollResult(bestMatch);
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="cuboid"
      restitution={0.5}
      friction={0.8}
      onSleep={handleSleep}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>
    </RigidBody>
  );
};
