import './App.css'
import { DiceScene } from './components/Scene/DiceScene'
import { Overlay } from './components/UI/Overlay'

function App() {

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <DiceScene />
      <Overlay />
    </ div>
  )
}

export default App
