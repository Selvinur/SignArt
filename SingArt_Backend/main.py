from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid

# Kendi yazdığımız dosyaları içe aktarıyoruz
from auth import router as auth_router
from db import (
    get_db_connection,
    init_db,
    upload_image_to_supabase,
    get_all_certificates,
    get_certificate_by_code,
    increment_like,
)

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

# İzin verilen resim uzantıları ve maksimum boyut (5 MB)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


# Sertifika Üretme Uç Noktası (artık resim de kabul ediyor -> form-data ile gönderilmeli)
@app.post("/api/generate-code")
async def generate_certificate(
    title: str = Form(...),
    dimensions: str = Form(...),
    year: str = Form(...),
    material: str = Form(...),
    theme: str = Form(...),
    docSize: str = Form(...),
    artistName: str = Form(...),
    artistEmail: str = Form(...),
    image: UploadFile = File(...),
):
    # 1. Resim kontrolü
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Sadece JPEG, PNG veya WEBP resim yükleyebilirsiniz.")

    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Resim boyutu 5 MB'ı geçemez.")

    # 2. Benzersiz Sertifika Kodunu Üret
    random_str = str(uuid.uuid4()).split('-')[0].upper()
    random_hash = str(uuid.uuid4()).split('-')[1].upper()
    unique_code = f"ART-{year}-{random_str}-{random_hash}"

    # 3. Resmi Supabase Storage'a yükle
    file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    storage_filename = f"{unique_code}.{file_extension}"
    image_url = upload_image_to_supabase(image_bytes, storage_filename, image.content_type)

    # 4. Veritabanına Kaydet
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO certificates 
            (code, title, dimensions, year, material, theme, doc_size, artist_name, artist_email, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            unique_code, title, dimensions, year,
            material, theme, docSize, artistName, artistEmail, image_url
        ))
        conn.commit()

        return {
            "status": "success",
            "code": unique_code,
            "image_url": image_url,
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        conn.close()


# Galeri: Tüm sertifikaları listele (ana ekran için)
@app.get("/api/certificates")
async def list_certificates():
    certs = get_all_certificates()
    return {"success": True, "certificates": certs}


# Tek bir sertifikanın detayını getir (tıklayınca açılan ekran için)
@app.get("/api/certificates/{code}")
async def get_certificate(code: str):
    cert = get_certificate_by_code(code)
    if not cert:
        raise HTTPException(status_code=404, detail="Sertifika bulunamadı.")
    return {"success": True, "certificate": cert}


# Beğeni: bir sertifikanın beğeni sayısını 1 artır
@app.post("/api/certificates/{code}/like")
async def like_certificate(code: str):
    result = increment_like(code)
    if not result:
        raise HTTPException(status_code=404, detail="Sertifika bulunamadı.")
    return {"success": True, "like_count": result["like_count"]}

@app.get("/")
async def root():
    return {"mesaj": "Signart Backend'i çalışıyor, ateşlemeye hazır!"}