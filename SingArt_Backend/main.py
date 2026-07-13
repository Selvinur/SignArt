from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uuid

# Kendi yazdığımız dosyaları içe aktarıyoruz
from auth import router as auth_router
from schemas import CertificateModel
from db import get_db_connection, init_db

# Sunucu başlarken veritabanı tablolarını otomatik oluştur
try:
    init_db()
    print("Veritabanı tabloları hazırlandı/kontrol edildi.")
except Exception as e:
    print(f"Veritabanı bağlantı hatası (Henüz .env ayarlamadıysan normaldir): {e}")

app = FastAPI(title="Signart API")

# Ablanın frontend'i ile iletişime izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth rotalarını sisteme bağla (/api/register ve /api/login burada çalışacak)
app.include_router(auth_router, prefix="/api")

# Sertifika Üretme Uç Noktası
@app.post("/api/generate-code")
async def generate_certificate(cert: CertificateModel):
    # 1. Benzersiz Sertifika Kodunu Üret
    random_str = str(uuid.uuid4()).split('-')[0].upper()
    random_hash = str(uuid.uuid4()).split('-')[1].upper()
    unique_code = f"ART-{cert.year}-{random_str}-{random_hash}"
    
    # 2. Veritabanına Kaydet
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO certificates 
            (code, title, dimensions, year, material, theme, doc_size, artist_name, artist_email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            unique_code, cert.title, cert.dimensions, cert.year, 
            cert.material, cert.theme, cert.docSize, cert.artistName, cert.artistEmail
        ))
        conn.commit()
        
        return {
            "status": "success",
            "code": unique_code
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        conn.close()

@app.get("/")
async def root():
    return {"mesaj": "Signart Backend'i çalışıyor, ateşlemeye hazır!"}