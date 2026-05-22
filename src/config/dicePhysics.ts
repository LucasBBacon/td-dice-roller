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
};

export const DIE_PHYSICS_OVERRIDES: Record<DieType, Partial<DiePhysicsConfig>> = {
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
// #endregion

// #region Launch Tuning
export const DIE_LAUNCH_CONFIG = {
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

// #region Resolver
export const getDiePhysics = (dieType: DieType): DiePhysicsConfig => ({
	...DEFAULT_DIE_PHYSICS,
	...(DIE_PHYSICS_OVERRIDES[dieType] ?? {}),
});
// #endregion
