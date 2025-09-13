
# בסיס קטן ומעודכן
FROM python:3.12-slim

# לוגים מיידיים וללא קבצי .pyc
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

# ספריית עבודה
WORKDIR /app

# תלויות מינימליות להרצה (בשלב ראשון)
# בהמשך עדכן ל-requirements.txt / pyproject.toml
RUN pip install --no-cache-dir --upgrade pip fastapi uvicorn[standard]

# קוד האפליקציה ( app/main.py)
COPY app/ ./app/

# אבטחה בסיסית: לא להריץ כ-root
RUN useradd -m app && chown -R app /app
USER app

# הפורט של ה-API
EXPOSE 8000

# הרצת השרת
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
