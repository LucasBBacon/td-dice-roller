import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useRef } from "react";

export function Die() {
    // ref to access Rapier's specific methods
    const rigidBodyRef = useRef<RapierRigidBody>(null);

    const rollDice = () => {
        if (!rigidBodyRef.current) return;

        // Reset the die's position slightly above table
        rigidBodyRef.current.setTranslation({ x: 0, y: 3, z: 4}, true)
        
        // Kill any existing momentum
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0}, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0}, true);

        // Apply throwing force
        rigidBodyRef.current.applyImpulse({ x: 0, y: 5, z: -8}, true);

        // Apply random spin
        const spinStrength = 2;
        rigidBodyRef.current.applyTorqueImpulse({
            x: (Math.random() - 0.5) * spinStrength,
            y: (Math.random() - 0.5) * spinStrength,
            z: (Math.random() - 0.5) * spinStrength,
        }, true);
    }

    return (
        <RigidBody ref={rigidBodyRef} position={[0, 3, 0]} colliders="cuboid" restitution={0.6} friction={0.4}>
            <mesh onClick={rollDice} castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="royalblue" />
            </mesh>
        </RigidBody>
    )
}