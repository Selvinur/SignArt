from pydantic import BaseModel

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class CertificateModel(BaseModel):
    title: str
    dimensions: str
    year: str
    material: str
    theme: str
    docSize: str
    artistName: str
    artistEmail: str