import os
import bcrypt
import hashlib
import psycopg2
import requests

from dotenv import load_dotenv
from fastapi import HTTPException
from psycopg2.extras import RealDictCursor

load_dotenv()
# Supabase veritabanı bağlantı linkini .env dosyasından çekeceğiz
DATABASE_URL = os.getenv("DB_LINK")

# Supabase Storage (resim depolama) için ayarlar
# SUPABASE_URL örn: https://xxxxx.supabase.co
# SUPABASE_SERVICE_KEY: Supabase panelinde Settings > API > service_role key (secret, .env'de tutulacak)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
STORAGE_BUCKET = "certificate-images"  # Supabase panelinde bu isimde bir bucket oluşturulmalı (public)


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
            image_url    TEXT,
            like_count   INTEGER DEFAULT 0,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tablo daha önce oluşturulmuşsa ve image_url sütunu yoksa, ekle
    cursor.execute("""
        ALTER TABLE certificates ADD COLUMN IF NOT EXISTS image_url TEXT
    """)

    conn.commit()
    cursor.close()
    conn.close()


# ---------------------------
# RESİM YÜKLEME (Supabase Storage)
# ---------------------------
def upload_image_to_supabase(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Resmi Supabase Storage'a yükler, herkese açık (public) linkini döndürür."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase Storage ayarları (.env) eksik.")

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",  # aynı isimde dosya varsa üzerine yaz
    }
    response = requests.post(upload_url, headers=headers, data=file_bytes)

    if response.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"Resim yüklenemedi: {response.text}")

    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"


# ---------------------------
# GALERİ: TÜM SERTİFİKALARI LİSTELE
# ---------------------------
def get_all_certificates():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT code, title, dimensions, year, material, theme, doc_size,
                   artist_name, image_url, like_count, created_at
            FROM certificates
            ORDER BY created_at DESC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


# ---------------------------
# TEK SERTİFİKA DETAYI (kod ile)
# ---------------------------
def get_certificate_by_code(code: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT code, title, dimensions, year, material, theme, doc_size,
                   artist_name, image_url, like_count, created_at
            FROM certificates
            WHERE code=%s
        """, (code,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


# ---------------------------
# BEĞENİ SAYISINI ARTIR
# ---------------------------
def increment_like(code: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE certificates
            SET like_count = like_count + 1
            WHERE code = %s
            RETURNING like_count
        """, (code,))
        row = cursor.fetchone()
        conn.commit()
        return row
    finally:
        cursor.close()
        conn.close()