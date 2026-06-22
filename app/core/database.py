import sqlite3
from datetime import datetime

# 데이터베이스 장부 파일의 이름입니다.
DB_FILE = "culture_logs.db"

def init_db():
    # 장부를 열고(없으면 새로 만듦), 기록할 표를 그립니다.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scan_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            word TEXT,
            country TEXT,
            language TEXT,
            scan_time TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_scan_log(user_id: str, word: str, country: str, language: str):
    # 비동기 백그라운드 작업으로 호출되어 실제 장부에 데이터를 적어 넣는 함수입니다.
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO scan_logs (user_id, word, country, language, scan_time) VALUES (?, ?, ?, ?, ?)",
        (user_id, word, country, language, datetime.now())
    )
    conn.commit()
    conn.close()
    
    # 터미널 창에 기록이 잘 되었다고 개발자에게 몰래 알려줍니다.
    print(f"📝 [로그 저장 완료] {user_id}님이 '{word}'을(를) 스캔했습니다.")