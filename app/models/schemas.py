from pydantic import BaseModel

# 1. 프론트엔드가 서버로 보낼 '요청 택배 상자' 규격
class TranslationRequest(BaseModel):
    word: str
    user_id: str
    language: str
    country: str

# 2. 서버가 프론트엔드로 보낼 '응답 택배 상자' 규격
class TranslationResponse(BaseModel):
    status: str
    word_kr: str
    target_country: str
    history: str        # 과거의 역사적/기후적 배경
    modern_shift: str   # 현대 한국 사회의 변화 및 트렌드
    analogy: str        # 해당 문화권 맞춤형 비유 설명