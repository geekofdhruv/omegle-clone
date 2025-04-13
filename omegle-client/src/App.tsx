import './App.css'
import { Route,Routes } from 'react-router-dom'
import Join from './components/join'

function App() {
return (
    <>

      <Routes>
        <Route path="/" element={<Join />} />
      </Routes>
  

      
    </>
  )
}

export default App
