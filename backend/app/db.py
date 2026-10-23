import os
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = os.getenv("NEXUS_DATABASE_URL", "sqlite:///./data/nexus.db")
if DATABASE_URL.startswith("sqlite:///./"):
    os.makedirs(os.path.dirname(DATABASE_URL.replace("sqlite:///", "")) or ".", exist_ok=True)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})


def init_db(eng=None):
    SQLModel.metadata.create_all(eng or engine)


def get_session():
    with Session(engine) as s:
        yield s
