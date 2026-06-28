# 1. 파이썬 3.11 슬림 버전 컴퓨터 준비
FROM python:3.11-slim

# 2. 작업 폴더를 /code 로 설정
WORKDIR /code

# 3. 장부 파일 복사 및 필수 라이브러리 설치
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 4. 내 프로젝트의 모든 소스 코드 복사
COPY . .

# 5. 빌드할 때 민족대백과 RAG 데이터베이스(Chroma DB) 미리 굽기
RUN python init_db.py

# 6. 허깅페이스 내부 권한 부여 (에러 방지용 치트키)
RUN chmod -R 777 /code

# 7. 허깅페이스 기본 포트인 7860번으로 FastAPI 서버 구동
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]