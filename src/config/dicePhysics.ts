// #region Imports
import type { DieType } from "../store/useDiceStore";
// #endregion

// #region Physics Contracts
export type DiePhysicsConfig = {
	collider: "cuboid" | "hull";
	restitution: number;
	friction: number;
	linearDamping: number;
	angularDamping: number;
	skipSnapPadding: number;
	skipSnapY: number;
	skipResultDelayMs: number;
	throwVerticalMax: number;
	throwImpulseScale: number;
	torqueImpulseScale: number;
	launchSpeedScale: number;
};
// #endregion

// #region Defaults And Overrides
export const DEFAULT_DIE_PHYSICS: DiePhysicsConfig = {
	collider: "hull",
	restitution: 0.3,
	friction: 0.9,
	linearDamping: 1.5,
	angularDamping: 2.8,
	skipSnapPadding: 1.5,
	skipSnapY: 0,
	skipResultDelayMs: 50,
	throwVerticalMax: 3,
	throwImpulseScale: 1,
	torqueImpulseScale: 1,
	launchSpeedScale: 1,
};

export const DIE_PHYSICS_OVERRIDES: Record<DieType, Partial<DiePhysicsConfig>> = {
	d4: {
		throwImpulseScale: 0.4,
		torqueImpulseScale: 0.6,
		launchSpeedScale: 0.7,
		throwVerticalMax: 1.5,
		restitution: 0.2,
		linearDamping: 2,
		angularDamping: 3.2,
	},
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
// #endregion

// #region Launch Tuning
export const DIE_LAUNCH_CONFIG = {
	batchReadyTimeoutMs: 250,
	batchReadySettleDelayMs: 70,
	perDieLaunchStaggerMinMs: 5,
	perDieLaunchStaggerMaxMs: 20,
	launchDelayMs: 50,
	throwImpulseMultiplier: 120,
	torqueImpulseMultiplier: 42,
	minLaunchSpeed: 18,
	maxLaunchSpeed: 26,
	minLaunchVerticalSpeed: 6,
	maxLaunchVerticalSpeed: 10,
	throwAngleRandomSpreadDeg: 70,
	throwStrengthMinScale: 0.7,
} as const;
// #endregion

// #region Appearance
export const DIE_APPEARANCE = {
	droppedOpacity: 0.28,
} as const;
// #endregion

// #region Resolver
export const getDiePhysics = (dieType: DieType): DiePhysicsConfig => ({
	...DEFAULT_DIE_PHYSICS,
	...(DIE_PHYSICS_OVERRIDES[dieType] ?? {}),
});
// #endregion
