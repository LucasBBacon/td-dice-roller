import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { Die } from '../Die/Die'
import { OrbitControls } from '@react-three/drei'

export default function DiceRoller() {
    return (
        // Canvas is root of 3D world
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }} shadows>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} castShadow intensity={1.5} />

            <Physics>
                <RigidBody type='fixed' restitution={0.2} friction={0.8}>
                    <mesh position={[0, -0.5, 0]} receiveShadow >
                        <boxGeometry args={[20, 1, 20]} />
                        <meshStandardMaterial color="darkgreen" />
                    </mesh>
                </RigidBody>

                <Die />
            </Physics>

            <OrbitControls />
        </Canvas>
    )
}