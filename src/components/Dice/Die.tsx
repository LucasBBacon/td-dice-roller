// #region Imports
import { useGLTF } from "@react-three/drei";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { type SpawnPoint } from "./spawnPlanning";
import { DIE_APPEARANCE, DIE_LAUNCH_CONFIG, getDiePhysics } from "../../config/dicePhysics";
import { useDiceStore } from "../../store/useDiceStore";
import type { DieType } from "../../store/useDiceStore";
// #endregion

// #region Constants And Props
const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];

const getModelPath = (dieType: DieType) =>
  `/models/${dieType.toUpperCase()}.glb`;

type DieProps = {
  dieId: string;
  dieType: DieType;
  dieIndex: number;
  rollId: number;
  throwStartPosition?: SpawnPoint;
  skipSnapPosition?: SpawnPoint;
};

const DEFAULT_POSITION: SpawnPoint = { x: 0, z: 0 };
// #endregion

// #region Component
export const Die = ({
  dieId,
  dieType,
  dieIndex,
  rollId,
  throwStartPosition,
  skipSnapPosition,
}: DieProps) => {
  // References track the active rigid body and whether this die already launched for a roll id.
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const launchedForRollRef = useRef<number | null>(null);
  const activeRollId = useDiceStore((state) => state.activeRollId);
  const isRolling = useDiceStore((state) => state.isRolling);
  const rollPhase = useDiceStore((state) => state.rollPhase);
  const triggerLaunch = useDiceStore((state) => state.triggerLaunch);
  const skipAnimation = useDiceStore((state) => state.skipAnimation);
  const addRollResult = useDiceStore((state) => state.addRollResult);
  const registerDieReady = useDiceStore((state) => state.registerDieReady);
  const isDropped = useDiceStore((state) => state.droppedDieIds.includes(dieId));
  const setGlbContractIssue = useDiceStore(
    (state) => state.setGlbContractIssue,
  );

  const modelPath = getModelPath(dieType);
  const { nodes, materials } = useGLTF(modelPath);

  const physics = getDiePhysics(dieType);

  const dieMesh = (nodes.DieMesh as THREE.Mesh | undefined) ?? null;
  const dieMaterial = materials.DieMat ?? null;
  const initialThrowStart = throwStartPosition ?? DEFAULT_POSITION;

  // Cloned so dimming a dropped die does not affect other dice sharing the GLTF material.
  const droppedMaterial = useMemo(() => {
    if (!dieMaterial) {
      return null;
    }

    const material = dieMaterial.clone();
    material.transparent = true;
    material.opacity = DIE_APPEARANCE.droppedOpacity;

    return material;
  }, [dieMaterial]);

  // Locator nodes named value_<n> are used to resolve rolled face values.
  const locators = useMemo(() => {
    return Object.values(nodes).filter(
      (node): node is THREE.Object3D =>
        node instanceof THREE.Object3D && node.name.startsWith("value_"),
    );
  }, [nodes]);

  // Validate GLB contract once model data is available to surface authoring mismatches early.
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
  }, [
    dieMaterial,
    dieMesh,
    dieType,
    locators.length,
    modelPath,
    setGlbContractIssue,
  ]);

  // Each die reports readiness after mount so launch waits for all rigid bodies.
  useEffect(() => {
    if (!rigidBodyRef.current) {
      return;
    }

    registerDieReady(rollId, dieId);
  }, [dieId, registerDieReady, rollId]);

  // Trigger throw/snap behavior when the global roll id advances to this die's roll.
  useEffect(() => {
    if (
      triggerLaunch <= 0 ||
      !isRolling ||
      rollPhase !== "rolling" ||
      rollId !== activeRollId ||
      locators.length === 0
    ) {
      return;
    }
    let cancelled = false;

    const seed = (((rollId + 1) * 73856093) ^ ((dieIndex + 1) * 19349663)) >>> 0;
    const randomT = (seed % 1000) / 1000;
    const staggerMs =
      DIE_LAUNCH_CONFIG.perDieLaunchStaggerMinMs +
      randomT *
        (DIE_LAUNCH_CONFIG.perDieLaunchStaggerMaxMs -
          DIE_LAUNCH_CONFIG.perDieLaunchStaggerMinMs);

    const launchTimer = setTimeout(() => {
      if (cancelled) return;

      const rb = rigidBodyRef.current;
      if (!rb) return;

      const throwStart = initialThrowStart;
      const skipSnap = skipSnapPosition ?? throwStart;

      launchedForRollRef.current = rollId;

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

        rb.setTranslation(
          {
            x: skipSnap.x,
            y: physics.skipSnapY,
            z: skipSnap.z,
          },
          true,
        );
        rb.setRotation(snapRotation, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

        const rolledValue = parseInt(randomLocator.name.split("_")[1], 10);
        setTimeout(
          () => addRollResult(rollId, dieId, rolledValue),
          physics.skipResultDelayMs,
        );
        return;
      }

      rb.wakeUp();

      const inwardDirection = new THREE.Vector2(-throwStart.x, -throwStart.z);
      const baseAngle =
        inwardDirection.lengthSq() > 0.0001
          ? Math.atan2(inwardDirection.y, inwardDirection.x)
          : THREE.MathUtils.randFloat(0, Math.PI * 2);
      const throwAngleRad =
        baseAngle +
        THREE.MathUtils.randFloatSpread(
          THREE.MathUtils.degToRad(DIE_LAUNCH_CONFIG.throwAngleRandomSpreadDeg),
        );
      const throwStrength = THREE.MathUtils.randFloat(
        DIE_LAUNCH_CONFIG.throwImpulseMultiplier *
          DIE_LAUNCH_CONFIG.throwStrengthMinScale,
        DIE_LAUNCH_CONFIG.throwImpulseMultiplier,
      ) * physics.throwImpulseScale;

      const launchDirection = {
        x: Math.cos(throwAngleRad),
        z: Math.sin(throwAngleRad),
      };
      const launchSpeed =
        THREE.MathUtils.randFloat(
          DIE_LAUNCH_CONFIG.minLaunchSpeed,
          DIE_LAUNCH_CONFIG.maxLaunchSpeed,
        ) * physics.launchSpeedScale;
      const verticalLaunchSpeed =
        THREE.MathUtils.randFloat(
          DIE_LAUNCH_CONFIG.minLaunchVerticalSpeed,
          DIE_LAUNCH_CONFIG.maxLaunchVerticalSpeed,
        ) * physics.launchSpeedScale;

      rb.setLinvel(
        {
          x: launchDirection.x * launchSpeed,
          y: verticalLaunchSpeed,
          z: launchDirection.z * launchSpeed,
        },
        true,
      );

      const throwImpulse = {
        x: launchDirection.x * throwStrength,
        y: Math.random() * physics.throwVerticalMax,
        z: launchDirection.z * throwStrength,
      };
      const torqueImpulse = {
        x:
          (Math.random() - 0.5) *
          DIE_LAUNCH_CONFIG.torqueImpulseMultiplier *
          physics.torqueImpulseScale,
        y:
          (Math.random() - 0.5) *
          DIE_LAUNCH_CONFIG.torqueImpulseMultiplier *
          physics.torqueImpulseScale,
        z:
          (Math.random() - 0.5) *
          DIE_LAUNCH_CONFIG.torqueImpulseMultiplier *
          physics.torqueImpulseScale,
      };

      rb.applyImpulse(throwImpulse, true);
      rb.applyTorqueImpulse(torqueImpulse, true);
    }, DIE_LAUNCH_CONFIG.launchDelayMs + staggerMs);

    return () => {
      cancelled = true;
      clearTimeout(launchTimer);
    };
  }, [
    addRollResult,
    activeRollId,
    dieId,
    dieIndex,
    dieType,
    isRolling,
    locators,
    rollId,
    rollPhase,
    physics.skipResultDelayMs,
    physics.skipSnapY,
    physics.throwVerticalMax,
    physics.throwImpulseScale,
    physics.launchSpeedScale,
    physics.torqueImpulseScale,
    skipAnimation,
    skipSnapPosition,
    initialThrowStart,
    triggerLaunch,
  ]);

  // On physics sleep, pick the locator with highest world-space Y to determine the up-facing value.
  const handleSleep = () => {
    if (!rigidBodyRef.current || skipAnimation || locators.length === 0) return;
    if (launchedForRollRef.current !== rollId) return;

    launchedForRollRef.current = null;

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

    addRollResult(rollId, dieId, rolledValue);
  };

  if (!dieMesh || !dieMaterial) {
    return null;
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[initialThrowStart.x, 5, initialThrowStart.z]}
      colliders={physics.collider}
      restitution={physics.restitution}
      friction={physics.friction}
      linearDamping={physics.linearDamping}
      angularDamping={physics.angularDamping}
      onSleep={handleSleep}
      ccd={true}
    >
      <mesh
        castShadow
        receiveShadow
        geometry={dieMesh.geometry}
        material={isDropped && droppedMaterial ? droppedMaterial : dieMaterial}
      />
    </RigidBody>
  );
};
// #endregion

DIE_TYPES.forEach((type) => {
  useGLTF.preload(getModelPath(type));
});
