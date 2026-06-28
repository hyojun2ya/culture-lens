from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware  # CORS 도구를 가져옵니다.
from app.models.schemas import TranslationRequest, TranslationResponse
from app.services.llm import CultureAIService
from app.core.database import init_db, save_scan_log
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="CultureLens Backend Core")

# --- [추가된 부분] 브라우저 보안관에게 통행증을 발급합니다 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 지금은 개발 중이니 모든 주소에서의 접근을 허락합니다.
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST 등 모든 통신 방식을 허락합니다.
    allow_headers=["*"],
)
# --------------------------------------------------------

ai_service = CultureAIService()

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "CultureLens Backend Architecture is Core Live!"}

@app.post("/api/v1/context/translate", response_model=TranslationResponse)
async def translate_culture_context(request: TranslationRequest, background_tasks: BackgroundTasks):
    try:
        ai_result = ai_service.ask_cultural_context(request)
        
        background_tasks.add_task(
            save_scan_log,
            user_id=request.user_id,
            word=request.word,
            country=request.country,
            language=request.language
        )
        
        return TranslationResponse(
            status="success",
            word_kr=request.word,
            target_country=request.country,
            history=ai_result.get("history", ""),
            modern_shift=ai_result.get("modern_shift", ""),
            analogy=ai_result.get("analogy", "")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"백엔드 코어 추론 실패: {str(e)}")
    
# 🚨 중요: 반드시 다른 API 라우터들보다 아래에 위치해야 합니다!
# static 폴더를 루트(/) 경로로 마운트하여 index.html이 첫 화면으로 뜨게 만듭니다.
app.mount("/", StaticFiles(directory="static", html=True), name="static")