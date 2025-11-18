
import { Routes, Route } from 'react-router-dom';
import UploadCV from './features/UploadCV/UploadCV';
import Preview from './features/Preview/Preview';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './features/Auth/Login/Login';
import Registration from './features/Auth/Registration/Registration';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<UploadCV />} />
        <Route path="/upload" element={<UploadCV />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/preview" element={<Preview />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
