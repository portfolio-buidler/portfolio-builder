
import { Routes, Route } from 'react-router-dom';
import UploadCV from './features/UploadCV/UploadCV';
import Preview from './features/Preview/preview';
import Dashboard from './features/Dashboard/Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './features/Auth/Login/Login';
import Registration from './features/Auth/Registration/Registration';

import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useResumeStore } from './store/resumeStore';
import './App.scss';

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
    } catch {
      // localStorage may not be available in some contexts
    }
    // Try to restore session on app mount (uses refresh cookie to rotate token)
    void fetchUser();
  }, [fetchUser, markBootstrapped]);

  // Clean up expired guest uploads on app mount
  useEffect(() => {
    const { isUploadExpired, clearTempUpload, tempUploadId } = useResumeStore.getState();
    
    if (tempUploadId && isUploadExpired()) {
      console.log('[App] Clearing expired guest upload on mount');
      clearTempUpload();
    }
  }, []);

  const renderLoading = (message = 'Loading...') => (
    <div className="app-loading" aria-busy="true">
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
        <Route path="/preview/:resumeId" element={<Preview />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
