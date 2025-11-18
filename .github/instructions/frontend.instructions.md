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

Last Updated: October 2025
Maintained By: Frontend Team (Natanel)
