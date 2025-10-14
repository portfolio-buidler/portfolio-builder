
import { Routes, Route } from 'react-router-dom';
import UploadCV from './features/UploadCV/UploadCV';
import PreviewCV from './features/Preview/preview';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<UploadCV />} />
        <Route path="/preview" element={<PreviewCV />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
