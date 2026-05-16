from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, String, DateTime, Float, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from datetime import datetime, timedelta
import uuid
import jwt
import secrets
import re
import numpy as np

# Voice processing imports (temporarily commented out for compatibility)
# import speech_recognition as sr
# from googletrans import Translator
# import tempfile
# import logging

# Configure logging (temporarily commented out)
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# Initialize translator (temporarily commented out)
# translator = Translator()

# Database setup
DATABASE_URL = "sqlite:///./sanitix.db"
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT Configuration
SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# AI Severity Analysis Configuration
HIGH_SEVERITY_KEYWORDS = [
    "emergency", "dangerous", "hazardous", "toxic", "contaminated", "sewage", 
    "overflowing", "flood", "blocked", "broken", "collapsed", "danger", "urgent",
    "immediate", "critical", "severe", "major", "extreme", "unsafe", "health risk",
    "bacteria", "virus", "infection", "disease", "pollution", "chemical spill",
    "no access", "completely blocked", "system failure", "broken pipe", "gas leak",
    "fire", "explosion", "accident", "injury", "medical emergency"
]

MEDIUM_SEVERITY_KEYWORDS = [
    "dirty", "unclean", "messy", "unpleasant", "odor", "smell", "stain",
    "leaking", "dripping", "clogged", "slow", "partial", "moderate",
    "needs attention", "requires cleaning", "maintenance", "repair", "worn out",
    "damaged", "malfunctioning", "poor condition", "inadequate", "insufficient"
]

LOW_SEVERITY_KEYWORDS = [
    "minor", "small", "light", "occasional", "slight", "minor issue",
    "cosmetic", "appearance", "suggestion", "improvement", "recommendation",
    "general cleaning", "routine", "scheduled", "preventive", "minor maintenance"
]

def analyze_severity(description: str, has_image: bool = False, image_analysis: dict = None) -> dict:
    """
    AI-based severity analysis for sanitation reports using keyword detection and image analysis
    """
    description_lower = description.lower()
    
    # Count keyword matches
    high_score = sum(1 for keyword in HIGH_SEVERITY_KEYWORDS if keyword in description_lower)
    medium_score = sum(1 for keyword in MEDIUM_SEVERITY_KEYWORDS if keyword in description_lower)
    low_score = sum(1 for keyword in LOW_SEVERITY_KEYWORDS if keyword in description_lower)
    
    # Determine base severity from keyword analysis
    if high_score > 0:
        base_severity = "High"
        confidence = min(0.7 + (high_score * 0.1), 0.95)
    elif medium_score > 0:
        base_severity = "Medium"
        confidence = min(0.5 + (medium_score * 0.1), 0.85)
    elif low_score > 0:
        base_severity = "Low"
        confidence = min(0.3 + (low_score * 0.1), 0.75)
    else:
        base_severity = "Medium"  # Default to medium for unknown descriptions
        confidence = 0.4
    
    # Enhanced image analysis
    if has_image and image_analysis:
        image_severity = image_analysis.get('severity', 'Medium')
        image_confidence = image_analysis.get('confidence', 0.5)
        image_issues = image_analysis.get('issues', [])
        
        # Combine text and image analysis
        if image_severity == "High" or len(image_issues) > 2:
            base_severity = "High"
            confidence = max(confidence, image_confidence)
        elif image_severity == "High" and base_severity == "Low":
            base_severity = "Medium"
            confidence = (confidence + image_confidence) / 2
        elif image_severity == "Medium" and base_severity == "Low":
            base_severity = "Medium"
            confidence = (confidence + image_confidence) / 2
        elif has_image:  # Image present but no detailed analysis
            if base_severity == "Low":
                base_severity = "Medium"
                confidence = min(confidence + 0.15, 0.8)
            elif base_severity == "Medium":
                base_severity = "High"
                confidence = min(confidence + 0.2, 0.9)
    
    # Generate enhanced analysis and required action
    analysis = generate_enhanced_analysis(base_severity, description_lower, high_score, medium_score, low_score, image_analysis)
    required_action = get_detailed_required_action(base_severity, image_analysis)
    
    return {
        "severity": base_severity,
        "confidence": round(confidence, 2),
        "analysis": analysis,
        "required_action": required_action,
        "detected_issues": image_analysis.get('issues', []) if image_analysis else [],
        "estimated_resolution_time": get_resolution_time(base_severity),
        "keyword_scores": {
            "high": high_score,
            "medium": medium_score,
            "low": low_score
        }
    }

def generate_enhanced_analysis(severity: str, description: str, high_score: int, medium_score: int, low_score: int, image_analysis: dict = None) -> str:
    """Generate detailed analysis based on detected keywords and image issues"""
    if severity == "High":
        if high_score >= 3:
            return "Multiple high-risk indicators detected. This report indicates a serious sanitation issue requiring immediate attention."
        elif high_score >= 2:
            return "High-risk keywords detected. This appears to be a critical sanitation issue."
        else:
            return "Critical sanitation issue detected based on description keywords."
    elif severity == "Medium":
        if medium_score >= 3:
            return "Multiple maintenance-related issues detected. Regular attention required."
        elif medium_score >= 2:
            return "Moderate sanitation issue requiring scheduled attention."
        else:
            return "Standard maintenance issue detected."
    else:  # Low
        if low_score >= 2:
            return "Minor issues detected that can be addressed during routine maintenance."
        else:
            return "General sanitation observation requiring routine attention."

def get_required_action(severity: str) -> str:
    """Determine required action based on severity"""
    if severity == "High":
        return "Immediate dispatch required. Send team within 2 hours. Priority response needed."
    elif severity == "Medium":
        return "Schedule inspection within 24 hours. Plan for routine maintenance."
    else:  # Low
        return "Add to routine maintenance schedule. Address during next cleaning cycle."

def get_detailed_required_action(severity: str, image_analysis: dict = None) -> str:
    """Determine detailed required action based on severity and image analysis"""
    detected_issues = image_analysis.get('issues', []) if image_analysis else []
    
    if severity == "High":
        if "sewage_backup" in detected_issues or "contamination" in detected_issues:
            return "EMERGENCY: Immediate biohazard response team required. Close area immediately. Professional cleanup and disinfection needed within 1 hour."
        elif "structural_damage" in detected_issues:
            return "URGENT: Maintenance team and structural engineer required. Area must be secured immediately. Repair within 2 hours."
        else:
            return "CRITICAL: Immediate dispatch required. Send emergency team within 2 hours. Full safety assessment and cleanup needed."
    elif severity == "Medium":
        if "plumbing_issue" in detected_issues:
            return "SCHEDULED: Plumbing team required within 24 hours. Parts may need to be ordered. Temporary containment needed."
        elif "cleaning_required" in detected_issues:
            return "ROUTINE: Deep cleaning team required within 24 hours. Specialized cleaning supplies needed."
        else:
            return "STANDARD: Schedule inspection within 24 hours. Plan for routine maintenance and repairs."
    else:  # Low
        if "minor_cleaning" in detected_issues:
            return "ROUTINE: Add to daily cleaning schedule. Basic supplies needed."
        else:
            return "MAINTENANCE: Add to routine maintenance schedule. Address during next cleaning cycle."

def get_resolution_time(severity: str) -> str:
    """Estimate resolution time based on severity"""
    if severity == "High":
        return "2-4 hours (Emergency response)"
    elif severity == "Medium":
        return "24-48 hours (Scheduled maintenance)"
    else:
        return "3-7 days (Routine maintenance)"

def analyze_image_content(image_file: UploadFile) -> dict:
    """Analyze image content for sanitation issues (mock implementation)"""
    # This is a mock implementation - in production, you would use computer vision
    # For now, we'll simulate image analysis based on file characteristics
    return {
        "severity": "Medium",
        "confidence": 0.5,
        "issues": ["plumbing_issue", "cleaning_required"]
    }

def get_image_recommendations(issues: list) -> list:
    """Get specific recommendations based on detected image issues"""
    recommendations = []
    
    if "sewage_backup" in issues:
        recommendations.extend(["Biohazard cleanup required", "Area quarantine", "Professional disinfection"])
    if "contamination" in issues:
        recommendations.extend(["Deep cleaning", "Sanitization", "Health inspection"])
    if "structural_damage" in issues:
        recommendations.extend(["Structural assessment", "Immediate repairs", "Safety barriers"])
    if "plumbing_issue" in issues:
        recommendations.extend(["Plumbing inspection", "Pipe repair/replacement", "Water supply check"])
    if "trash_accumulation" in issues:
        recommendations.extend(["Waste removal", "Bin replacement", "Increased collection frequency"])
    if "cleaning_required" in issues:
        recommendations.extend(["Deep cleaning", "Disinfection", "Regular maintenance schedule"])
    
    if not recommendations:
        recommendations = ["Routine inspection", "Standard cleaning procedures", "Follow-up monitoring"]
    
    return recommendations

# Pydantic models
class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class FeedbackCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    category: str = "General"
    subject: str
    message: str
    priority: str = "Medium"

class FeedbackResponse(BaseModel):
    id: str
    user_id: Optional[str]
    name: Optional[str]
    email: Optional[str]
    category: str
    subject: str
    message: str
    status: str
    priority: str
    admin_reply: Optional[str]
    admin_reply_timestamp: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class FeedbackReply(BaseModel):
    reply: str

# Database models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)  # In production, this should be hashed with bcrypt
    name = Column(String)
    role = Column(String, default="user")  # "user" or "admin"
    created_at = Column(DateTime, default=datetime.utcnow)

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    location = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(String)
    severity = Column(String)  # Low, Medium, High
    estimated_time = Column(String)
    analysis = Column(String)
    status = Column(String, default="Pending")  # Pending, In Progress, Resolved
    timestamp = Column(DateTime, default=datetime.utcnow)
    image_filename = Column(String, nullable=True)
    audio_filename = Column(String, nullable=True)
    assigned_workers = Column(Integer, default=0)
    original_text = Column(String, nullable=True)
    detected_language = Column(String, nullable=True)
    translated_text = Column(String, nullable=True)
    input_method = Column(String, default="text")  # "text", "voice", "image"

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True)  # Can be anonymous
    name = Column(String, nullable=True)  # Optional name for anonymous feedback
    email = Column(String, nullable=True)  # Optional email for anonymous feedback
    category = Column(String, default="General")  # Bug, Feature, Improvement, General
    subject = Column(String)
    message = Column(String)
    status = Column(String, default="Pending")  # Pending, In Review, Resolved
    priority = Column(String, default="Medium")  # Low, Medium, High
    admin_reply = Column(String, nullable=True)
    admin_reply_timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============ JWT UTILITIES ============
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

# ============ SECURITY ============
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return payload

def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============ INITIALIZE DEFAULT USERS ============
def init_default_users():
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == "admin@sanitix.com").first()
        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                email="admin@sanitix.com",
                password="admin123",  # In production, hash this
                name="Admin",
                role="admin"
            )
            db.add(admin_user)
            print("✓ Created default admin user")
        
        # Check if regular user exists
        user = db.query(User).filter(User.email == "user@sanitix.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="user@sanitix.com",
                password="user123",  # In production, hash this
                name="Test User",
                role="user"
            )
            db.add(user)
            print("✓ Created default test user")
        
        db.commit()
    finally:
        db.close()

# Initialize users on startup
init_default_users()

# ============ AI ANALYSIS ENGINE ============

def analyze_image_content(image_file: UploadFile) -> dict:
    """Analyze image content to detect sanitation issues and determine severity"""
    try:
        # Read image file
        image_content = image_file.file.read()
        image_file.file.seek(0)  # Reset file pointer
        
        # Convert to PIL Image for analysis
        from PIL import Image
        import io
        import numpy as np
        
        # Open image with PIL
        img = Image.open(io.BytesIO(image_content))
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Get image dimensions and basic properties
        width, height = img.size
        img_array = np.array(img)
        
        # Analyze image for sanitation issues
        detected_issues = []
        severity_score = 0
        
        # Color analysis for contamination detection
        # Dark brown/black colors may indicate sewage, rotting waste
        dark_colors = detect_color_percentage(img_array, [50, 30, 20], [100, 80, 60])  # Dark brown/black
        if dark_colors > 15:  # More than 15% dark colors
            detected_issues.append("Dark contamination detected")
            severity_score += 30
        
        # Green/yellow colors may indicate mold, algae, or chemical contamination
        green_colors = detect_color_percentage(img_array, [50, 100, 50], [150, 200, 150])  # Green
        yellow_colors = detect_color_percentage(img_array, [200, 200, 50], [255, 255, 150])  # Yellow
        if green_colors + yellow_colors > 20:
            detected_issues.append("Potential biological/chemical contamination")
            severity_score += 25
        
        # Red/orange colors may indicate hazardous materials
        red_colors = detect_color_percentage(img_array, [150, 50, 50], [255, 100, 100])  # Red
        if red_colors > 10:
            detected_issues.append("Hazardous material indicators")
            severity_score += 35
        
        # Texture analysis for debris detection
        texture_variance = calculate_texture_variance(img_array)
        if texture_variance > 1000:  # High texture variance indicates debris/clutter
            detected_issues.append("High debris concentration")
            severity_score += 20
        
        # Brightness analysis for overflow detection
        avg_brightness = np.mean(img_array)
        if avg_brightness < 80:  # Very dark areas may indicate blocked drains/sewage
            detected_issues.append("Potential blockage/overflow")
            severity_score += 25
        
        # Size analysis - larger affected area increases severity
        image_area = width * height
        if image_area > 500000:  # Large images indicate widespread issues
            severity_score += 15
        elif image_area > 200000:
            severity_score += 10
        
        # Determine severity based on score
        if severity_score >= 60:
            detected_severity = "High"
        elif severity_score >= 30:
            detected_severity = "Medium"
        else:
            detected_severity = "Low"
        
        # Create description
        if detected_issues:
            description = ", ".join(detected_issues[:3])  # Limit to top 3 issues
        else:
            description = "General sanitation issue detected"
        
        return {
            "detected_severity": detected_severity,
            "description": description,
            "severity_score": severity_score,
            "detected_issues": detected_issues
        }
        
    except Exception as e:
        print(f"Image analysis error: {str(e)}")
        return {
            "detected_severity": None,
            "description": "Image analysis failed",
            "severity_score": 0,
            "detected_issues": []
        }

def detect_color_percentage(img_array: np.ndarray, color_min: list, color_max: list) -> float:
    """Calculate percentage of pixels within a color range"""
    try:
        # Create mask for color range
        mask = (
            (img_array[:, :, 0] >= color_min[0]) & (img_array[:, :, 0] <= color_max[0]) &
            (img_array[:, :, 1] >= color_min[1]) & (img_array[:, :, 1] <= color_max[1]) &
            (img_array[:, :, 2] >= color_min[2]) & (img_array[:, :, 2] <= color_max[2])
        )
        
        # Calculate percentage
        percentage = (np.sum(mask) / img_array.size) * 300  # Multiply by 3 for RGB channels
        return percentage
        
    except Exception as e:
        print(f"Color detection error: {str(e)}")
        return 0.0

def calculate_texture_variance(img_array: np.ndarray) -> float:
    """Calculate texture variance to detect debris and clutter"""
    try:
        # Convert to grayscale
        if len(img_array.shape) == 3:
            gray = np.mean(img_array, axis=2)
        else:
            gray = img_array
        
        # Calculate variance using Sobel operator
        from scipy import ndimage
        
        # Apply Sobel filters
        sx = ndimage.sobel(gray, axis=0, mode='constant')
        sy = ndimage.sobel(gray, axis=1, mode='constant')
        sobel = np.hypot(sx, sy)
        
        # Calculate variance
        variance = np.var(sobel)
        return variance
        
    except Exception as e:
        print(f"Texture analysis error: {str(e)}")
        return 0.0

# ============ WEBSOCKET MANAGER ============
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            # WebSocket not in the list, ignore
            pass

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        connections_to_remove = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Connection might be closed, mark for removal
                connections_to_remove.append(connection)
        
        # Remove closed connections
        for connection in connections_to_remove:
            try:
                self.active_connections.remove(connection)
            except ValueError:
                # Already removed, ignore
                pass

manager = ConnectionManager()

# ============ FASTAPI APP ============
app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ WEBSOCKET ENDPOINT ============
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print(f" New WebSocket connection attempt")
    try:
        await manager.connect(websocket)
        print(f" WebSocket connection established")
        try:
            while True:
                data = await websocket.receive_text()
                print(f" WebSocket received: {data}")
                # Echo back or handle incoming messages if needed
                await manager.send_personal_message(f"Received: {data}", websocket)
        except WebSocketDisconnect:
            print(f" WebSocket disconnected normally")
            manager.disconnect(websocket)
        except Exception as e:
            print(f" WebSocket error: {str(e)}")
            manager.disconnect(websocket)
    except Exception as e:
        print(f" WebSocket connection failed: {str(e)}")

# ============ HEALTH CHECK ============
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Sanitex Backend Running"}

# ============ AUTHENTICATION ENDPOINTS ============
@app.post("/api/auth/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate email
        if not re.match(r"[^@]+@[^@]+\.[^@]+", user_data.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Validate password
        if len(user_data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Create new user
        new_user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            password=user_data.password,  # In production, hash this
            name=user_data.name,
            role="user"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✓ New user registered: {user_data.email}")
        
        # Create token
        access_token = create_access_token(
            data={"sub": new_user.email, "role": new_user.role, "user_id": new_user.id}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "name": new_user.name,
                "role": new_user.role
            }
        }
    except Exception as e:
        print(f"✗ Registration error: {str(e)}")
        raise

@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    try:
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user or user.password != form_data.password:
            print(f"✗ Login failed: Invalid credentials for {form_data.username}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role, "user_id": user.id},
            expires_delta=access_token_expires
        )
        
        print(f"✓ User {user.email} logged in (role: {user.role})")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role
            }
        }
    except Exception as e:
        print(f"✗ Login error: {str(e)}")
        raise

@app.get("/api/auth/me")
async def get_user_info(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user information"""
    try:
        user = db.query(User).filter(User.email == current_user.get("sub")).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    except Exception as e:
        print(f"✗ Get user error: {str(e)}")
        raise

# ============ REPORT ENDPOINTS ============
@app.post("/api/reports/submit")
async def submit_report(
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    original_text: Optional[str] = Form(None),
    detected_language: Optional[str] = Form(None),
    input_method: Optional[str] = Form("text"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a new sanitation report"""
    try:
        user_id = current_user.get("user_id") if current_user else "test_user"
        
        print(f"[REPORT] New report from {user_id}: location={location}, desc={description[:50] if description else 'N/A'}")
        
        if not description and not image and not audio:
            raise HTTPException(status_code=400, detail="At least one input (description, image, or audio) is required")
        
        # Use enhanced AI analysis to determine severity
        image_analysis_result = None
        if image:
            image_analysis_result = analyze_image_content(image)
        
        analysis_result = analyze_severity(description or "[Image/Audio Report]", bool(image), image_analysis_result)
        
        severity = analysis_result["severity"]
        analysis = analysis_result["analysis"]
        required_action = analysis_result["required_action"]
        estimated_time = analysis_result["estimated_resolution_time"]
        detected_issues = analysis_result["detected_issues"]
        
        # Create report
        report_id = str(uuid.uuid4())
        timestamp = datetime.utcnow()
        
        db_report = Report(
            id=report_id,
            user_id=user_id,
            location=location or "Unknown Location",
            latitude=latitude,
            longitude=longitude,
            description=description or "[Image/Audio Report]",
            severity=severity,
            estimated_time=estimated_time,
            analysis=analysis,
            status="Pending",
            timestamp=timestamp,
            image_filename=image.filename if image else None,
            audio_filename=audio.filename if audio else None,
            assigned_workers=0,
            original_text=original_text,
            detected_language=detected_language,
            translated_text=description if input_method == "voice" else None,
            input_method=input_method
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        print(f"✓ Report created: {report_id} - Severity: {severity}")
        
        # Broadcast new report to all connected clients
        await manager.broadcast(f"NEW_REPORT:{db_report.id}")
        
        return {
            "success": True,
            "report": {
                "id": db_report.id,
                "user_id": db_report.user_id,
                "location": db_report.location,
                "latitude": db_report.latitude,
                "longitude": db_report.longitude,
                "description": db_report.description,
                "severity": db_report.severity,
                "estimated_time": db_report.estimated_time,
                "analysis": db_report.analysis,
                "required_action": required_action,
                "status": db_report.status,
                "timestamp": db_report.timestamp.isoformat(),
                "image_filename": db_report.image_filename,
                "audio_filename": db_report.audio_filename
            }
        }
    except Exception as e:
        print(f"✗ Report submission error: {str(e)}")
        raise

@app.post("/api/ai/analyze-severity")
async def analyze_severity_endpoint(
    description: str = Form(...),
    has_image: bool = Form(False),
    image: Optional[UploadFile] = File(None)
):
    """AI-based severity analysis endpoint for testing and direct analysis"""
    try:
        # Use AI analysis to determine severity
        analysis_result = analyze_severity(description, has_image, image)
        
        return {
            "success": True,
            "analysis": analysis_result,
            "message": "AI severity analysis completed successfully"
        }
    except Exception as e:
        print(f"✗ Severity analysis error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze severity"
        }

@app.get("/api/reports/my-reports")
async def get_user_reports(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all reports submitted by current user"""
    try:
        user_id = current_user.get("user_id")
        reports = db.query(Report).filter(Report.user_id == user_id).order_by(Report.timestamp.desc()).all()
        
        print(f"[REPORTS] User {user_id} fetched {len(reports)} reports")
        
        return {
            "reports": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "location": r.location,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "description": r.description,
                    "severity": r.severity,
                    "estimated_time": r.estimated_time,
                    "analysis": r.analysis,
                    "status": r.status,
                    "timestamp": r.timestamp.isoformat(),
                    "image_filename": r.image_filename,
                    "audio_filename": r.audio_filename
                }
                for r in reports
            ]
        }
    except Exception as e:
        print(f"✗ Get user reports error: {str(e)}")
        raise

@app.get("/api/reports/all")
async def get_all_reports(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all reports (with optional filters)"""
    try:
        query = db.query(Report).order_by(Report.timestamp.desc())
        
        if status:
            query = query.filter(Report.status == status)
        if severity:
            query = query.filter(Report.severity == severity)
        if location:
            query = query.filter(Report.location.contains(location))
        
        reports = query.all()
        
        print(f"[REPORTS] Fetched {len(reports)} reports (filters: status={status}, severity={severity}, location={location})")
        
        return {
            "reports": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "location": r.location,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "description": r.description,
                    "severity": r.severity,
                    "estimated_time": r.estimated_time,
                    "analysis": r.analysis,
                    "status": r.status,
                    "timestamp": r.timestamp.isoformat(),
                    "image_filename": r.image_filename,
                    "audio_filename": r.audio_filename,
                    "assigned_workers": r.assigned_workers
                }
                for r in reports
            ]
        }
    except Exception as e:
        print(f"✗ Get all reports error: {str(e)}")
        raise

@app.get("/api/reports/{report_id}")
async def get_report_detail(
    report_id: str,
    db: Session = Depends(get_db)
):
    """Get single report details"""
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "id": report.id,
            "user_id": report.user_id,
            "location": report.location,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "description": report.description,
            "severity": report.severity,
            "estimated_time": report.estimated_time,
            "analysis": report.analysis,
            "status": report.status,
            "timestamp": report.timestamp.isoformat(),
            "image_filename": report.image_filename,
            "audio_filename": report.audio_filename,
            "assigned_workers": report.assigned_workers
        }
    except Exception as e:
        print(f"✗ Get report detail error: {str(e)}")
        raise

# ============ ADMIN ENDPOINTS ============
@app.put("/api/admin/reports/{report_id}/status")
async def update_report_status(
    report_id: str,
    status: str,
    current_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Update report status"""
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        valid_statuses = ["Pending", "In Progress", "Resolved"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
        old_status = report.status
        report.status = status
        db.commit()
        db.refresh(report)

        print(f"✓ Report {report_id} status updated: {old_status} → {status}")

        # Broadcast status update to all connected clients
        await manager.broadcast(f"STATUS_UPDATE:{report_id}:{status}")

        return {
            "success": True,
            "message": f"Report status updated from '{old_status}' to '{status}'",
            "report": {
                "id": report.id,
                "user_id": report.user_id,
                "location": report.location,
                "description": report.description,
                "severity": report.severity,
                "status": report.status,
                "timestamp": report.timestamp.isoformat()
            }
        }
    except Exception as e:
        print(f"✗ Update status error: {str(e)}")
        raise

@app.put("/api/admin/reports/{report_id}/assign")
async def assign_workers(
    report_id: str,
    workers: int,
    current_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Assign workers to report"""
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if workers < 0:
            raise HTTPException(status_code=400, detail="Workers count cannot be negative")
        
        report.assigned_workers = workers
        db.commit()
        db.refresh(report)
        
        print(f"✓ Report {report_id}: Assigned {workers} workers")
        
        return {
            "success": True,
            "message": f"Assigned {workers} workers to report",
            "report": {
                "id": report.id,
                "assigned_workers": report.assigned_workers
            }
        }
    except Exception as e:
        print(f"✗ Assign workers error: {str(e)}")
        raise

@app.get("/api/admin/analytics")
async def get_analytics(
    current_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Get analytics dashboard data"""
    try:
        reports = db.query(Report).all()
        
        total = len(reports)
        high_severity = len([r for r in reports if r.severity == "High"])
        medium_severity = len([r for r in reports if r.severity == "Medium"])
        low_severity = len([r for r in reports if r.severity == "Low"])
        
        pending = len([r for r in reports if r.status == "Pending"])
        in_progress = len([r for r in reports if r.status == "In Progress"])
        resolved = len([r for r in reports if r.status == "Resolved"])
        
        # Location-based analytics
        location_stats = {}
        for r in reports:
            location = r.location or "Unknown"
            if location not in location_stats:
                location_stats[location] = {"total": 0, "high": 0, "medium": 0, "low": 0, "resolved": 0}
            location_stats[location]["total"] += 1
            location_stats[location][r.severity.lower()] += 1
            if r.status == "Resolved":
                location_stats[location]["resolved"] += 1
        
        analytics = {
            "summary": {
                "total_reports": total,
                "high_severity": high_severity,
                "medium_severity": medium_severity,
                "low_severity": low_severity,
                "pending": pending,
                "in_progress": in_progress,
                "resolved": resolved
            },
            "by_location": location_stats,
            "resolution_rate": round((resolved / total * 100) if total > 0 else 0, 2)
        }
        
        print(f"✓ Analytics generated: {total} reports, {resolved} resolved")
        
        return analytics
    except Exception as e:
        print(f"✗ Analytics error: {str(e)}")
        raise

@app.get("/api/admin/reports")
async def admin_get_all_reports(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Get all reports with filters"""
    try:
        query = db.query(Report).order_by(Report.timestamp.desc())
        
        if status:
            query = query.filter(Report.status == status)
        if severity:
            query = query.filter(Report.severity == severity)
        
        reports = query.all()
        
        return {
            "reports": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "location": r.location,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "description": r.description,
                    "severity": r.severity,
                    "estimated_time": r.estimated_time,
                    "analysis": r.analysis,
                    "status": r.status,
                    "timestamp": r.timestamp.isoformat(),
                    "image_filename": r.image_filename,
                    "assigned_workers": r.assigned_workers
                }
                for r in reports
            ]
        }
    except Exception as e:
        print(f"✗ Admin get reports error: {str(e)}")
        raise

# ============ FEEDBACK ENDPOINTS ============
@app.post("/api/feedback/submit")
async def submit_feedback(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
):
    """Submit feedback (authenticated or anonymous)"""
    try:
        feedback_id = str(uuid.uuid4())
        current_user = None
        user_id = None
        
        # Check if user is authenticated
        if credentials:
            try:
                payload = verify_token(credentials.credentials)
                if payload:
                    current_user = payload
                    user_id = current_user.get("user_id")
            except:
                # Token is invalid, proceed as anonymous
                pass
        
        # If user is authenticated, use their info
        if current_user:
            name = current_user.get("name")
            email = current_user.get("email")
        else:
            # Use provided info for anonymous feedback
            name = feedback_data.name
            email = feedback_data.email
        
        # Validate feedback data
        if not feedback_data.subject.strip():
            raise HTTPException(status_code=400, detail="Subject is required")
        if not feedback_data.message.strip():
            raise HTTPException(status_code=400, detail="Message is required")
        if feedback_data.category not in ["Bug", "Feature", "Improvement", "General"]:
            raise HTTPException(status_code=400, detail="Invalid category")
        if feedback_data.priority not in ["Low", "Medium", "High"]:
            raise HTTPException(status_code=400, detail="Invalid priority")
        
        # Create feedback
        db_feedback = Feedback(
            id=feedback_id,
            user_id=user_id,
            name=name,
            email=email,
            category=feedback_data.category,
            subject=feedback_data.subject,
            message=feedback_data.message,
            priority=feedback_data.priority,
            status="Pending"
        )
        
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        
        print(f"✓ Feedback submitted: {feedback_id} - Category: {feedback_data.category}")
        
        # Broadcast feedback to admin if needed (for high priority)
        if feedback_data.priority == "High":
            await manager.broadcast(f"NEW_FEEDBACK:{feedback_id}")
        
        return {
            "success": True,
            "message": "Feedback submitted successfully. We'll review and respond soon.",
            "feedback": {
                "id": db_feedback.id,
                "category": db_feedback.category,
                "subject": db_feedback.subject,
                "status": db_feedback.status,
                "priority": db_feedback.priority,
                "created_at": db_feedback.created_at.isoformat()
            }
        }
    except Exception as e:
        print(f"✗ Feedback submission error: {str(e)}")
        raise

@app.get("/api/feedback/my-feedback")
async def get_user_feedback(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get feedback submitted by current user"""
    try:
        user_id = current_user.get("user_id")
        feedback = db.query(Feedback).filter(Feedback.user_id == user_id).order_by(Feedback.created_at.desc()).all()
        
        return {
            "feedback": [
                {
                    "id": f.id,
                    "category": f.category,
                    "subject": f.subject,
                    "message": f.message,
                    "status": f.status,
                    "priority": f.priority,
                    "admin_reply": f.admin_reply,
                    "admin_reply_timestamp": f.admin_reply_timestamp.isoformat() if f.admin_reply_timestamp else None,
                    "created_at": f.created_at.isoformat(),
                    "updated_at": f.updated_at.isoformat()
                }
                for f in feedback
            ]
        }
    except Exception as e:
        print(f"✗ Get user feedback error: {str(e)}")
        raise

@app.get("/api/admin/feedback")
async def admin_get_all_feedback(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Get all feedback with filters"""
    try:
        query = db.query(Feedback).order_by(Feedback.created_at.desc())
        
        if status:
            query = query.filter(Feedback.status == status)
        if category:
            query = query.filter(Feedback.category == category)
        if priority:
            query = query.filter(Feedback.priority == priority)
        
        feedback = query.all()
        
        return {
            "feedback": [
                {
                    "id": f.id,
                    "user_id": f.user_id,
                    "name": f.name,
                    "email": f.email,
                    "category": f.category,
                    "subject": f.subject,
                    "message": f.message,
                    "status": f.status,
                    "priority": f.priority,
                    "admin_reply": f.admin_reply,
                    "admin_reply_timestamp": f.admin_reply_timestamp.isoformat() if f.admin_reply_timestamp else None,
                    "created_at": f.created_at.isoformat(),
                    "updated_at": f.updated_at.isoformat()
                }
                for f in feedback
            ]
        }
    except Exception as e:
        print(f"✗ Admin get feedback error: {str(e)}")
        raise

@app.put("/api/admin/feedback/{feedback_id}/status")
async def update_feedback_status(
    feedback_id: str,
    status: str,
    current_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Update feedback status"""
    try:
        feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
        
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        valid_statuses = ["Pending", "In Review", "Resolved"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
        old_status = feedback.status
        feedback.status = status
        db.commit()
        db.refresh(feedback)
        
        print(f"✓ Feedback {feedback_id} status updated: {old_status} → {status}")
        
        return {
            "success": True,
            "message": f"Feedback status updated from '{old_status}' to '{status}'",
            "feedback": {
                "id": feedback.id,
                "status": feedback.status
            }
        }
    except Exception as e:
        print(f"✗ Update feedback status error: {str(e)}")
        raise

@app.put("/api/admin/feedback/{feedback_id}/reply")
async def reply_to_feedback(
    feedback_id: str,
    reply_data: FeedbackReply,
    current_user: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Reply to feedback"""
    try:
        feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
        
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        if not reply_data.reply.strip():
            raise HTTPException(status_code=400, detail="Reply message is required")
        
        feedback.admin_reply = reply_data.reply
        feedback.admin_reply_timestamp = datetime.utcnow()
        feedback.status = "Resolved"
        feedback.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(feedback)
        
        print(f"✓ Feedback {feedback_id} replied by admin")
        
        return {
            "success": True,
            "message": "Reply sent successfully",
            "feedback": {
                "id": feedback.id,
                "admin_reply": feedback.admin_reply,
                "admin_reply_timestamp": feedback.admin_reply_timestamp.isoformat(),
                "status": feedback.status
            }
        }
    except Exception as e:
        print(f"✗ Reply to feedback error: {str(e)}")
        raise

# ============ LEGACY ENDPOINTS (for compatibility) ============
@app.get("/reports")
async def get_reports_legacy(db: Session = Depends(get_db)):
    """Legacy endpoint - fetches all reports"""
    try:
        reports = db.query(Report).order_by(Report.timestamp.desc()).all()
        return {
            "reports": [
                {
                    "id": r.id,
                    "location": r.location,
                    "description": r.description,
                    "severity": r.severity,
                    "estimated_time": r.estimated_time,
                    "analysis": r.analysis,
                    "status": r.status,
                    "timestamp": r.timestamp.isoformat(),
                    "image_filename": r.image_filename,
                    "audio_filename": r.audio_filename
                }
                for r in reports
            ]
        }
    except Exception as e:
        print(f"✗ Legacy get reports error: {str(e)}")
        raise

@app.get("/analytics")
async def get_analytics_legacy(db: Session = Depends(get_db)):
    """Legacy endpoint - analytics"""
    try:
        reports = db.query(Report).all()
        total = len(reports)
        high_severity = len([r for r in reports if r.severity == "High"])
        medium_severity = len([r for r in reports if r.severity == "Medium"])
        low_severity = len([r for r in reports if r.severity == "Low"])
        resolved = len([r for r in reports if r.status == "Resolved"])
        
        return {
            "total_reports": total,
            "high_severity": high_severity,
            "medium_severity": medium_severity,
            "low_severity": low_severity,
            "resolved": resolved,
            "pending": total - resolved
        }
    except Exception as e:
        print(f"✗ Legacy analytics error: {str(e)}")
        raise

# ============ VOICE PROCESSING FUNCTIONS (TEMPORARILY DISABLED) ============
# def detect_language(text: str) -> str:
#     """Detect the language of the given text"""
#     try:
#         # Simple language detection based on character patterns
#         hindi_chars = set('ऀँःऄअआइईउऊऋऌएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह')
#         telugu_chars = set('ఀఁంఃఅఆఇఈఉఊఋఌఎఏఐఒఓఔకఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరఱలళవశషసహ')
#         
#         text_chars = set(text)
#         
#         if text_chars & hindi_chars:
#             return "Hindi"
#         elif text_chars & telugu_chars:
#             return "Telugu"
#         else:
#             return "English"
#     except Exception as e:
#         logger.error(f"Language detection error: {str(e)}")
#         return "English"

# def translate_to_english(text: str, source_language: str) -> str:
#     """Translate text to English"""
#     try:
#         if source_language == "English":
#             return text
#         
#         # Use Google Translate for translation
#         translation = translator.translate(text, src=source_language.lower(), dest='en')
#         return translation.text
#     except Exception as e:
#         logger.error(f"Translation error: {str(e)}")
#         # Fallback: return original text if translation fails
#         return text

# def process_voice_audio(audio_file: UploadFile) -> dict:
#     """Process voice audio file and return transcription and translation"""
#     try:
#         # Save audio file temporarily
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
#             temp_file.write(audio_file.file.read())
#             temp_file_path = temp_file.name
#         
#         # Initialize recognizer
#         recognizer = sr.Recognizer()
#         
#         # Process the audio file
#         with sr.AudioFile(temp_file_path) as source:
#             audio_data = recognizer.record(source)
#         
#         # Try to recognize speech with multiple engines
#         original_text = None
#         detected_language = "English"
#         
#         # Try Google Speech Recognition first (supports multiple languages)
#         try:
#             # Try English first
#             original_text = recognizer.recognize_google(audio_data, language='en-US')
#             detected_language = "English"
#         except sr.UnknownValueError:
#             try:
#                 # Try Hindi
#                 original_text = recognizer.recognize_google(audio_data, language='hi-IN')
#                 detected_language = "Hindi"
#             except sr.UnknownValueError:
#                 try:
#                     # Try Telugu
#                     original_text = recognizer.recognize_google(audio_data, language='te-IN')
#                     detected_language = "Telugu"
#                 except sr.UnknownValueError:
#                     # Try auto-detect
#                     original_text = recognizer.recognize_google(audio_data)
#                     detected_language = detect_language(original_text)
#                 except sr.UnknownValueError:
#                     raise HTTPException(status_code=400, detail="Could not understand the audio")
#         except sr.RequestError as e:
#             logger.error(f"Speech recognition service error: {str(e)}")
#             raise HTTPException(status_code=500, detail="Speech recognition service unavailable")
#         
#         # Translate to English if needed
#         translated_text = translate_to_english(original_text, detected_language)
#         
#         # Clean up temporary file
#         os.unlink(temp_file_path)
#         
#         return {
#             "original_text": original_text,
#             "detected_language": detected_language,
#             "translated_text": translated_text
#         }

# ============ TEST ENDPOINTS ============
@app.get("/api/test")
async def test_endpoint():
    """Simple test endpoint to verify backend is working"""
    return {"message": "Backend is working!", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/test/auth")
async def test_auth(current_user: dict = Depends(get_current_user)):
    """Test authentication endpoint"""
    return {"user": current_user, "message": "Authentication working!"}

@app.get("/api/test/admin")
async def test_admin(current_user: dict = Depends(get_current_admin)):
    """Test admin authentication endpoint"""
    return {"admin": current_user, "message": "Admin authentication working!"}

# ============ VOICE PROCESSING API (SIMPLIFIED MOCK) ============
@app.post("/api/voice/process")
async def process_voice(audio: UploadFile = File(...)):
    """Mock voice processing for testing"""
    try:
        print(f"Mock voice processing for: {audio.filename}")
        
        # Validate audio file
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")
        
        # Mock response for testing
        return {
            "success": True,
            "original_text": "This is a mock transcription of the audio file",
            "detected_language": "English",
            "translated_text": "This is a mock transcription of the audio file"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Voice processing API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during voice processing")

if __name__ == "__main__":
    import uvicorn
    import sys
    port = 8001
    if len(sys.argv) > 1 and sys.argv[1] == "--port":
        port = int(sys.argv[2])
    print(f"🚀 Starting Sanitex Backend on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)