# דוח אבטחה - מודול אימות קבצים
**תאריך:** 30 בנובמבר 2025  
**מודול:** File Upload Validation  
**קבצים:** `security.py`, `service.py`, `logging.py`

---

## תקציר מנהלים

הוטמע מנגנון אבטחה רב-שכבתי למניעת העלאת קבצים זדוניים למערכת. המנגנון כולל 6 בדיקות אבטחה, מערכת לוגים לתיעוד, ו-29 בדיקות יחידה אוטומטיות.

---

## שכבות ההגנה

### 1. Extension Validation (HTTP 415)
**קובץ:** `security.py` → `verify_extension()`

| בדיקה | תיאור |
|-------|--------|
| סיומות מותרות | רק `.pdf` ו-`.docx` |
| קובץ בלי סיומת | נדחה |
| Case insensitive | `.PDF` = `.pdf` |

**סיכון שנמנע:** העלאת קבצי הרצה (.exe, .sh) או סקריפטים (.php, .js)

---

### 2. Double Extension Attack Prevention (HTTP 415)
**קובץ:** `security.py` → `verify_extension()`

**רשימת סיומות חסומות:**
```
.exe, .php, .sh, .bat, .js, .vbs, .cmd, .ps1, .pif, .scr
```

| קלט | תוצאה |
|-----|--------|
| `malware.php.pdf` | ❌ נדחה |
| `virus.exe.docx` | ❌ נדחה |
| `script.sh.pdf` | ❌ נדחה |
| `report.v2.pdf` | ✅ מותר |

**סיכון שנמנע:** תוקף מעלה `shell.php.pdf` - השרת עלול לזהות את הקובץ כ-PHP ולהריץ אותו.

---

### 3. File Size Enforcement (HTTP 413)
**קובץ:** `service.py` → `_save_streamed()`

| הגדרה | ערך |
|-------|-----|
| גודל מקסימלי | 5MB |
| שיטת בדיקה | Streaming (8KB chunks) |

**סיכון שנמנע:** 
- Memory exhaustion attack
- Denial of Service (DoS)

**יתרון:** הקובץ לא נטען לזיכרון במלואו - הגודל נבדק תוך כדי העלאה.

---

### 4. Magic Bytes Validation (HTTP 422)
**קובץ:** `security.py` → `verify_magic_bytes()`

| פורמט | חתימה (Hex) |
|-------|-------------|
| PDF | `%PDF` (25 50 44 46) |
| DOCX | `PK\x03\x04` (50 4B 03 04) |

| תרחיש | תוצאה |
|-------|--------|
| קובץ טקסט עם סיומת .pdf | ❌ נדחה |
| JPEG עם סיומת .docx | ❌ נדחה |
| PDF אמיתי | ✅ מותר |

**סיכון שנמנע:** File Type Spoofing - תוקף משנה רק את הסיומת ללא שינוי התוכן.

---

### 5. DOCX Macro Detection (HTTP 422)
**קובץ:** `security.py` → `check_docx_for_macros()`

**שיטת זיהוי:** פתיחת ה-DOCX כארכיון ZIP וחיפוש:
```
word/vbaProject.bin    ← VBA Macro binary
word/vbaData.xml       ← VBA data
xl/vbaProject.bin      ← Excel macros (safety check)
```

**סיכון שנמנע:** Macro-based malware - קוד VBA שרץ בפתיחת המסמך.

---

### 6. DOCX Encryption Detection (HTTP 422)
**קובץ:** `security.py` → `check_docx_for_encryption()`

**שיטת זיהוי:**
| בדיקה | משמעות |
|-------|---------|
| קיום `EncryptedPackage` | מסמך מוצפן בסיסמה |
| חוסר `[Content_Types].xml` | מבנה לא תקין / מוצפן |

**סיכון שנמנע:** 
- לא ניתן לפרסר תוכן מוצפן
- מסמכים פגומים

---

## Security Logging

**קובץ:** `core/logging.py`  
**Logger:** `security.file_validation`

### פורמט לוג:
```
2025-11-30 14:32:15 - SECURITY - WARNING - REJECTED: Double extension attack detected '.php' in - malware.php.pdf
```

### אירועים מתועדים:
| אירוע | רמה |
|-------|------|
| קובץ נדחה | WARNING |
| שגיאת בדיקה | ERROR |
| קובץ התקבל | INFO |

### צפייה בלוגים:
```bash
docker-compose logs -f backend | grep "SECURITY\|REJECTED"
```

---

## סיכום קודי HTTP

| קוד | משמעות | דוגמאות |
|-----|---------|---------|
| 415 | Unsupported Media Type | סיומת לא חוקית, Double extension, MIME לא נתמך |
| 413 | Payload Too Large | קובץ מעל 5MB |
| 422 | Unprocessable Entity | Magic bytes שגויים, מאקרו, הצפנה, קובץ פגום |

---

## Unit Tests

**קובץ:** `tests/unit/test_file_validation.py`  
**סה"כ:** 29 בדיקות

### פירוט לפי קטגוריה:

| קטגוריה | מספר בדיקות | כיסוי |
|---------|-------------|-------|
| Extension Validation | 6 | סיומות חוקיות, לא חוקיות, ריקות |
| Double Extension | 6 | .php.pdf, .exe.docx, .sh.pdf, .bat.docx |
| Magic Bytes | 6 | PDF תקין, DOCX תקין, זיופים |
| Macro Detection | 4 | DOCX נקי, עם מאקרו, פגום |
| Encryption Detection | 3 | מוצפן, מבנה לא תקין, תקין |
| Edge Cases | 4 | קבועים, תווים מיוחדים |

### הרצת בדיקות:
```bash
docker-compose exec backend pytest app/tests/unit/test_file_validation.py -v
```

---

## תרשים זרימת אימות

```
                    ┌─────────────────┐
                    │  File Upload    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ verify_extension │
                    │  (.pdf/.docx?)  │
                    └────────┬────────┘
                             │ ✓
                    ┌────────▼────────┐
                    │ Double Extension│
                    │  Check          │
                    └────────┬────────┘
                             │ ✓
                    ┌────────▼────────┐
                    │ MIME Type Check │
                    └────────┬────────┘
                             │ ✓
                    ┌────────▼────────┐
                    │ Streaming Save  │
                    │ (Size ≤ 5MB)    │
                    └────────┬────────┘
                             │ ✓
                    ┌────────▼────────┐
                    │ Magic Bytes     │
                    │ Validation      │
                    └────────┬────────┘
                             │ ✓
                    ┌────────▼────────┐
                    │ DOCX Only:      │
                    │ • Macro Check   │
                    │ • Encryption    │
                    └────────┬────────┘
                             │ ✓
                    ┌────────▼────────┐
                    │   ✅ ACCEPTED   │
                    └─────────────────┘
```

---

## קבצים ששונו

| קובץ | שינוי |
|------|-------|
| `backend/app/features/resumes/security.py` | פונקציות אימות חדשות |
| `backend/app/features/resumes/service.py` | שילוב הבדיקות ב-upload flow |
| `backend/app/core/logging.py` | הגדרת Security Logger |
| `backend/app/tests/unit/test_file_validation.py` | 29 בדיקות יחידה |

---

## המלצות להמשך

1. **Integration Tests** - בדיקות E2E עם קבצים אמיתיים דרך ה-API
2. **PDF Security** - בדיקת JavaScript מוטמע ב-PDF
3. **Rate Limiting** - הגבלת קצב העלאות למניעת abuse



