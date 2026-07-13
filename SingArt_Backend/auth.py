from fastapi import APIRouter, HTTPException
from schemas import UserRegister, UserLogin
# db.py içinden kendi yazdığın veritabanı bağlantı ve şifreleme fonksiyonlarını çekiyoruz
from db import get_db_connection, hash_password, verify_password 

router = APIRouter()

# ---------------------------
# KAYIT OL (REGISTER)
# ---------------------------
@router.post("/register")
def register(user: UserRegister):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. E-posta sistemde var mı kontrolü
        cursor.execute("SELECT id FROM users WHERE email=%s", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")

        # 2. Yeni kullanıcıyı kaydetme
        cursor.execute(
            """INSERT INTO users (name, email, password)
               VALUES (%s, %s, %s)""",
            (user.name, user.email, hash_password(user.password))
        )
        conn.commit()
        
        # Ablanın frontend'i { success: true, user: {...} } formatında yanıt bekliyor
        return {
            "success": True,
            "user": {"name": user.name, "email": user.email}
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Sunucu hatası: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ---------------------------
# GİRİŞ YAP (LOGIN)
# ---------------------------
@router.post("/login")
def login(user: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Kullanıcıyı e-posta ile bul
        cursor.execute(
            "SELECT email, name, password FROM users WHERE email=%s",
            (user.email,)
        )
        db_user = cursor.fetchone()

        # Kullanıcı yoksa veya şifre yanlışsa
        if not db_user or not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Hatalı e-posta veya şifre!")

        # Frontend'in beklediği formatta başarılı yanıt
        return {
            "success": True,
            "user": {"name": db_user["name"], "email": db_user["email"]}
        }
    finally:
        cursor.close()
        conn.close()