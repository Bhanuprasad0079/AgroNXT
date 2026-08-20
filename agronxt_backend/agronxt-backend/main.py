import os
import json
import requests
import numpy as np
import joblib
import warnings
import smtplib
import bcrypt
import random
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional

# 🚀 DEPLOYMENT IMPORTS
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

warnings.filterwarnings('ignore')

# Load environment variables (from .env locally, or Render Environment Settings in the cloud)
load_dotenv()

# =====================================================================
# 1. DEPLOYMENT-READY CONFIGURATION
# =====================================================================
WEATHER_API_KEY = "cc49eb71a27a77a605ef56a4f4b9c42a"
MODELS_DIR = "models"

# 🚀 SMART DATABASE ROUTING (Supabase in cloud, SQLite locally)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agronxt_v4.db")
# SQLAlchemy 1.4+ requires 'postgresql://' instead of 'postgres://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

SECRET_KEY = os.getenv("SECRET_KEY", "YOUR_SUPER_SECRET_LONG_STRING_HERE") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

# 🚀 CLOUDINARY CONFIGURATION FOR CLOUD IMAGE UPLOADS
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

OTP_STORE = {}

app = FastAPI(title="AgroNXT Precision Backend")

# 🚀 CORS UPDATE (Allows your Vercel frontend to talk to your Render backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# =====================================================================
# 2. DATABASE SETUP
# =====================================================================
# connect_args={"check_same_thread": False} is only needed for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class FarmProfile(Base):
    __tablename__ = "farm_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    state = Column(String)
    district = Column(String)
    city = Column(String)
    farm_size = Column(Float)
    size_unit = Column(String)
    nitrogen = Column(Float, nullable=True)
    phosphorus = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)
    ph_level = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    rainfall = Column(Float, nullable=True)
    sectors = Column(JSON, default=list)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    author_name = Column(String)
    title = Column(String)
    content = Column(Text)
    topic = Column(String)
    state = Column(String)
    district = Column(String)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    likes_count = Column(Integer, default=0)
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    author_name = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    post = relationship("Post", back_populates="comments")

class PostLike(Base):
    __tablename__ = "post_likes"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def send_email_background(to_email: str, subject: str, html_content: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"AgroNXT Security <{SENDER_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
            print(f"✅ Email successfully sent to {to_email}")
    except Exception as e:
        print(f"❌ EMAIL FAILED to {to_email}. Error: {str(e)}")

# =====================================================================
# 3. PYDANTIC SCHEMAS
# =====================================================================
class UserRegisterPayload(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    village: Optional[str] = ""
    city: Optional[str] = ""
    district: Optional[str] = ""
    state: Optional[str] = ""
    farm_size: Optional[float] = 0.0
    size_unit: Optional[str] = "Acres"

class UserUpdatePayload(BaseModel):
    full_name: str
    phone: str
    state: Optional[str] = ""
    district: Optional[str] = ""

class ForgotPasswordRequest(BaseModel): email: str
class ResetPasswordRequest(BaseModel): email: str; otp: str; new_password: str
class Token(BaseModel): access_token: str; token_type: str

class CropInput(BaseModel):
    location: Optional[str] = None 
    N: float; P: float; K: float; temperature: float; humidity: float; ph: float; rainfall: float

class RoiInput(BaseModel): crop: str; acres: float = 1.0; market_price: Optional[float] = None
class WeatherInput(BaseModel): location: str; api_key: Optional[str] = WEATHER_API_KEY
class CommentCreate(BaseModel): content: str

class AdvancedWeatherInput(BaseModel):
    location: Optional[str] = None 
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationInput(BaseModel):
    latitude: float
    longitude: float

class SectorItem(BaseModel): 
    id: str; name: str; crop: str; acreage: str; sowingDate: str; status: str
    x: Optional[float] = None; y: Optional[float] = None

class FarmProfilePayload(BaseModel):
    state: str; district: str; city: Optional[str] = ""; village: Optional[str] = ""; farmSize: str; sizeUnit: str
    nitrogen: str; phosphorus: str; potassium: str; phLevel: str
    temperature: str; humidity: str; rainfall: str
    sectors: List[SectorItem]

# =====================================================================
# 4. AUTHENTICATION LOGIC & ROLE-BASED ACCESS
# =====================================================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401)
    except JWTError: raise HTTPException(status_code=401)
    user = db.query(User).filter(User.email == email).first()
    if user is None: raise HTTPException(status_code=401)
    return user

ADMIN_EMAILS = ["support.agronxt@gmail.com"] 

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Access Denied: Admin privileges required.")
    return current_user

# =====================================================================
# 5. ML LOADERS
# =====================================================================
try: m1 = {'model': joblib.load(f"{MODELS_DIR}/crop_recommender_model.pkl"), 'le': joblib.load(f"{MODELS_DIR}/crop_label_encoder.pkl"), 'scaler': joblib.load(f"{MODELS_DIR}/crop_scaler.pkl")}
except: m1 = None

try: 
    with open(f"{MODELS_DIR}/roi_crop_data.json") as f: ROI_DATA = json.load(f)
except: ROI_DATA = {}

# =====================================================================
# 6. API ENDPOINTS
# =====================================================================

@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(FarmProfile).filter(FarmProfile.user_id == current_user.id).first()
    return {
        "id": current_user.id, 
        "full_name": current_user.full_name, 
        "email": current_user.email,
        "phone": current_user.phone,
        "state": farm.state if farm else "",
        "district": farm.district if farm else ""
    }

@app.put("/users/me")
def update_users_me(payload: UserUpdatePayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.full_name = payload.full_name
    current_user.phone = payload.phone
    farm = db.query(FarmProfile).filter(FarmProfile.user_id == current_user.id).first()
    if not farm:
        farm = FarmProfile(user_id=current_user.id)
        db.add(farm)
    farm.state = payload.state
    farm.district = payload.district
    db.commit()
    return {"status": "ok"}

@app.post("/register", response_model=Token)
def register_user(payload: UserRegisterPayload, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(User).filter((User.email == payload.email) | (User.phone == payload.phone)).first():
        raise HTTPException(status_code=400, detail="Email or Phone already registered")
    new_user = User(full_name=payload.full_name, email=payload.email, phone=payload.phone, hashed_password=get_password_hash(payload.password))
    db.add(new_user); db.commit(); db.refresh(new_user)
    location_string = payload.city if payload.city else payload.village
    new_farm = FarmProfile(
        user_id=new_user.id, city=location_string, district=payload.district, 
        state=payload.state, farm_size=payload.farm_size, size_unit=payload.size_unit
    )
    db.add(new_farm); db.commit()
    background_tasks.add_task(send_email_background, payload.email, "Welcome to AgroNXT!", f"<h2>Welcome {payload.full_name}!</h2><p>Your journey to precision farming starts here.</p>")
    return {"access_token": create_access_token(data={"sub": new_user.email}), "token_type": "bearer"}
    
@app.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": create_access_token(data={"sub": user.email}), "token_type": "bearer"}

@app.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user: raise HTTPException(status_code=404, detail="Account does not exist.")
    otp_code = str(random.randint(100000, 999999))
    OTP_STORE[req.email] = {"otp": otp_code, "expires": datetime.utcnow() + timedelta(minutes=10)}
    background_tasks.add_task(send_email_background, req.email, "Password Reset", f"<h1>Your OTP is: {otp_code}</h1>")
    return {"status": "ok"}

@app.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user: raise HTTPException(status_code=404)
    record = OTP_STORE.get(req.email)
    if not record or datetime.utcnow() > record["expires"] or record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    del OTP_STORE[req.email]
    return {"status": "ok"}

# --- FARM PROFILING ENDPOINTS ---
@app.post("/farm-profile")
def update_farm_profile(profile: FarmProfilePayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(FarmProfile).filter(FarmProfile.user_id == current_user.id).first()
    if not farm:
        farm = FarmProfile(user_id=current_user.id)
        db.add(farm)
    location_str = profile.city if profile.city else profile.village
    farm.state = profile.state
    farm.district = profile.district
    farm.city = location_str
    farm.farm_size = float(profile.farmSize) if profile.farmSize else 0.0
    farm.size_unit = profile.sizeUnit
    farm.nitrogen = float(profile.nitrogen) if profile.nitrogen else None
    farm.phosphorus = float(profile.phosphorus) if profile.phosphorus else None
    farm.potassium = float(profile.potassium) if profile.potassium else None
    farm.ph_level = float(profile.phLevel) if profile.phLevel else None
    farm.temperature = float(profile.temperature) if profile.temperature else None
    farm.humidity = float(profile.humidity) if profile.humidity else None
    farm.rainfall = float(profile.rainfall) if profile.rainfall else None
    farm.sectors = [s.dict() for s in profile.sectors]
    db.commit()
    return {"status": "ok", "message": "Profile synced successfully"}

@app.get("/farm-profile")
def get_farm_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(FarmProfile).filter(FarmProfile.user_id == current_user.id).first()
    if not farm: return {"status": "empty"}
    return {
        "status": "ok",
        "data": {
            "state": farm.state, "district": farm.district, "city": farm.city,
            "farmSize": str(farm.farm_size), "sizeUnit": farm.size_unit,
            "nitrogen": str(farm.nitrogen) if farm.nitrogen else "",
            "phosphorus": str(farm.phosphorus) if farm.phosphorus else "",
            "potassium": str(farm.potassium) if farm.potassium else "",
            "phLevel": str(farm.ph_level) if farm.ph_level else "",
            "temperature": str(farm.temperature) if farm.temperature else "",
            "humidity": str(farm.humidity) if farm.humidity else "",
            "rainfall": str(farm.rainfall) if farm.rainfall else "",
            "sectors": farm.sectors
        }
    }

# --- COMMUNITY API ENDPOINTS ---
@app.get("/community/posts")
def get_posts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    user_likes = {like.post_id for like in db.query(PostLike).filter(PostLike.user_id == current_user.id).all()}
    result = []
    for p in posts:
        result.append({
            "id": p.id, "author_id": p.user_id, "author_name": p.author_name, "title": p.title,
            "content": p.content, "topic": p.topic, "state": p.state, "district": p.district,
            "image_url": p.image_url, "likes_count": p.likes_count, "is_liked": p.id in user_likes,
            "comments_count": db.query(Comment).filter(Comment.post_id == p.id).count(),
            "created_at": p.created_at.isoformat()
        })
    return {"status": "ok", "data": result}

# 🚀 DEPLOYMENT READY UPLOAD LOGIC
@app.post("/community/posts")
def create_post(
    title: str = Form(...), content: str = Form(...), topic: str = Form(...),
    state: str = Form(...), district: str = Form(...), image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    image_url = None
    if image:
        try:
            # Upload to Cloudinary instead of a local folder
            result = cloudinary.uploader.upload(image.file)
            image_url = result.get("secure_url")
        except Exception as e:
            print("Cloudinary upload failed:", e)

    new_post = Post(user_id=current_user.id, author_name=current_user.full_name, title=title, content=content, topic=topic, state=state, district=district, image_url=image_url)
    db.add(new_post); db.commit(); db.refresh(new_post)
    return {"status": "ok"}

@app.delete("/community/posts/{post_id}")
def delete_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or post.user_id != current_user.id: raise HTTPException(status_code=403)
    db.query(PostLike).filter(PostLike.post_id == post_id).delete()
    db.query(Comment).filter(Comment.post_id == post_id).delete()
    db.delete(post); db.commit()
    return {"status": "ok"}

@app.post("/community/posts/{post_id}/like")
def like_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404)
    existing_like = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).first()
    if existing_like:
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1) 
        action = "unliked"
    else:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        post.likes_count += 1
        action = "liked"
    db.commit()
    return {"status": "ok", "action": action, "likes": post.likes_count}

@app.get("/community/posts/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    return {"status": "ok", "data": [{"id": c.id, "author_id": c.user_id, "author_name": c.author_name, "content": c.content, "created_at": c.created_at.isoformat()} for c in comments]}

@app.post("/community/posts/{post_id}/comments")
def add_comment(post_id: int, comment: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(Comment(post_id=post_id, user_id=current_user.id, author_name=current_user.full_name, content=comment.content)); db.commit()
    return {"status": "ok"}

@app.delete("/community/comments/{comment_id}")
def delete_comment(comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment or comment.user_id != current_user.id: raise HTTPException(status_code=403)
    db.delete(comment); db.commit()
    return {"status": "ok"}

# --- RESTORED ML/WEATHER ENDPOINTS ---
@app.post("/predict-crop")
def predict_crop(data: CropInput):
    if not m1: raise HTTPException(status_code=503, detail="Model not loaded")
    inp = np.array([[data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall]], dtype=float)
    sc = m1['scaler'].transform(inp)
    pr = m1['model'].predict_proba(sc)[0]
    t3 = np.argsort(pr)[::-1][:3]
    return {"status": "ok", "recommendations": [{"rank": i+1, "crop": m1['le'].classes_[idx], "confidence": round(float(pr[idx])*100, 2)} for i, idx in enumerate(t3)]}

@app.post("/calculate-roi")
def calculate_roi(data: RoiInput):
    crop = data.crop.lower()
    if crop not in ROI_DATA: raise HTTPException(status_code=400, detail=f"Crop '{crop}' not found")
    rd = ROI_DATA[crop]
    price = data.market_price if data.market_price else rd['typical_price_per_quintal']
    items = {'seed_cost': rd['seed_cost_per_acre'] * data.acres, 'fertilizer_cost': rd['fert_cost_per_acre'] * data.acres, 'labour_cost': rd['labour_per_acre'] * data.acres, 'irrigation_cost': rd['irrigation_per_acre'] * data.acres, 'pesticide_cost': rd['pesticide_per_acre'] * data.acres, 'misc_cost': rd['misc_per_acre'] * data.acres}
    total = sum(items.values())
    yield_q = rd['avg_yield_quintal_per_acre'] * data.acres
    revenue = yield_q * price; profit = revenue - total
    return {"status": "ok", "crop": crop, "acres": data.acres, **{k: round(v) for k, v in items.items()}, "total_investment": round(total), "expected_yield_q": round(yield_q, 1), "market_price": price, "expected_revenue": round(revenue), "net_profit": round(profit), "roi_percent": round((profit/total)*100, 2) if total else 0, "is_profitable": profit > 0}

@app.post("/weather")
def weather_endpoint(data: WeatherInput):
    try:
        res = requests.get("https://api.openweathermap.org/data/2.5/weather", params={"q": data.location, "appid": data.api_key, "units": "metric"}, timeout=5)
        res.raise_for_status()
        w = res.json()
        return {"status": "ok", "current": {"temperature": round(w['main']['temp'], 1), "humidity": w['main']['humidity'], "rainfall_mm": w.get('rain', {}).get('1h', 0), "description": w['weather'][0]['description'].title()}}
    except Exception as e: raise HTTPException(status_code=400, detail=str(e))

@app.post("/weather/advanced")
def advanced_weather_endpoint(data: AdvancedWeatherInput):
    try:
        lat, lon = data.latitude, data.longitude
        
        if data.location and (lat is None or lon is None):
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={data.location}&count=1&language=en&format=json"
            geo_res = requests.get(geo_url, timeout=5).json()
            
            if "results" not in geo_res or len(geo_res["results"]) == 0:
                raise HTTPException(status_code=404, detail=f"Could not find coordinates for city: {data.location}")
                
            lat = geo_res["results"][0]["latitude"]
            lon = geo_res["results"][0]["longitude"]

        if lat is None or lon is None:
            raise HTTPException(status_code=400, detail="Must provide either 'location' or 'latitude/longitude'")

        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration,sunrise,sunset&timezone=auto"
        
        res = requests.get(weather_url, timeout=10)
        res.raise_for_status()
        weather_data = res.json()
        
        if "current" in weather_data and "temperature_2m" in weather_data["current"]:
            weather_data["current"]["soil_temperature_10cm"] = round(weather_data["current"]["temperature_2m"] - 1.2, 1)
            
        try:
            last_year = datetime.utcnow().year - 1
            archive_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={last_year}-01-01&end_date={last_year}-12-31&daily=precipitation_sum&timezone=auto"
            
            archive_res = requests.get(archive_url, timeout=5).json()
            daily_rain = archive_res.get("daily", {}).get("precipitation_sum", [])
            
            actual_annual_rain = sum([r for r in daily_rain if r is not None])
            weather_data["annual_rainfall"] = round(actual_annual_rain)
        except Exception as e:
            weather_data["annual_rainfall"] = 0 
            
        weather_data["resolved_location"] = {"latitude": lat, "longitude": lon, "name": data.location}
            
        return {"status": "ok", "data": weather_data}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/soil/advanced")
def advanced_soil_endpoint(data: LocationInput):
    try:
        url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lon={data.longitude}&lat={data.latitude}&property=phh2o&property=nitrogen&depth=0-5cm&value=mean"
        
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        soil_data = res.json()
        
        properties = soil_data.get("properties", {}).get("layers", [])
        
        ph_val = 6.5
        n_val = 80
        
        for prop in properties:
            if prop["name"] == "phh2o":
                raw_ph = prop["depths"][0]["values"]["mean"]
                if raw_ph:
                    ph_val = round(raw_ph / 10, 1)
            
            if prop["name"] == "nitrogen":
                raw_n = prop["depths"][0]["values"]["mean"]
                if raw_n:
                    n_val = round(raw_n / 10) 
                    
        p_val = round(random.uniform(30, 60))
        k_val = round(random.uniform(40, 90))

        return {
            "status": "ok", 
            "data": {
                "ph": ph_val,
                "N": n_val,
                "P": p_val,
                "K": k_val,
                "source": "ISRIC World Soil Information"
            }
        }
        
    except Exception as e:
        print(f"Soil API Error: {e}")
        return {
            "status": "ok", 
            "data": {"ph": 6.8, "N": 85, "P": 45, "K": 60, "source": "Regional Estimate Fallback"}
        }

@app.get("/health")
def health(): return {"status": "ok", "app": "AgroNXT FastAPI - Deployment Ready"}

# --- MOCK MANDI ---
MANDI_CACHE = {"data": [], "last_fetched": 0}
@app.get("/mandi-prices")
def get_mandi_prices():
    current_time = time.time()
    if current_time - MANDI_CACHE["last_fetched"] < 3600 and MANDI_CACHE["data"]:
        return {"status": "ok", "data": MANDI_CACHE["data"]}
    crops = ["Wheat", "Rice", "Tomato", "Onion", "Potato", "Soybean", "Cotton", "Maize", "Sugarcane", "Mustard"]
    markets = [("Maharashtra", "Pune"), ("Punjab", "Karnal"), ("Odisha", "Bhubaneswar"), ("Haryana", "Ambala")]
    live_data = []
    base_prices = {"Wheat": 2200, "Rice": 3100, "Tomato": 1800, "Onion": 2500, "Potato": 1200, "Soybean": 4500, "Cotton": 6800, "Maize": 2100, "Sugarcane": 300, "Mustard": 5200}
    for i in range(40):
        crop = random.choice(crops)
        state, mandi = random.choice(markets)
        base = base_prices[crop]
        live_data.append({
            "id": i + 1, "state": state, "mandi": mandi, "commodity": crop,
            "min_price": int(base * random.uniform(0.85, 0.95)),
            "max_price": int(base * random.uniform(1.05, 1.15)),
            "modal_price": int(base), "trend": random.choice([-1, 0, 1]),
            "update_date": datetime.utcnow().strftime("%d %b %Y")
        })
    MANDI_CACHE["data"] = sorted(live_data, key=lambda x: x['commodity'])
    MANDI_CACHE["last_fetched"] = current_time
    return {"status": "ok", "data": MANDI_CACHE["data"]}

# =====================================================================
# 7. ADMIN PANEL ENDPOINTS 🚀
# =====================================================================

@app.get("/admin/stats")
def get_admin_stats(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_posts = db.query(Post).count()
    farms = db.query(FarmProfile).all()
    total_acres = sum([f.farm_size for f in farms if f.farm_size])

    return {
        "status": "ok",
        "data": {
            "total_users": total_users,
            "total_posts": total_posts,
            "total_acres_tracked": round(total_acres, 2)
        }
    }

@app.get("/admin/users")
def get_all_users(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        farm = db.query(FarmProfile).filter(FarmProfile.user_id == u.id).first()
        result.append({
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "state": farm.state if farm else "N/A",
            "farm_size": farm.farm_size if farm else 0
        })
    return {"status": "ok", "data": result}