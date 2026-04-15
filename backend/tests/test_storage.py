from pathlib import Path

from fastapi import FastAPI

from app import storage as storage_module
from app.config import Settings
from app.storage import (
    FileTooLargeError,
    InvalidFileTypeError,
    LocalStorageAdapter,
    ReviewImageUploadService,
    SupabaseStorageAdapter,
    derive_review_thumbnail_url,
    get_storage_adapter,
    mount_storage_backend,
    prepare_storage_backend,
)


class DummyResponse:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return b''


def test_local_storage_adapter_saves_review_image(tmp_path: Path):
    settings = Settings(storage_backend='local', upload_dir=str(tmp_path / 'uploads'))

    adapter = get_storage_adapter(settings)
    stored = adapter.save_review_image(
        owner_id='naver:tester',
        file_name='sample.png',
        content_type='image/png',
        raw_bytes=b'png-bytes',
    )

    assert isinstance(adapter, LocalStorageAdapter)
    assert stored.url == '/uploads/sample.png'
    assert stored.file_name == 'sample.png'
    assert (tmp_path / 'uploads' / 'sample.png').read_bytes() == b'png-bytes'


def test_supabase_storage_adapter_builds_public_url_and_object_path():
    settings = Settings(
        storage_backend='supabase',
        supabase_url='https://project.supabase.co',
        supabase_service_role_key='service-role-key',
        supabase_storage_bucket='review-images',
    )

    adapter = SupabaseStorageAdapter(settings)

    assert adapter.build_object_path('naver:tester', 'photo 1.png') == 'reviews/naver_tester/photo 1.png'
    assert (
        adapter.build_public_url('reviews/naver_tester/photo 1.png')
        == 'https://project.supabase.co/storage/v1/object/public/review-images/reviews/naver_tester/photo%201.png'
    )


def test_supabase_storage_adapter_posts_to_storage_api(monkeypatch):
    settings = Settings(
        storage_backend='supabase',
        supabase_url='https://project.supabase.co',
        supabase_service_role_key='service-role-key',
        supabase_storage_bucket='review-images',
    )
    adapter = SupabaseStorageAdapter(settings)
    captured = {}

    def fake_urlopen(request):
        captured['url'] = request.full_url
        captured['method'] = request.get_method()
        captured['headers'] = dict(request.header_items())
        captured['body'] = request.data
        return DummyResponse()

    monkeypatch.setattr(storage_module, 'urlopen', fake_urlopen)

    stored = adapter.save_review_image(
        owner_id='naver:tester',
        file_name='sample.png',
        content_type='image/png',
        raw_bytes=b'png-bytes',
    )

    assert captured['url'] == 'https://project.supabase.co/storage/v1/object/review-images/reviews/naver_tester/sample.png'
    assert captured['method'] == 'POST'
    assert captured['headers']['Authorization'] == 'Bearer service-role-key'
    assert captured['headers']['Apikey'] == 'service-role-key'
    assert captured['headers']['X-upsert'] == 'false'
    assert captured['body'] == b'png-bytes'
    assert stored.url == 'https://project.supabase.co/storage/v1/object/public/review-images/reviews/naver_tester/sample.png'


def test_review_image_upload_service_validates_type_and_size(tmp_path: Path):
    settings = Settings(storage_backend='local', upload_dir=str(tmp_path / 'uploads'), max_upload_size_bytes=4)
    service = ReviewImageUploadService(settings)

    try:
        service.save_review_image(owner_id='naver:tester', original_file_name='note.txt', content_type='text/plain', raw_bytes=b'1234')
        assert False
    except InvalidFileTypeError:
        pass

    try:
        service.save_review_image(owner_id='naver:tester', original_file_name='photo.png', content_type='image/png', raw_bytes=b'12345')
        assert False
    except FileTooLargeError:
        pass


def test_review_image_upload_service_generates_unique_filename(tmp_path: Path):
    settings = Settings(storage_backend='local', upload_dir=str(tmp_path / 'uploads'))
    service = ReviewImageUploadService(settings)

    stored = service.save_review_image(owner_id='naver:tester', original_file_name='sample.PNG', content_type='image/png', raw_bytes=b'png-bytes')

    assert stored.file_name.startswith('naver_tester-')
    assert stored.file_name.endswith('.png')


def test_review_image_upload_service_saves_thumbnail_variant(tmp_path: Path):
    settings = Settings(storage_backend='local', upload_dir=str(tmp_path / 'uploads'))
    service = ReviewImageUploadService(settings)

    stored = service.save_review_image(
        owner_id='naver:tester',
        original_file_name='sample.jpg',
        content_type='image/jpeg',
        raw_bytes=b'original-bytes',
        thumbnail_content_type='image/jpeg',
        thumbnail_raw_bytes=b'thumb-bytes',
    )

    assert stored.file_name.endswith('-orig.jpg')
    assert stored.thumbnail_file_name is not None
    assert stored.thumbnail_file_name.endswith('-thumb.jpg')
    assert stored.thumbnail_url == derive_review_thumbnail_url(stored.url)
    assert (tmp_path / 'uploads' / stored.file_name).read_bytes() == b'original-bytes'
    assert (tmp_path / 'uploads' / stored.thumbnail_file_name).read_bytes() == b'thumb-bytes'


def test_prepare_storage_backend_creates_local_upload_dir(tmp_path: Path):
    settings = Settings(storage_backend='local', upload_dir=str(tmp_path / 'uploads'))

    prepare_storage_backend(settings)

    assert settings.upload_path.exists()
    assert settings.upload_path.is_dir()


def test_mount_storage_backend_mounts_uploads_for_local_storage(tmp_path: Path):
    app = FastAPI()
    settings = Settings(storage_backend='local', upload_dir=str(tmp_path / 'uploads'))

    mounted = mount_storage_backend(app, settings)

    assert mounted is True
    assert settings.upload_path.exists()
    assert any(getattr(route, 'name', None) == 'uploads' for route in app.routes)


def test_mount_storage_backend_skips_non_local_storage():
    app = FastAPI()
    settings = Settings(
        storage_backend='supabase',
        supabase_url='https://project.supabase.co',
        supabase_service_role_key='service-role-key',
    )

    mounted = mount_storage_backend(app, settings)

    assert mounted is False
    assert not any(getattr(route, 'name', None) == 'uploads' for route in app.routes)
