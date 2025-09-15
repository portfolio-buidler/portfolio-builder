import UploadCV from './features/UploadCV/UploadCV'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <>
      <UploadCV />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default App
