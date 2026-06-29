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

WIKI_SEARCH_API = "https://ko.wikipedia.org/w/api.php"
WIKI_EN_SEARCH_API = "https://en.wikipedia.org/w/api.php"
WIKI_EN_API = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"
HEADERS = {"User-Agent": "CultureLens/1.0 (contact@culturelens.com)"}


class CultureAIService:
    def __init__(self):
        self.llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
        self.embeddings = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_collection(name="gangwon_culture")

    def _search_encyclopedia(self, word: str) -> str | None:
        try:
            results = self.collection.get(where={"name": word})
            if results["documents"]:
                print(f"[민족대백과] '{word}' 찾음!")
                return results["documents"][0]
            return None
        except Exception as e:
            print(f"[ChromaDB 오류] {e}")
            return None

    def _get_wiki_full_text(self, title: str, keyword: str = None) -> str | None:
        try:
            res = requests.get(
                WIKI_SEARCH_API,
                headers=HEADERS,
                params={
                    "action": "query",
                    "titles": title,
                    "prop": "extracts",
                    "explaintext": 1,
                    "format": "json",
                    "utf8": 1
                },
                timeout=5
            )
            if res.status_code == 200:
                pages = res.json().get("query", {}).get("pages", {})
                for page in pages.values():
                    extract = page.get("extract", "")
                    if extract:
                        if keyword and title != keyword:
                            lines = extract.split("\n")
                            section_lines = []
                            in_section = False
                            for line in lines:
                                if keyword in line:
                                    in_section = True
                                if in_section:
                                    section_lines.append(line)
                                    if len(section_lines) > 1 and line.startswith("==") and keyword not in line:
                                        break
                            if section_lines:
                                section_text = "\n".join(section_lines)
                                print(f"[위키백과 섹션] '{keyword}' 섹션 길이: {len(section_text)}")
                                return section_text
                        print(f"[위키백과 전문] '{title}' 길이: {len(extract)}")
                        return extract
            return None
        except Exception as e:
            print(f"[위키백과 전문 오류] {e}")
            return None

    def _search_wikipedia(self, word: str) -> str | None:
        try:
            extract = self._get_wiki_full_text(word, keyword=word)
            if extract:
                print(f"[위키백과] '{word}' 직접 검색 성공")
                return f"[출처: 위키백과]\n항목명: {word}\n\n{extract}"

            search_res = requests.get(
                WIKI_SEARCH_API,
                headers=HEADERS,
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
                    extract2 = self._get_wiki_full_text(best_title, keyword=word)
                    if extract2:
                        print(f"[위키백과] '{word}' → '{best_title}' 검색 성공")
                        return f"[출처: 위키백과]\n항목명: {best_title}\n\n{extract2}"
            return None
        except Exception as e:
            print(f"[위키백과 오류] {e}")
            return None

    def _search_us_culture(self, word: str) -> str | None:
        try:
            # 1. Groq으로 미국 유사 문화 찾기
            response = self.llm.invoke(
                f"What is the most similar American food or cultural concept to the Korean '{word}'? "
                f"It must be originally from the USA only. "
                f"If there is no good American equivalent, reply with exactly 'NONE'. "
                f"Otherwise answer with ONLY the English name, nothing else. Maximum 5 words."
            )
            us_equivalent = response.content.strip()

            # NONE이면 LLM 자유 비유로 넘어감
            if us_equivalent.upper() == "NONE":
                print(f"[미국 문화] '{word}' → 미국 유사 문화 없음, LLM 자유 비유 사용")
                return None

            print(f"[미국 문화 후보] '{word}' → '{us_equivalent}'")

            # 2. 영어 위키백과에서 검증
            search_res = requests.get(
                WIKI_EN_SEARCH_API,
                headers=HEADERS,
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": us_equivalent,
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
                    res = requests.get(
                        WIKI_EN_API.format(requests.utils.quote(best_title)),
                        headers=HEADERS,
                        timeout=5
                    )
                    if res.status_code == 200:
                        data = res.json()
                        extract = data.get("extract", "")
                        if extract:
                            print(f"[영어 위키백과 검증] '{us_equivalent}' → '{best_title}' 확인됨")
                            return f"[미국 유사 문화: {best_title}]\n{extract[:1000]}"
            return None
        except Exception as e:
            print(f"[미국 문화 검색 오류] {e}")
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

        context = context[:3000]

        us_context = ""
        us_data = None
        if request.country.upper() in ["USA", "US", "AMERICA", "UNITED STATES"]:
            us_data = self._search_us_culture(request.word)
            if us_data:
                us_context = f"\n\n{us_data}"

        print(f"[RAG 소스] {source}")

        # 미국 유사 문화가 있으면 데이터 기반, 없으면 LLM 자유 비유
        if us_data:
            analogy_instruction = "3. analogy: [미국 유사 문화 데이터]를 활용하여 유저의 문화권({country})에서 쉽게 이해할 수 있는 비유를 작성해."
        else:
            analogy_instruction = "3. analogy: 유저의 문화권({country})에서 쉽게 이해할 수 있는 비유를 자유롭게 작성해. 다른 나라 음식을 사용할 경우 반드시 '일본의 소바처럼~' 식으로 출처 국가를 명시해."

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", f"""
너는 한국의 고유 문화를 외국인 유저에게 직접 친절하게 설명해 주는 전문 문화 인류학 가이드야.
아래 제공된 [공식 데이터]만을 절대적인 사실로 삼아서 답변을 작성하고, 없는 내용을 절대 지어내지 마(환각 금지).

[공식 데이터 출처: {{source}}]
{{context}}

{{us_context}}

유저의 문화권은 [{{country}}]이며, 현재 이 리포트를 읽고 있는 유저의 언어는 [{{language}}]야.
이 리포트는 유저가 화면에서 직접 읽을 것이므로, 모든 문장은 제3자를 생략하고 **유저에게 직접 말을 건네는 2인칭 시점**으로만 작성해야 해.

❌ "중국인들에게는~", "외국인들에게 소개할 때~" 같은 안내자용 어조는 절대 금지합니다.

다음 3가지 요소를 오직 [{{language}}]로만 작성해 줘.

1. history: 해당 문화나 음식이 형성된 과거의 역사적, 기후적 배경을 유저에게 직접 설명하듯 작성.
2. modern_shift: 현재 현대 한국 사회에서의 인식 변화나 트렌드를 유저에게 직접 설명하듯 작성.
{analogy_instruction}

[출력 규칙]:
1. **모든 JSON 값(Value)은 100% 완전한 [{{language}}]로만 작성.**
2. JSON 키 "history", "modern_shift", "analogy"는 영어 그대로 유지.
3. 인사말 없이 순수한 JSON 객체 하나만 반환.

{{{{
    "history": "...",
    "modern_shift": "...",
    "analogy": "..."
}}}}
            """),
            ("human", "단어: {word}")
        ])

        chain = prompt_template | self.llm
        response = chain.invoke({
            "context": context,
            "us_context": us_context,
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
            cleaned = cleaned.replace("：", ":").replace("，", ",").replace("\u201c", '"').replace("\u201d", '"')

            raw_json = json.loads(cleaned)

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