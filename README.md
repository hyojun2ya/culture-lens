# Culture Lens:

이 프로젝트는 제미나이(Gemini) AI를 활용하여 관광지의 정보를 쉽고 재미있게 해설해 주는 서비스입니다.

## 🛠️ 실행 방법 (Getting Started)

다른 PC에서 이 프로젝트를 실행하려면 다음 단계를 따라주세요.

### 1. 저장소 복제 
```bash
git clone [https://github.com/hyojun2ya/culture-lens.git](https://github.com/hyojun2ya/culture-lens.git)
cd culture-lens

### 2. 활성화
# 가상환경 생성
python -m venv venv

# Windows 활성화
venv\Scripts\activate

pip install -r requirements.txt

### 3. 라이브러리 설치
pip install -r requirements.txt

### 4. 환경 변수 설정 (env 파일 만들기)
GOOGLE_API_KEY=당신의_제미나이_API_키  (구글 ai에 들어가서 제미나이 키 발급받고 넣으면 됨)

### 5. 데이터베이스 초기화
python init_db.py

### 6. 서버 실행
uvicorn app.main:app --reload