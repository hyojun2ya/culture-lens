import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import chromadb

# 1. .env 파일에서 열쇠를 불러옵니다.
load_dotenv()

if not os.getenv("GOOGLE_API_KEY"):
    print("🚨 에러: .env 파일에서 GOOGLE_API_KEY를 찾을 수 없습니다.")
    exit()

print("1. 텍스트 파일 읽는 중...")
with open("data/culture_data.txt", "r", encoding="utf-8") as f:
    text_data = f.read()

documents = text_data.split("\n\n")

print("2. 크로마디비(벡터 DB) 생성 중...")
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="gangwon_culture")

print("3. 제미나이 임베딩(글자->숫자 변환기) 가동 중...")
# 에러의 진짜 원인 해결: 최신 통합 모델인 'gemini-embedding-001'로 변경합니다.
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")

print("4. 데이터베이스에 주입 중... (조금 걸릴 수 있습니다)")
for i, doc in enumerate(documents):
    if doc.strip():
        # 텍스트를 숫자로 변환
        vector = embeddings.embed_query(doc)
        # 데이터베이스에 주입
        collection.add(
            embeddings=[vector],
            documents=[doc],
            ids=[f"doc_{i}"]
        )

print("✅ 성공! 향토 데이터가 벡터 데이터베이스에 완벽하게 저장되었습니다.")