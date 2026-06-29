import os
import csv
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import chromadb

load_dotenv()

CSV_FILE      = "data/korean_encyclopedia_raw.csv"
CHROMA_PATH   = "./chroma_db"
COLLECTION    = "gangwon_culture"
CRAWL_DELAY   = 1.0
PROGRESS_FILE = "data/crawl_progress.json"

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

def crawl_article_selenium(driver, url: str) -> str:
    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#body_content, .article_body, .cont_body, .view_cont"))
        )
        time.sleep(2)

        texts = []

        # 정의문 (요약문) - 여러 셀렉터 시도
        for selector in [".summary", ".def_content", ".article-summary", ".view_cont > p:first-child", "#summary p"]:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for el in elements:
                    t = el.text.strip()
                    if t and t not in texts:
                        texts.append(t)
                if texts:
                    break
            except:
                pass

        # 본문 전체
        for selector in ["#body_content p", ".article_body p", ".cont_body p", ".view_cont p"]:
            try:
                sections = driver.find_elements(By.CSS_SELECTOR, selector)
                for s in sections:
                    t = s.text.strip()
                    if t and t not in texts:
                        texts.append(t)
                if len(texts) > 1:
                    break
            except:
                pass

        # fallback - 전체 텍스트
        if not texts:
            for selector in ["#body_content", ".article_body", ".view_cont", "main"]:
                try:
                    body = driver.find_element(By.CSS_SELECTOR, selector)
                    t = body.text.strip()
                    if t:
                        texts.append(t)
                        break
                except:
                    pass

        return "\n".join(texts)
    except Exception as e:
        print(f"  ⚠️ 크롤링 실패 ({url}): {e}")
        return ""

def load_progress() -> set:
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            return set(json.load(f))
    return set()

def save_progress(done_eids: set):
    os.makedirs("data", exist_ok=True)
    with open(PROGRESS_FILE, "w") as f:
        json.dump(list(done_eids), f)

def main():
    print("📂 1. CSV 파일 읽는 중...")
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

    print("🤖 3. 로컬 임베딩 모델 준비 중...")
    embeddings = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    print("🌐 4. Selenium 브라우저 시작 중...")
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )

    # 진행상황 초기화 (새로 시작)
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)
    done_eids = set()

    total_saved = 0

    try:
        for i, item in enumerate(items):
            eid = item["eid"]

            print(f"[{i+1}/{len(items)}] {item['name']} 크롤링 중...")
            content = crawl_article_selenium(driver, item["url"])

            if not content.strip():
                print(f"  → 본문 없음, 스킵")
                done_eids.add(eid)
                continue

            print(f"  → 본문 길이: {len(content)}자")
            doc_text = f"[항목명] {item['name']}\n[분야] {item['category']}\n\n{content}"
            vector = embeddings.encode(doc_text).tolist()
            collection.add(
                embeddings=[vector],
                documents=[doc_text],
                ids=[eid],
                metadatas=[{"name": item["name"], "category": item["category"], "url": item["url"]}]
            )
            total_saved += 1
            done_eids.add(eid)
            print(f"  ✅ 저장 완료 ({total_saved}개)")
            save_progress(done_eids)
            time.sleep(CRAWL_DELAY)

    finally:
        driver.quit()

    print(f"\n🎉 완료! 총 {total_saved}개 항목 저장됨")

if __name__ == "__main__":
    main()