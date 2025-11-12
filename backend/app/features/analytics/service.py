# app/features/analytics/service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

log = logging.getLogger(__name__)

async def track_view(db: AsyncSession, *, site_id: int) -> None:
    """
    רושם צפייה אחת לאתר. מכניס גם viewed_at = now()
    ואם יש בעיה – כותב ללוג ולא מפיל את הבקשה הציבורית.
    """
    try:
        sql = text("""
            INSERT INTO site_views (site_id, viewed_at)
            VALUES (:site_id, now())
        """)
        await db.execute(sql, {"site_id": site_id})
        await db.commit()
    except Exception as e:
        # חשוב: לא להפיל את ה-public API בגלל אנליטיקס,
        # אבל כן לרשום לוג כדי שתוכל לאבחן.
        log.exception("track_view failed for site_id=%s: %s", site_id, e)
