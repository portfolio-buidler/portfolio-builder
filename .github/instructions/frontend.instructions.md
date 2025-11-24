---
description: 'Frontend development standards for TypeScript, React, SCSS, and Vite'
applyTo: '**/frontend/**/*.{ts,tsx,js,jsx,scss,css}, **/vite.config.*, **/tsconfig.json'
---

# Frontend Development Instructions (React + TypeScript)

## Stack Overview
- React 19 with hooks
- TypeScript 5.5+ with strict mode
- Vite 5+ dev/build tooling
- SCSS with BEM + design tokens
- Zustand for state
- React Hook Form for forms
- Axios for HTTP
- Vitest + RTL for unit tests
- Playwright for E2E

---

## Component Architecture: Logic-View-Style Separation

Mandatory file structure:
```
Component/
  Component.tsx           # Logic: state, effects, handlers
  Component.view.tsx      # View: presentational JSX only
  Component.styles.scss   # Style: BEM classes with tokens
  Component.types.ts      # TypeScript interfaces
  index.ts                # Barrel (optional)
```

Example: UploadArea

UploadArea.tsx (logic)
```typescript
import { useState, useCallback } from 'react';
import { UploadAreaView } from './UploadArea.view';
import { UploadAreaProps, UploadStatus } from './UploadArea.types';
import { validateFile } from '@/utils/fileValidation';
import { uploadResume } from '@/services/uploadService';

export const UploadArea: React.FC<UploadAreaProps> = ({ onUploadComplete }) => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setStatus('validating');

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    try {
      const result = await uploadResume(file, (pct) => setProgress(pct));
      setStatus('success');
      onUploadComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  return (
    <UploadAreaView
      status={status}
      progress={progress}
      error={error}
      isDragOver={isDragOver}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onInputChange={handleInputChange}
    />
  );
};
```

UploadArea.view.tsx (view)
```typescript
import { UploadAreaViewProps } from './UploadArea.types';
import './UploadArea.styles.scss';

export const UploadAreaView: React.FC<UploadAreaViewProps> = ({
  status,
  progress,
  error,
  isDragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onInputChange,
}) => (
  <div
    className="upload-area"
    data-status={status}
    data-drag-over={isDragOver}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
  >
    <input
      type="file"
      id="file-input"
      className="upload-area__input"
      accept=".pdf,.docx"
      onChange={onInputChange}
      disabled={status === 'uploading'}
    />

    <label htmlFor="file-input" className="upload-area__label">
      {status === 'idle' && (
        <div className="upload-area__prompt">
          <p className="upload-area__text">
            Drop your CV here or <span className="upload-area__link">browse</span>
          </p>
          <p className="upload-area__hint">Supports PDF and DOCX (max 5MB)</p>
        </div>
      )}

      {status === 'uploading' && (
        <div className="upload-area__progress">
          <div className="upload-area__progress-bar" style={{ width: `${progress}%` }} />
          <p className="upload-area__progress-text">{progress}% uploaded</p>
        </div>
      )}

      {status === 'success' && (
        <div className="upload-area__success">
          <p className="upload-area__text">Upload complete!</p>
        </div>
      )}

      {status === 'error' && (
        <div className="upload-area__error">
          <p className="upload-area__text">{error}</p>
          <button type="button" className="upload-area__retry">Try again</button>
        </div>
      )}
    </label>
  </div>
);
```

UploadArea.types.ts
```typescript
export type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

export interface UploadAreaProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export interface UploadAreaViewProps {
  status: UploadStatus;
  progress: number;
  error: string | null;
  isDragOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface UploadResult {
  id: number;
  status: string;
  message: string;
}
```

UploadArea.styles.scss (SCSS with tokens + BEM)
```scss
@use '../../../styles/tokens/colors' as colors;
@use '../../../styles/tokens/spacing' as spacing;
@use '../../../styles/tokens/radii' as radii;
@use '../../../styles/mixins/responsive' as responsive;
@use '../../../styles/mixins/typography' as typography;

.upload-area {
  position: relative;
  width: 100%;
  min-height: 300px;
  border: 2px dashed colors.$border-default;
  border-radius: radii.$lg;
  background-color: colors.$surface-secondary;
  transition: all 0.2s ease;

  &[data-drag-over="true"] {
    border-color: colors.$primary;
    background-color: colors.$primary-light;
    transform: scale(1.02);
  }

  &[data-status="uploading"] { border-style: solid; border-color: colors.$primary; }
  &[data-status="success"] { border-color: colors.$success; background-color: colors.$success-light; }
  &[data-status="error"] { border-color: colors.$error; background-color: colors.$error-light; }

  &__input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

  &__label { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 300px; padding: spacing.$xl; cursor: pointer; }

  &__prompt { text-align: center; }

  &__text { @include typography.body-large; margin-bottom: spacing.$sm; color: colors.$text-primary; }
  &__hint { @include typography.body-small; color: colors.$text-secondary; }
  &__link { color: colors.$primary; font-weight: 600; }

  &__progress { width: 100%; max-width: 400px; }
  &__progress-bar { height: 8px; background-color: colors.$primary; border-radius: radii.$full; transition: width 0.3s ease; }
  &__progress-text { margin-top: spacing.$sm; text-align: center; color: colors.$text-secondary; }

  &__retry { margin-top: spacing.$md; padding: spacing.$sm spacing.$lg; background-color: colors.$primary; color: colors.$text-inverse; border: none; border-radius: radii.$md; cursor: pointer; }

  @include responsive.mq('tablet-down') { min-height: 250px; &__label { padding: spacing.$lg; } }
}
```

## Authentication Bootstrap & Logging

### Auth Bootstrap (Strict Mode safe)
- Implement a deduplicated session restore to avoid duplicate requests triggered by React Strict Mode double-mount during development.
- Store a private `_fetchPromise` in the auth store. If `fetchUser` is called while an in-flight request exists, return the same promise.
- Respect a manual logout sentinel to skip auto-restore after explicit logout: `localStorage.getItem('auth:manualLogout') === 'true'`.

Zustand store excerpt:
```ts
// State
_fetchPromise: Promise<void> | null,

fetchUser: async () => {
  const state = get();
  if (state._fetchPromise) return state._fetchPromise; // dedupe

  const p = (async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await getCurrentUser();
      set({ user, isAuthenticated: !!user, isBootstrapped: true, isLoading: false, _fetchPromise: null });
    } catch (e: any) {
      set({ user: null, isAuthenticated: false, isBootstrapped: true, isLoading: false, error: e?.message || 'Failed', _fetchPromise: null });
    }
  })();
  set({ _fetchPromise: p });
  return p;
},
```

App bootstrap pattern:
```ts
useEffect(() => {
  try {
    if (localStorage.getItem('auth:manualLogout') === 'true') {
      markBootstrapped();
      return;
    }
  } catch {}
  void fetchUser();
}, [fetchUser, markBootstrapped]);
```

### Console Logging Policy
- Do not ship noisy `console.log` statements in production.
- Keep `console.error` (and `console.warn` when useful) for error reporting only.
- Remove success/info logs from services, components, and stores once stable.
- Prefer user-facing UI indicators (toasts, banners) instead of console logs.

---

## SCSS Architecture & Design Tokens

Always use relative imports:
```scss
// ✅ correct
@use '../../../styles/tokens/colors' as colors;
@use '../../../styles/mixins/responsive' as responsive;
// ❌ wrong
@use 'frontend/src/styles/tokens/colors' as colors;
@use '@/styles/tokens/colors' as colors;
```

BEM Naming:
```scss
.card { }
.card__header { }
.card--featured { }
.card__button--primary { }
.card[data-status="loading"] { }
```

---

## API Integration with Axios
```typescript
import axios, { AxiosProgressEvent } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
const api = axios.create({ baseURL: `${API_BASE_URL}/api/v1`, timeout: 30000 });

api.interceptors.response.use(
  (r) => r,
  (e) => { throw new Error(e?.response?.data?.detail || e.message || 'Error'); }
);

export const uploadResume = async (file: File, onProgress?: (p: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt: AxiosProgressEvent) => {
      if (evt.total) onProgress?.(Math.round((evt.loaded * 100) / evt.total));
    },
  });
  return res.data as { id: number; status: string; message: string };
};
```

---

## Guest Upload with Temporary Storage (Sprint Task #3)

### Pattern Overview

Allow users to upload CV before authentication, with a 2-minute window to log in and save permanently. This improves conversion by letting users see value before committing to registration.

### User Flow

```
1. Guest uploads CV → Temporary storage (2 min TTL)
2. User sees preview/parsing results
3. System shows auth prompt: "Save your work! Log in or create account"
4. User authenticates within 2 minutes
5. System claims temporary upload → Permanent storage
6. Expired uploads auto-delete
```

### State Management (Zustand)

**Upload Store** (`src/store/uploadStore.ts`):

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UploadState {
  // Temporary upload tracking
  tempUploadId: string | null;
  tempUploadExpiry: number | null;  // Unix timestamp (milliseconds)
  pendingAuth: boolean;              // User needs to authenticate
  
  // Actions
  setTempUpload: (tempId: string, expirySeconds: number) => void;
  clearTempUpload: () => void;
  isUploadExpired: () => boolean;
  markPendingAuth: (pending: boolean) => void;
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      // Initial state
      tempUploadId: null,
      tempUploadExpiry: null,
      pendingAuth: false,
      
      // Set temporary upload with TTL
      setTempUpload: (tempId: string, expirySeconds: number) => {
        const expiryTime = Date.now() + (expirySeconds * 1000);
        set({
          tempUploadId: tempId,
          tempUploadExpiry: expiryTime,
          pendingAuth: true,
        });
      },
      
      // Clear temporary upload
      clearTempUpload: () => {
        set({
          tempUploadId: null,
          tempUploadExpiry: null,
          pendingAuth: false,
        });
      },
      
      // Check if upload expired
      isUploadExpired: () => {
        const { tempUploadExpiry } = get();
        if (!tempUploadExpiry) return false;
        return Date.now() > tempUploadExpiry;
      },
      
      // Mark as needing authentication
      markPendingAuth: (pending: boolean) => {
        set({ pendingAuth: pending });
      },
    }),
    {
      name: 'portfolio-upload-storage',  // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        tempUploadId: state.tempUploadId,
        tempUploadExpiry: state.tempUploadExpiry,
        pendingAuth: state.pendingAuth,
      }),
    }
  )
);
```

### Backend API Endpoints

**Guest Upload**:
```typescript
// POST /api/v1/resumes/upload/guest
export const uploadGuestResume = async (file: File, onProgress?: (p: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await api.post('/resumes/upload/guest', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt: AxiosProgressEvent) => {
      if (evt.total) onProgress?.(Math.round((evt.loaded * 100) / evt.total));
    },
  });
  
  return res.data as {
    temp_id: string;
    expiry_seconds: number;  // Usually 120 (2 minutes)
    parsed_data: any;
  };
};
```

**Claim Upload After Auth**:
```typescript
// POST /api/v1/resumes/upload/guest/{temp_id}/claim
export const claimGuestUpload = async (tempId: string) => {
  const res = await api.post(`/resumes/upload/guest/${tempId}/claim`);
  return res.data as {
    resume_id: number;
    status: string;
    message: string;
  };
};
```

### Auth Prompt Modal Component

**AuthPromptModal.tsx** (Logic):

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadStore } from '@/store/uploadStore';
import { AuthPromptModalView } from './AuthPromptModal.view';
import type { AuthPromptModalProps } from './AuthPromptModal.types';

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ 
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { tempUploadExpiry, clearTempUpload, isUploadExpired } = useUploadStore();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Calculate time remaining
  useEffect(() => {
    if (!tempUploadExpiry || !isOpen) return;

    const updateTimer = () => {
      const remaining = Math.max(0, tempUploadExpiry - Date.now());
      setTimeRemaining(Math.floor(remaining / 1000));  // Convert to seconds

      if (remaining <= 0) {
        clearTempUpload();
        onClose?.();
      }
    };

    updateTimer();  // Initial update
    const interval = setInterval(updateTimer, 1000);  // Update every second

    return () => clearInterval(interval);
  }, [tempUploadExpiry, isOpen, clearTempUpload, onClose]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleRegister = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  const handleLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <AuthPromptModalView
      isOpen={isOpen}
      timeRemaining={formatTime(timeRemaining)}
      onRegister={handleRegister}
      onLogin={handleLogin}
      onClose={onClose}
    />
  );
};
```

**AuthPromptModal.view.tsx** (View):

```typescript
import { AuthPromptModalViewProps } from './AuthPromptModal.types';
import './AuthPromptModal.styles.scss';

export const AuthPromptModalView: React.FC<AuthPromptModalViewProps> = ({
  isOpen,
  timeRemaining,
  onRegister,
  onLogin,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="auth-prompt-modal">
      <div className="auth-prompt-modal__overlay" onClick={onClose} />
      
      <div className="auth-prompt-modal__content">
        <button
          className="auth-prompt-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="auth-prompt-modal__header">
          <h2 className="auth-prompt-modal__title">Save Your Work!</h2>
          <p className="auth-prompt-modal__subtitle">
            Your upload will expire in <strong>{timeRemaining}</strong>
          </p>
        </div>

        <div className="auth-prompt-modal__body">
          <p className="auth-prompt-modal__message">
            Create a free account or log in to save your portfolio permanently.
          </p>

          <div className="auth-prompt-modal__countdown">
            <div className="auth-prompt-modal__countdown-circle">
              <span className="auth-prompt-modal__countdown-time">
                {timeRemaining}
              </span>
            </div>
          </div>
        </div>

        <div className="auth-prompt-modal__actions">
          <button
            className="auth-prompt-modal__button auth-prompt-modal__button--primary"
            onClick={onRegister}
          >
            Create Free Account
          </button>
          
          <button
            className="auth-prompt-modal__button auth-prompt-modal__button--secondary"
            onClick={onLogin}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};
```

**AuthPromptModal.types.ts**:

```typescript
export interface AuthPromptModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export interface AuthPromptModalViewProps {
  isOpen: boolean;
  timeRemaining: string;  // Formatted as "MM:SS"
  onRegister: () => void;
  onLogin: () => void;
  onClose?: () => void;
}
```

### Upload Flow Integration

**In UploadCV component**:

```typescript
import { useUploadStore } from '@/store/uploadStore';
import { uploadGuestResume } from '@/services/uploadService';
import { useAuthStore } from '@/store/authStore';

export const UploadCV: React.FC = () => {
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { setTempUpload } = useUploadStore();
  const { isAuthenticated } = useAuthStore();

  const handleFileSelect = async (file: File) => {
    // Check if user is authenticated
    if (isAuthenticated) {
      // Normal authenticated upload
      const result = await uploadResume(file);
      // ... handle success
    } else {
      // Guest upload with temporary storage
      const result = await uploadGuestResume(file);
      
      // Store temp ID and expiry
      setTempUpload(result.temp_id, result.expiry_seconds);
      
      // Show preview with parsed data
      setPreviewData(result.parsed_data);
      
      // Show auth prompt after user sees value
      setTimeout(() => setShowAuthPrompt(true), 2000);  // 2 second delay
    }
  };

  return (
    <>
      {/* Upload UI */}
      <UploadAreaView onFileSelect={handleFileSelect} />
      
      {/* Auth prompt modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
      />
    </>
  );
};
```

### Claiming Upload After Authentication

**In Login/Register success handlers**:

```typescript
import { claimGuestUpload } from '@/services/uploadService';
import { useUploadStore } from '@/store/uploadStore';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { tempUploadId, pendingAuth, clearTempUpload, isUploadExpired } = useUploadStore();

  const handleLoginSuccess = async (user: User) => {
    // Check if there's a pending upload to claim
    if (pendingAuth && tempUploadId && !isUploadExpired()) {
      try {
        const result = await claimGuestUpload(tempUploadId);
        
        // Clear temp upload state
        clearTempUpload();
        
        // Show success message
        showToast('Portfolio saved successfully!', 'success');
        
        // Navigate to preview with claimed resume
        navigate(`/preview/${result.resume_id}`);
      } catch (error) {
        console.error('Failed to claim upload:', error);
        showToast('Could not save upload. Please upload again.', 'error');
        
        // Clear expired/invalid temp upload
        clearTempUpload();
        
        // Navigate to upload page
        navigate('/upload');
      }
    } else {
      // Normal login flow (no pending upload)
      navigate('/dashboard');
    }
  };

  // ... rest of login logic
};
```

### Expiration Handling

**Auto-cleanup on mount**:

```typescript
import { useEffect } from 'react';
import { useUploadStore } from '@/store/uploadStore';

export const App: React.FC = () => {
  const { isUploadExpired, clearTempUpload } = useUploadStore();

  useEffect(() => {
    // Check for expired uploads on app mount
    if (isUploadExpired()) {
      clearTempUpload();
      console.log('Cleared expired guest upload');
    }
  }, [isUploadExpired, clearTempUpload]);

  return (
    // ... app content
  );
};
```

### Security Considerations

**Do's**:
- ✅ Always validate file before temporary storage (use EMMS pattern)
- ✅ Store temp ID in localStorage (survives refresh)
- ✅ Check expiration on every access
- ✅ Clear expired uploads immediately
- ✅ Use short TTL (2 minutes recommended)
- ✅ Show clear countdown to user
- ✅ Verify user ownership when claiming

**Don'ts**:
- ❌ Never extend expiration time (security risk)
- ❌ Never allow claiming without authentication
- ❌ Never expose temp upload URLs to other users
- ❌ Never store sensitive data in temp uploads

### Testing Requirements

```typescript
describe('Guest Upload Flow', () => {
  it('stores temp upload ID and expiry', async () => {
    const { result } = renderHook(() => useUploadStore());
    
    result.current.setTempUpload('temp-123', 120);
    
    expect(result.current.tempUploadId).toBe('temp-123');
    expect(result.current.pendingAuth).toBe(true);
    expect(result.current.isUploadExpired()).toBe(false);
  });

  it('detects expired uploads', async () => {
    const { result } = renderHook(() => useUploadStore());
    
    // Set upload with 0 second expiry
    result.current.setTempUpload('temp-123', 0);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.isUploadExpired()).toBe(true);
  });

  it('shows auth prompt after guest upload', async () => {
    render(<UploadCV />);
    
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/drop your cv/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/save your work/i)).toBeInTheDocument();
    });
  });

  it('claims upload after successful login', async () => {
    const { result: uploadStore } = renderHook(() => useUploadStore());
    uploadStore.current.setTempUpload('temp-123', 120);
    
    render(<Login />);
    
    // Perform login
    // ...
    
    await waitFor(() => {
      expect(claimGuestUpload).toHaveBeenCalledWith('temp-123');
      expect(uploadStore.current.tempUploadId).toBeNull();
    });
  });
});
```

### User Experience Best Practices

1. **Show value first**: Let users see parsing results before asking for auth
2. **Clear communication**: Display countdown prominently
3. **Easy conversion**: Make "Create Account" button primary
4. **Graceful degradation**: Handle expired uploads gracefully
5. **Preserve progress**: Don't lose work on page refresh (localStorage)
6. **Quick auth**: Pre-fill email if captured during upload

**Cross-Reference**:
- Complete implementation: `docs/sprint/SPRINT_IMPLEMENTATION_GUIDE.md` → Task 3
- Backend endpoints: See backend docs for temp storage API

---

## Testing Patterns

Vitest + RTL example:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UploadArea } from '@/features/UploadCV/UploadArea/UploadArea';
import * as uploadService from '@/services/uploadService';
import * as fileValidation from '@/utils/fileValidation';

vi.mock('@/services/uploadService');
vi.mock('@/utils/fileValidation');

describe('UploadArea', () => {
  it('validates and uploads', async () => {
    vi.mocked(fileValidation.validateFile).mockReturnValue({ valid: true });
    vi.mocked(uploadService.uploadResume).mockResolvedValue({ id: 1, status: 'parsed', message: 'ok' });

    render(<UploadArea />);

    const input = screen.getByLabelText(/drop your cv here/i) as HTMLInputElement;
    const file = new File(['x'], 'r.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/upload complete/i)).toBeInTheDocument());
  });
});
```

Playwright E2E example:
```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

test('upload flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample.pdf'));
  await expect(page.getByText(/upload complete/i)).toBeVisible();
});
```

---

## Accessibility
- Use semantic HTML and ARIA attributes
- Ensure keyboard navigation and focus management
- Prefer data attributes for UI state: `data-status`, `data-variant`

---

## Common Mistakes
- ❌ Mixing logic and view in one file
- ❌ Absolute SCSS imports
- ❌ Magic CSS values instead of design tokens
- ❌ Using `any` in TypeScript types

---

## 🚨 CRITICAL: User-Facing Messages - DO NOT DELETE

**NEVER remove or modify these standardized user messages without explicit approval.**

### UploadArea Component Messages

These messages are **mandatory** and must always be present in the UploadArea component:

#### Idle State (No file selected)
```tsx
// ✅ REQUIRED - Must always show
<p className="upload-area__headline">
  Drop & Drag or <span className="upload-area__link">Choose File</span> To Upload
</p>
<p className="upload-area__subline">Accept PDF or DOCX up to 5MB</p>
```

#### Success State (Upload complete)
```tsx
// ✅ REQUIRED - Must always show with 🎉 icon
<img src={PartyIcon} className="upload-area__emoji-img" alt="" aria-hidden />
<p className="upload-area__headline">Upload complete!</p>
```

#### Error State (Upload failed)
```tsx
// ✅ REQUIRED - Must show appropriate error icon and message
// Icons: 🦖 (default), 😔 (sad), 🫣 (peek)
{(() => {
  const picked = pickErrorIconAndText(errorMessage)
  const icon = picked.icon  // '🦖' | '😔' | '🫣'
  const msgText = picked.text
  
  return (
    <>
      <img src={iconSrc} className="upload-area__emoji-img" alt="" aria-hidden />
      <div className="upload-area__text">
        <p className="upload-area__headline">{msgText}</p>
      </div>
    </>
  )
})()}
```

**Why These Messages Matter:**
- **Consistency**: Users expect the same feedback across all upload interactions
- **Accessibility**: Screen readers rely on these messages
- **Branding**: The emoji icons and friendly tone are part of our UX identity
- **Testing**: E2E tests depend on these exact text strings

**Before Modifying:**
1. ✅ Check if the message is in this critical list
2. ✅ If yes, get explicit approval from UX/Product team
3. ✅ Update E2E tests if text changes
4. ✅ Update this documentation

---

Last Updated: November 2025
Maintained By: Frontend Team (Netanel)