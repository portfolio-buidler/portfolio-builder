# בסיס קטן ומעודכן
FROM python:3.12-slim

# לוגים מיידיים וללא קבצי .pyc
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DEFAULT_TIMEOUT=100

# ספריית עבודה
WORKDIR /app

# התקן חבילות מערכת עבור תעודות CA כדי למנוע שגיאות SSL של pip
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# תלויות מינימליות להרצה (בשלב ראשון)
# בהמשך עדכן ל-requirements.txt / pyproject.toml
# שלב 1: עדכן pip
RUN pip install --no-cache-dir --upgrade pip
# שלב 2: התקן תלויות אפליקציה. במידה ויש סביבת רשת עם SSL בעייתי,
# הוספנו trusted-host כפול-גיבוי כדי לאפשר התקנה.
RUN pip install --no-cache-dir \
    --trusted-host pypi.org --trusted-host files.pythonhosted.org \
    fastapi uvicorn[standard] sqlalchemy psycopg[binary] python-multipart

# קוד האפליקציה ( app/main.py)
COPY app/ ./app/

# אבטחה בסיסית: לא להריץ כ-root
RUN useradd -m app && chown -R app /app
USER app

# הפורט של ה-API
EXPOSE 8000

# הרצת השרת
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
