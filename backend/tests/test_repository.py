from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import Settings
from app.db import Base
from app.models import CommentCreate, ReviewCreate
from app.repository import create_comment, create_review, get_my_page, import_public_bundle, toggle_stamp


def build_session(tmp_path: Path):
    database_url = f"sqlite:///{tmp_path / 'test.db'}"
    engine = create_engine(database_url, future=True, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    return session_factory()


def test_review_comment_and_my_page_flow(tmp_path: Path):
    session = build_session(tmp_path)
    settings = Settings(database_url='sqlite:///ignored.db', public_data_path=str(Path(__file__).resolve().parents[1] / 'data/public_bundle.json'))
    import_public_bundle(session, settings)

    review = create_review(
        session,
        ReviewCreate(placeId='hanbat-forest', body='\uAF43\uAE38\uC774 \uC9C4\uC9DC \uC608\uC058\uC5C8\uC5B4\uC694.', mood='\uC124\uB818', imageUrl='/uploads/demo.jpg'),
        'naver:user-1',
        '\uBBFC\uC11C',
    )
    comments = create_comment(
        session,
        review.id,
        CommentCreate(body='\uC800\uB3C4 \uAC00\uBCF4\uACE0 \uC2F6\uC5B4\uC694.', parentId=None),
        'naver:user-2',
        '\uAC00\uC740',
    )
    my_page = get_my_page(session, 'naver:user-1', False)

    assert review.image_url == '/uploads/demo.jpg'
    assert comments[0].body == '\uC800\uB3C4 \uAC00\uBCF4\uACE0 \uC2F6\uC5B4\uC694.'
    assert my_page.stats.review_count == 1
    assert my_page.reviews[0].user_id == 'naver:user-1'


def test_stamp_requires_real_distance(tmp_path: Path):
    session = build_session(tmp_path)
    settings = Settings(database_url='sqlite:///ignored.db', public_data_path=str(Path(__file__).resolve().parents[1] / 'data/public_bundle.json'))
    import_public_bundle(session, settings)

    blocked = False
    try:
        toggle_stamp(session, 'naver:user-1', 'hanbat-forest', 37.0, 127.0, 120)
    except PermissionError:
        blocked = True

    state = toggle_stamp(session, 'naver:user-1', 'hanbat-forest', 36.3671, 127.3886, 120)

    assert blocked is True
    assert 'hanbat-forest' in state.collected_place_ids
