from app.services import course_service


def test_read_courses_service_delegates_to_repository(monkeypatch):
    sentinel = [{"id": "course-1"}]
    mood_token = "mood-token"

    def fake_list_course_entries(db, mood):
        assert db == "db-session"
        assert mood == mood_token
        return sentinel

    monkeypatch.setattr(course_service, "list_course_entries", fake_list_course_entries)

    assert course_service.read_courses_service("db-session", mood_token) == sentinel
