import os
import json
import requests
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
import chromadb
from app.models.schemas import TranslationRequest

load_dotenv()

WIKI_API = "https://ko.wikipedia.org/api/rest_v1/page/summary/{}"
WIKI_SEARCH_API = "https://ko.wikipedia.org/w/api.php"


class CultureAIService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
        self.embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_collection(name="gangwon_culture")

    def _search_encyclopedia(self, word: str) -> str | None:
        try:
            query_vector = self.embeddings.embed_query(word)
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=1
            )
            if results["documents"] and results["documents"][0]:
                distance = results["distances"][0][0] if results.get("distances") else 1.0
                if distance < 0.7:
                    return results["documents"][0][0]
            return None
        except Exception as e:
            print(f"[ChromaDB 오류] {e}")
            return None

    def _search_wikipedia(self, word: str) -> str | None:
        try:
            # 직접 제목으로 시도
            res = requests.get(
                WIKI_API.format(requests.utils.quote(word)),
                timeout=5
            )
            if res.status_code == 200:
                data = res.json()
                extract = data.get("extract", "")
                if extract and len(extract) > 50:
                    print(f"[위키백과] '{word}' 검색 성공")
                    return f"[출처: 위키백과]\n항목명: {data.get('title')}\n\n{extract}"

            # 실패 시 검색어로 재시도
            search_res = requests.get(
                WIKI_SEARCH_API,
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": word,
                    "format": "json",
                    "srlimit": 1,
                    "utf8": 1
                },
                timeout=5
            )
            if search_res.status_code == 200:
                hits = search_res.json().get("query", {}).get("search", [])
                if hits:
                    best_title = hits[0]["title"]
                    res2 = requests.get(
                        WIKI_API.format(requests.utils.quote(best_title)),
                        timeout=5
                    )
                    if res2.status_code == 200:
                        data2 = res2.json()
                        extract2 = data2.get("extract", "")
                        if extract2 and len(extract2) > 50:
                            print(f"[위키백과] '{word}' → '{best_title}' 검색 성공")
                            return f"[출처: 위키백과]\n항목명: {best_title}\n\n{extract2}"
            return None
        except Exception as e:
            print(f"[위키백과 오류] {e}")
            return None

    def ask_cultural_context(self, request: TranslationRequest) -> dict:

        # 1단계: 민족대백과
        context = self._search_encyclopedia(request.word)
        source = "한국민족문화대백과사전"

        # 2단계: 위키백과 fallback
        if not context:
            print(f"[민족대백과] '{request.word}' 없음 → 위키백과 검색")
            context = self._search_wikipedia(request.word)
            source = "위키백과"

        # 3단계: 둘 다 없으면
        if not context:
            context = "관련 공식 데이터가 없습니다."
            source = "없음"

        print(f"[RAG 소스] {source}")

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """
너는 한국의 고유 문화를 외국인에게 설명해 주는 전문 문화 인류학 가이드야.
아래 제공된 [공식 데이터]만을 절대적인 사실로 삼아서 답변을 작성하고, 없는 내용을 절대 지어내지 마(환각 금지).

[공식 데이터 출처: {source}]
{context}

유저의 문화권({country})과 설정 언어({language})를 바탕으로 다음 3가지 핵심 요소를 분석해 줘.

1. history: 해당 문화나 음식이 형성된 과거의 역사적, 기후적 배경
2. modern_shift: 현재 현대 한국 사회에서의 인식 변화나 트렌드
3. analogy: 유저의 문화권({country})에서 쉽게 이해할 수 있는 유사한 풍습이나 대치 음식으로 비유

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
            "context": context,
            "source": source,
            "country": request.country,
            "language": request.language,
            "word": request.word
        })

        try:
            if isinstance(response.content, list):
                raw_text = "".join([item.get("text", "") for item in response.content if "text" in item])
            else:
                raw_text = str(response.content)

            cleaned = raw_text.strip().replace("```json", "").replace("```", "")
            return json.loads(cleaned)

        except Exception as e:
            return {
                "history": "데이터 파싱 오류",
                "modern_shift": "데이터 파싱 오류",
                "analogy": str(e)
            }