"""로컬 개발용 FastAPI 앱서버 진입점.

베이스 Python 인터프리터로 실행하되,
프로젝트 venv의 site-packages를 우선 경로에 추가해 의존성을 읽는다.
"""

from pathlib import Path
import sys

backend_dir = Path(__file__).resolve().parent
site_packages = backend_dir / ".venv" / "Lib" / "site-packages"

sys.path[:0] = [str(site_packages), str(backend_dir)]

import uvicorn


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001)