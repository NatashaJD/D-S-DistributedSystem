from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

_url = settings.database_url
_is_sqlite = _url.startswith("sqlite")

engine_kwargs = {"pool_pre_ping": True}
if _is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(_url, **engine_kwargs)

# Enable WAL mode for SQLite (better concurrent read performance)
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(conn, _):
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
