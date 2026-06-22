import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
import chromadb
from app.models.schemas import TranslationRequest

load_dotenv()

class CultureAIService:
    def __init__(self):
        # 1. 뼈아픈 실수를 바로잡습니다: 작동이 보장된 최신 모델 'gemini-3.5-flash'로 완벽히 고정합니다.
        self.llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.2)
        self.embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
        
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_collection(name="gangwon_culture")

    def ask_cultural_context(self, request: TranslationRequest) -> dict:
        # 벡터 데이터베이스 검색
        query_vector = self.embeddings.embed_query(request.word)
        search_results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=1
        )
        
        if search_results['documents'] and search_results['documents'][0]:
            retrieved_doc = search_results['documents'][0][0]
        else:
            retrieved_doc = "관련 공식 데이터가 없습니다."

        # 동적 프롬프트 조립
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """
            너는 한국의 고유 문화를 외국인에게 설명해 주는 전문 문화 인류학 가이드야.
            아래 제공된 [공식 데이터]만을 절대적인 사실로 삼아서 답변을 작성하고, 없는 내용을 절대 지어내지 마(환각 금지).
            
            [공식 데이터]
            {context}
            
            유저의 문화권({country})과 설정 언어({language})를 바탕으로 다음 3가지 핵심 요소를 분석해 줘.
            
            1. history: 해당 문화나 음식이 형성된 과거의 역사적, 기후적 배경
            2. modern_shift: 현재 현대 한국 사회에서의 인식 변화나 트렌드
            3. analogy: 유저의 문화권({country})에서 쉽게 이해할 수 있는 유사한 풍습이나 대치 음식 비유
            
            [출력 규칙]:
            반드시 {language}로 작성해야 하며, 인사말이나 부연 설명 없이 오직 아래 형식의 순수한 JSON 객체 하나만 반환해.
            
            {{
                "history": "과거 배경 설명 내용",
                "modern_shift": "현대 인식 변화 내용",
                "analogy": "문화권 맞춤 비유 내용"
            }}
            """),
            ("human", "단어: {word}")
        ])

        chain = prompt_template | self.llm
        response = chain.invoke({
            "context": retrieved_doc,
            "country": request.country,
            "language": request.language,
            "word": request.word
        })
        
        # 2. 포장지 에러 해결: 응답이 리스트로 오든 텍스트로 오든 안전하게 파싱합니다.
        try:
            if isinstance(response.content, list):
                raw_text = "".join([item.get("text", "") for item in response.content if "text" in item])
            else:
                raw_text = str(response.content)
                
            cleaned_content = raw_text.strip().replace("```json", "").replace("```", "")
            return json.loads(cleaned_content)
            
        except Exception as e:
            return {
                "history": "데이터 파싱 오류",
                "modern_shift": "데이터 파싱 오류",
                "analogy": str(e)
            }