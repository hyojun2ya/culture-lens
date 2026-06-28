import os
import json
import requests
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from sentence_transformers import SentenceTransformer
import chromadb
from app.models.schemas import TranslationRequest

load_dotenv()

WIKI_API = "https://ko.wikipedia.org/api/rest_v1/page/summary/{}"
WIKI_SEARCH_API = "https://ko.wikipedia.org/w/api.php"


class CultureAIService:
    def __init__(self):
        self.llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
        self.embeddings = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_collection(name="gangwon_culture")

    def _search_encyclopedia(self, word: str) -> str | None:
        try:
            query_vector = self.embeddings.encode(word).tolist()
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=1
            )
            if results["documents"] and results["documents"][0]:
                distance = results["distances"][0][0] if results.get("distances") else 999
                if distance < 50:
                    return results["documents"][0][0]
            return None
        except Exception as e:
            print(f"[ChromaDB 오류] {e}")
            return None

    def _search_wikipedia(self, word: str) -> str | None:
        try:
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

        context = self._search_encyclopedia(request.word)
        source = "한국민족문화대백과사전"

        if not context:
            print(f"[민족대백과] '{request.word}' 없음 → 위키백과 검색")
            context = self._search_wikipedia(request.word)
            source = "위키백과"

        if not context:
            context = "관련 공식 데이터가 없습니다."
            source = "없음"

        context = context[:2000]
        print(f"[RAG 소스] {source}")

        # 🌟 외국인 유저가 직접 읽는 '2인칭 시점'과 '100% 완전한 현지 언어화'가 적용된 프롬프트입니다.
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """
너는 한국의 고유 문화를 외국인 유저에게 직접 친절하게 설명해 주는 전문 문화 인류학 가이드야.
아래 제공된 [공식 데이터]만을 절대적인 사실로 삼아서 답변을 작성하고, 없는 내용을 절대 지어내지 마(환각 금지).

[공식 데이터 출처: {source}]
{context}

유저의 문화권은 [{country}]이며, 현재 이 리포트를 읽고 있는 유저의 언어는 [{language}]야.
이 리포트는 유저가 화면에서 직접 읽을 것이므로, 모든 문장은 제3자를 생략하고 **유저에게 직접 말을 건네는 2인칭 시점(예: "당신의 문화권인 {country}에서는~", "귀하가 친숙한 ~와 유사합니다")**으로만 작성해야 해. 

❌ "중국인들에게는~", "외국인들에게 소개할 때~", "도움을 줄 수 있습니다" 같은 안내자용 어조는 절대 금지합니다.

다음 3가지 요소를 오직 [{language}]로만 작성해 줘.

1. history: 해당 문화나 음식이 형성된 과거의 역사적, 기후적 배경을 유저에게 직접 설명하듯 작성.
2. modern_shift: 현재 현대 한국 사회에서의 인식 변화나 트렌드를 유저에게 직접 설명하듯 작성.
3. analogy: 유저의 문화권({country})에서 쉽게 이해할 수 있는 유사한 풍습이나 대치 음식과 직접 비교하며, 유저가 바로 공감할 수 있도록 설명.

[출력 규칙]:
1. **모든 JSON 값(Value)은 문장 부호를 포함하여 100% 완전한 [{language}]로만 작성되어야 하며, 한국어나 영어 단어가 단 한 단어도 섞여서는 안 됩니다.**
2. JSON의 키(Key) 이름인 "history", "modern_shift", "analogy"는 절대로 다른 언어로 번역하지 말고 반드시 영어 알파벳 그대로 유지하세요.
3. 인사말이나 부연 설명 없이 오직 아래 형식의 순수한 JSON 객체 하나만 반환해.

{{
    "history": "Write here in 100% {language} addressed directly to the user",
    "modern_shift": "Write here in 100% {language} addressed directly to the user",
    "analogy": "Write here in 100% {language} addressed directly to the user"
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

            # 전각 특수문자가 들어올 경우 반각 문자로 강제 치환
            cleaned = raw_text.strip().replace("```json", "").replace("```", "")
            cleaned = cleaned.replace("：", ":").replace("，", ",").replace("“", '"').replace("”", '"')
            
            raw_json = json.loads(cleaned)
            
            # 키값 표준화 매핑 (안전장치)
            final_result = {}
            vals = list(raw_json.values())
            
            final_result["history"] = raw_json.get("history") or raw_json.get("历史") or raw_json.get("歷史") or (vals[0] if len(vals) > 0 else "No Data")
            
            final_result["modern_shift"] = raw_json.get("modern_shift") or (vals[1] if len(vals) > 1 else "No Data")
            for k, v in raw_json.items():
                if "现代" in k or "現代" in k:
                    final_result["modern_shift"] = v
            
            final_result["analogy"] = raw_json.get("analogy") or raw_json.get("类比") or raw_json.get("類比") or raw_json.get("比喻") or (vals[2] if len(vals) > 2 else "No Data")
            
            return final_result

        except Exception as e:
            print(f"❌ 파싱 실패 원본 텍스트: {raw_text}")
            return {
                "history": "데이터 파싱 오류",
                "modern_shift": "데이터 파싱 오류",
                "analogy": str(e)
            }