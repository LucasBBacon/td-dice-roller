import * as THREE from 'three';

const D6_FACES = [
    { normal: new THREE.Vector3(0, 1, 0), value: 1 }, // TOP
    { normal: new THREE.Vector3(0, -1, 0), value: 6 }, // BOTTOM
    { normal: new THREE.Vector3(1, 0, 0), value: 2 }, // RIGHT
    { normal: new THREE.Vector3(-1, 0, 0), value: 5 }, // LEFT
    { normal: new THREE.Vector3(0, 0, 1), value: 3 }, // FRONT
    { normal: new THREE.Vector3(0, 0, -1), value: 4 }, // BACK
]

export function calculateUpFace(quaternion: THREE.Quaternion) {
    let highestY = -Infinity;
    let bestFace = 1;

    D6_FACES.forEach((face) => {
        // Clone the local normal, rotate it by the die's current 3D rotation
        const worldNormal = face.normal.clone().applyQuaternion(quaternion);

        // Vector with the highest Y value is pointing towards cam
        if (worldNormal.y > highestY) {
            highestY = worldNormal.y;
            bestFace = face.value;
        }
    });

    return bestFace;
}