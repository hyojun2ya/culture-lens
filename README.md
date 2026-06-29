---
title: Culture Lens
emoji: 🗺️
colorFrom: orange
colorTo: brown
sdk: docker
app_port: 7860
---

# 🗺️ Culture Lens (컬처 렌즈)
> **"어휘와 사진, 친숙한 비교를 통해 한국 문화를 쉽게 이해하는 Gemini AI 여행 동반자"**
> An AI travel companion that explains Korean culture through words, photos, and familiar comparisons.

---

## 📌 1. 프로젝트 개요 (Overview)
국내외 여행객들이 한국의 고유한 문화 자산(음식, 장소, 전통 등)을 접했을 때, 단순한 어휘 번역을 넘어 **직관적이고 친숙한 문화적 맥락(Comparison)**과 함께 이해할 수 있도록 돕는 스마트 관광 가이드 AI 서비스입니다.

- **기획 배경:** 단순 텍스트 번역기(예: 감자빵 -> Potato Bread)로는 온전한 문화적 감흥이나 맥락을 전달하기 어렵다는 문제점에서 출발했습니다.
- **핵심 가치:** 사용자가 탐색한 키워드를 기반으로 실제 명소의 위치 정보(Kakao Map)와 고도화된 AI 맞춤형 문화 설명을 실시간으로 결합하여 제공합니다.

---

## 🌟 2. 핵심 기능 (Key Features)
* **📸 Lens Talk (AI 문화 큐레이션):** 온돌, 닭갈비, 감자빵 등 한국 특유의 문화 아이템을 선택하면 즉시 맞춤형 AI 가이드가 생성됩니다.
* **🗺️ Interactive Map (카카오 맵 연동):** 카카오 로컬 API 및 지도를 활용하여 해당 문화 아이템을 가장 잘 체험할 수 있는 실제 명소(예: 카페감자밭 본점)의 위치를 시각화합니다.
* **🧠 Advanced RAG Pipeline (Chroma DB):** 한국민족문화대백과사전 데이터셋 및 실시간 웹 크롤링 데이터를 벡터화하여 활용함으로써 AI 답변의 환각(Hallucination)을 최소화하고 신뢰도 높은 정확한 지식을 전달합니다.

---

## 🛠️ 3. 기술 스택 (Tech Stack)

### Frontend
- **Language:** HTML5, CSS3, JavaScript (Vanilla JS)
- **API:** Kakao Maps API (위치 기반 장소 시각화 및 로컬 장소 서비스 구현)

### Backend & AI
- **Framework:** FastAPI (Python)
- **Vector Database:** Chroma DB (지식 기반 RAG 파이프라인 구축)
- **AI Engine:** Google Gemini AI (정밀한 컨텍스트 분석 및 문화 가이드 생성)

---

## 🚀 4. 실행 방법 (Getting Started)

다른 PC에서 이 프로젝트를 실행하려면 다음 단계를 순서대로 따라주세요.

### 1) 저장소 복제 (Clone)
```bash
git clone https://github.com/hyojun2ya/culture-lens.git
cd culture-lens
```

### 2) 가상환경 생성 및 활성화
#### 가상환경 생성
```bash
python -m venv venv
```

#### 가상환경 활성화 (Windows)
``` bash
venv\Scripts\activate
```

#### 가상환경 활성화 (Mac/Linux)
```bash
source venv/bin/activate
```

### 3) 라이브러리 설치
``` bash
pip install -r requirements.txt
```

### 4) 환경 변수 설정 (env 파일 만들기)
프로젝트 루트 디렉토리에 .env 파일을 생성하고 아래와 같이 발급받은 API 키를 입력합니다.
``` bash
GOOGLE_API_KEY=당신의_제미나이_API_키
GROQ_API_KEY=당신의_그록_API_키
```

### 5) 데이터베이스 초기화 (RAG 빌드)
``` bash
python init_db.py
```

### 6) 백엔드 서버 구동 (Port: 8000)
``` bash
uvicorn app.main:app --reload
```

### 7) 프론트엔드 웹 서버 구동 (Port: 8080)
새 터미널 창을 열고 아래 명령어를 실행합니다.
``` bash
cd static
python -m http.server 8080
```

### 8) 로컬호스트 웹 서버 구동 (Port: 8080)
백엔드와 프론트엔드 서버가 모두 정상 구동되었다면, 웹 브라우저(크롬 권장) 주소창에 아래 주소를 입력하여 서비스에 접속합니다.

``` bash
[http://127.0.0.1:8080/index.html](http://127.0.0.1:8080/index.html)
[http://localhost:8080/]
```

---
