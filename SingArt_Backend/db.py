import os
import bcrypt
import hashlib
import psycopg2

from dotenv import load_dotenv
from fastapi import HTTPException
from psycopg2.extras import RealDictCursor

load_dotenv()
# Supabase veritabanı bağlantı linkini .env dosyasından çekeceğiz
DATABASE_URL = os.getenv("DB_LINK")


def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


# ---------------------------
# ŞİFRE HASHLEME (bcrypt)
# ---------------------------
def hash_password(plain_password: str) -> str:
    sha256_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    hashed_bytes = bcrypt.hashpw(sha256_hash.encode('utf-8'), bcrypt.gensalt())
    return hashed_bytes.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    sha256_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return bcrypt.checkpw(sha256_hash.encode('utf-8'), hashed_password.encode('utf-8'))


def _dogrula(cursor, email: str, password: str):
    """Email + şifre eşleşiyorsa devam eder, yoksa 401 fırlatır."""
    cursor.execute("SELECT password FROM users WHERE email=%s", (email,))
    row = cursor.fetchone()
    if not row or not verify_password(password, row["password"]):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")


# ---------------------------
# TABLO OLUŞTURMA (Signart İçin)
# ---------------------------
def init_db():
    conn   = get_db_connection()
    cursor = conn.cursor()

    # 1. Kullanıcılar (Sanatçılar) Tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       SERIAL PRIMARY KEY,
            name     TEXT NOT NULL,
            email    TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    # 2. Sertifikalar (Eserler) Tablosu
    # Beğeni sistemi için like_count sütunu şimdiden eklendi!
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS certificates (
            id           SERIAL PRIMARY KEY,
            code         TEXT UNIQUE NOT NULL,
            title        TEXT NOT NULL,
            dimensions   TEXT,
            year         TEXT,
            material     TEXT,
            theme        TEXT,
            doc_size     TEXT,
            artist_name  TEXT,
            artist_email TEXT,
            like_count   INTEGER DEFAULT 0,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()