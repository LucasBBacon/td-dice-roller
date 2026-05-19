
# TD Dice Roller

## Overview

TD Dice Roller is a web app for simulating dice rolls with realistic 3D physics. The goal is to provide a visually authentic experience for rolling a full 7-piece polyhedral dice set, starting with a d6 (six-sided die).

## Features

- **Realistic Dice Physics:** Dice are not just spun or animated—they are physically simulated as if thrown onto a table.
- **Supports Polyhedral Sets:** Begins with a d6, with plans to add d4, d8, d10, d12, d20, and percentile dice.
- **Interactive Rolling:** Click to roll; each roll is unique due to randomized forces and torque.
- **3D Graphics:** Built with React Three Fiber and Drei for rendering, and Rapier for physics.

## How It Works

### 1. Rigid Bodies
Each die (starting with the d6) is wrapped in a dynamic `RigidBody` component from Rapier, allowing it to respond to forces and collisions.

### 2. Colliders
- The table (floor) uses a static `CuboidCollider`.
- Each die has its own collider, so it can detect collisions with the table and other dice.

### 3. The Throw (Impulse & Torque)
When the user clicks to roll:
- **applyImpulse:** Applies a linear force vector (forward and slightly upward) to simulate tossing the die onto the table.
- **applyTorqueImpulse:** Applies a randomized 3D torque vector, making the die spin unpredictably.

### 4. Gravity & Restitution
The physics engine takes over:
- **Gravity** pulls the die down.
- **Restitution** (bounciness) determines how much the die skips or bounces when it hits the floor.

## Tech Stack

- [React](https://react.dev/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Drei](https://docs.pmnd.rs/drei/introduction)
- [Rapier Physics](https://rapier.rs/)
- [@react-three/rapier](https://github.com/pmndrs/react-three-rapier)

## Getting Started

1. Install dependencies:
	```bash
	npm install
	```
2. Start the development server:
	```bash
	npm run dev
	```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Roadmap

- [ ] D6 dice with realistic throw
- [ ] Add remaining polyhedral dice (d4, d8, d10, d12, d20, percentile)
- [ ] UI for selecting dice types and quantities
- [ ] Roll history and results display

## License

MIT
