import os
import csv
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import chromadb

load_dotenv()

CSV_FILE    = "data/korean_encyclopedia_raw.csv"
CHROMA_PATH = "./chroma_db"
COLLECTION  = "gangwon_culture"
CRAWL_DELAY = 0.5

TARGET_KEYWORDS = [
    "막국수", "장칼국수", "아바이순대", "국밥", "막걸리",
    "닭갈비", "초당두부", "황태", "감자빵", "메밀전병", "오징어순대",
    "한복", "저고리", "치마", "두루마기", "갓", "버선",
    "온돌", "한옥", "초가집", "기와집", "마루", "아궁이", "장독대",
    "김치", "비빔밥", "불고기", "떡", "된장", "고추장", "전통주"
]

def load_items_from_csv(csv_path: str) -> list:
    items = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            url = row.get("웹사이트 주소", "").strip()
            name = row.get("항목명", "").strip()
            category = row.get("분야", "").strip()
            if any(kw == name for kw in TARGET_KEYWORDS):
                eid = url.split("/")[-1] if url else ""
                new_url = f"https://encykorea.aks.ac.kr/Article/{eid}" if eid else ""
                if new_url:
                    items.append({"name": name, "category": category, "url": new_url, "eid": eid})
    return items

def crawl_article(url: str) -> str:
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; CultureLens/1.0)"}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            return ""
        soup = BeautifulSoup(res.text, "html.parser")
        texts = []
        definition = soup.select_one(".def_content, .summary, .article-summary")
        if definition:
            texts.append(definition.get_text(strip=True))
        sections = soup.select(".article-content p, .cont_body p, .view_cont p")
        for s in sections:
            t = s.get_text(strip=True)
            if t:
                texts.append(t)
        if not texts:
            body = soup.select_one("article, .article, #article, main")
            if body:
                texts.append(body.get_text(separator="\n", strip=True))
        return "\n".join(texts)
    except Exception as e:
        print(f"  ⚠️ 크롤링 실패: {e}")
        return ""

def main():
    print("📂 1. CSV에서 시연 키워드 항목 필터링 중...")
    items = load_items_from_csv(CSV_FILE)
    print(f"   매칭된 항목: {len(items)}개")
    for item in items:
        print(f"   - {item['name']} ({item['eid']})")

    print("\n🗄️  2. ChromaDB 준비 중...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        client.delete_collection(name=COLLECTION)
        print("   기존 컬렉션 삭제 완료")
    except:
        pass
    collection = client.get_or_create_collection(name=COLLECTION)

    print("🤖 3. 로컬 임베딩 모델 로딩 중... (첫 실행시 다운로드 있음)")
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    print("\n4. 크롤링 & 임베딩 시작...\n")
    total_saved = 0

    for i, item in enumerate(items):
        print(f"[{i+1}/{len(items)}] {item['name']} 처리 중...")
        content = crawl_article(item["url"])

        if not content.strip():
            print(f"  → 본문 없음, 스킵")
            continue

        doc_text = f"[항목명] {item['name']}\n[분야] {item['category']}\n\n{content}"
        vector = model.encode(doc_text).tolist()
        collection.add(
            embeddings=[vector],
            documents=[doc_text],
            ids=[item["eid"]],
            metadatas=[{"name": item["name"], "category": item["category"], "url": item["url"]}]
        )
        total_saved += 1
        print(f"  ✅ 저장 완료 ({total_saved}개)")
        time.sleep(CRAWL_DELAY)

    print(f"\n🎉 완료! 총 {total_saved}개 항목 저장됨")

if __name__ == "__main__":
    main()