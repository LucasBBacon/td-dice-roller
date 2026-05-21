import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  THROW_ANGLE_MAX_DEG,
  THROW_ANGLE_MIN_DEG,
} from "../../config/dicePhysics";
import { useDiceStore } from "../../store/useDiceStore";
import type { DieType } from "../../store/useDiceStore";

type DiePhysicsConfig = {
  collider: "cuboid" | "hull";
  restitution: number;
  friction: number;
  linearDamping: number;
  angularDamping: number;
  skipSnapPadding: number;
  skipSnapY: number;
  skipResultDelayMs: number;
  throwVerticalMax: number;
};

const DEFAULT_PHYSICS: DiePhysicsConfig = {
  collider: "hull",
  restitution: 0.3,
  friction: 0.9,
  linearDamping: 1.5,
  angularDamping: 2.8,
  skipSnapPadding: 1.5,
  skipSnapY: 0,
  skipResultDelayMs: 50,
  throwVerticalMax: 3,
};

const DIE_PHYSICS_OVERRIDES: Record<DieType, Partial<DiePhysicsConfig>> = {
  d4: {},
  d6: {
    collider: "cuboid",
    restitution: 0.25,
    linearDamping: 1.4,
    angularDamping: 2.6,
    skipSnapPadding: 1,
    skipSnapY: 0.5,
    skipResultDelayMs: 100,
    throwVerticalMax: 2.2,
  },
  d8: {},
  d10: {},
  d12: {},
  d20: {},
};

const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];

const getModelPath = (dieType: DieType) => `/models/${dieType.toUpperCase()}.glb`;

type DieProps = {
  dieType: DieType;
};

export const Die = ({ dieType }: DieProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const triggerRoll = useDiceStore((state) => state.triggerRoll);
  const skipAnimation = useDiceStore((state) => state.skipAnimation);
  const addRollResult = useDiceStore((state) => state.addRollResult);
  const setGlbContractIssue = useDiceStore((state) => state.setGlbContractIssue);
  const { viewport } = useThree();

  const modelPath = getModelPath(dieType);
  const { nodes, materials } = useGLTF(modelPath);

  const physics = {
    ...DEFAULT_PHYSICS,
    ...(DIE_PHYSICS_OVERRIDES[dieType] ?? {}),
  };

  const dieMesh = (nodes.DieMesh as THREE.Mesh | undefined) ?? null;
  const dieMaterial = materials.DieMat ?? null;

  const locators = useMemo(() => {
    return Object.values(nodes).filter(
      (node): node is THREE.Object3D =>
        node instanceof THREE.Object3D && node.name.startsWith("value_"),
    );
  }, [nodes]);

  useEffect(() => {
    const missing: string[] = [];
    if (!dieMesh) {
      missing.push("mesh key 'DieMesh'");
    }
    if (!dieMaterial) {
      missing.push("material key 'DieMat'");
    }
    if (locators.length === 0) {
      missing.push("at least one locator named 'value_<n>'");
    }

    if (missing.length === 0) {
      setGlbContractIssue(null);
      return;
    }

    const issue = [
      `GLB contract mismatch for ${dieType.toUpperCase()} (${modelPath})`,
      `Missing: ${missing.join(", ")}`,
    ].join(". ");

    setGlbContractIssue(issue);

    if (import.meta.env.DEV) {
      console.warn(issue);
    }
  }, [dieMaterial, dieMesh, dieType, locators.length, modelPath, setGlbContractIssue]);

  useEffect(() => {
    if (triggerRoll <= 0 || !rigidBodyRef.current || locators.length === 0) return;

    const rb = rigidBodyRef.current;

    if (skipAnimation) {
      const randomLocator = locators[Math.floor(Math.random() * locators.length)];
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

      rb.setTranslation(
        {
          x: (Math.random() - 0.5) * (viewport.width - physics.skipSnapPadding * 2),
          y: physics.skipSnapY,
          z: (Math.random() - 0.5) * (viewport.height - physics.skipSnapPadding * 2),
        },
        true,
      );
      rb.setRotation(snapRotation, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

      const rolledValue = parseInt(randomLocator.name.split("_")[1], 10);
      setTimeout(
        () => addRollResult({ dieType, value: rolledValue }),
        physics.skipResultDelayMs,
      );
      return;
    }

    const spawnMargin = 1.5;
    const throwStartX = viewport.width / 2 - spawnMargin;
    const throwStartZ = viewport.height / 2 - spawnMargin;

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

    const throwImpulse = {
      x: Math.cos(throwAngleRad) * throwStrength,
      y: Math.random() * physics.throwVerticalMax,
      z: Math.sin(throwAngleRad) * throwStrength,
    };
    const torqueImpulse = {
      x: (Math.random() - 0.5) * torqueImpulseMultiplier,
      y: (Math.random() - 0.5) * torqueImpulseMultiplier,
      z: (Math.random() - 0.5) * torqueImpulseMultiplier,
    };

    rb.applyImpulse(throwImpulse, true);
    rb.applyTorqueImpulse(torqueImpulse, true);
  }, [
    addRollResult,
    dieType,
    locators,
    physics.skipResultDelayMs,
    physics.skipSnapPadding,
    physics.skipSnapY,
    physics.throwVerticalMax,
    skipAnimation,
    triggerRoll,
    viewport.height,
    viewport.width,
  ]);

  const handleSleep = () => {
    if (!rigidBodyRef.current || skipAnimation || locators.length === 0) return;

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

    addRollResult({ dieType, value: rolledValue });
  };

  if (!dieMesh || !dieMaterial) {
    return null;
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={physics.collider}
      restitution={physics.restitution}
      friction={physics.friction}
      linearDamping={physics.linearDamping}
      angularDamping={physics.angularDamping}
      onSleep={handleSleep}
      ccd={true}
    >
      <mesh castShadow receiveShadow geometry={dieMesh.geometry} material={dieMaterial} />
    </RigidBody>
  );
};

DIE_TYPES.forEach((type) => {
  useGLTF.preload(getModelPath(type));
});