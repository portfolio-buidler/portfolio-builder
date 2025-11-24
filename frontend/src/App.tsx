
import { Routes, Route } from 'react-router-dom';
import UploadCV from './features/UploadCV/UploadCV';
import Preview from './features/Preview/Preview';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './features/Auth/Login/Login';
import Registration from './features/Auth/Registration/Registration';

import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

function App() {
  const { fetchUser, isLoading, isBootstrapped, markBootstrapped } = useAuthStore();

  useEffect(() => {
    // Skip auto-restore if user manually logged out (sentinel in localStorage)
    try {
      const manualLogoutFlag = localStorage.getItem('auth:manualLogout');
      if (manualLogoutFlag === 'true') {
        markBootstrapped();
        return;
      }
    } catch {}
    // Try to restore session on app mount (uses refresh cookie to rotate token)
    void fetchUser();
  }, [fetchUser, markBootstrapped]);

  const renderLoading = (message = 'Loading...') => (
    <div
      className="app-loading"
      aria-busy="true"
      style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 9999 }}
    >
      <div>{message}</div>
    </div>
  );

  if (!isBootstrapped) {
    return (
      <>
        {renderLoading('Checking your session...')}
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  return (
    <>
      {isLoading && renderLoading()}
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
