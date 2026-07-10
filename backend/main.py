from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from . import models, schemas
from .database import engine, get_db, SessionLocal
from .agent import chat_agent, analyze_transcript, parse_action_date
import uuid

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth Dependency ---
from fastapi import Header
import jwt

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# --- HCP Endpoints ---
@app.get("/api/hcps", response_model=List[schemas.HCPResponse])
def read_hcps(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    return db.query(models.HCP).filter(models.HCP.user_id == user_id).all()

@app.post("/api/hcps", response_model=schemas.HCPResponse)
def create_hcp(hcp: schemas.HCPCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    db_hcp = models.HCP(**hcp.model_dump(), user_id=user_id)
    db.add(db_hcp)
    db.commit()
    db.refresh(db_hcp)
    return db_hcp

# --- Interactions Endpoints ---
@app.get("/api/interactions", response_model=List[schemas.InteractionResponse])
def read_interactions(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    return db.query(models.Interaction).filter(models.Interaction.user_id == user_id).order_by(models.Interaction.timestamp.desc()).all()

@app.post("/api/interactions", response_model=schemas.InteractionResponse)
def create_interaction(interaction: schemas.InteractionCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    db_interaction = models.Interaction(**interaction.model_dump(exclude={'location'}), user_id=user_id)
    
    # Auto-create HCP if not found or 'unknown'
    hcp = db.query(models.HCP).filter(models.HCP.id == interaction.hcpId, models.HCP.user_id == user_id).first()
    if not hcp and interaction.hcpName:
        # Try finding by name first
        hcp = db.query(models.HCP).filter(models.HCP.name.ilike(f"%{interaction.hcpName}%"), models.HCP.user_id == user_id).first()
        
    if not hcp:
        # Create a new HCP dynamically
        new_id = f"hcp-{str(uuid.uuid4())[:8]}"
        hcp = models.HCP(
            id=new_id,
            user_id=user_id,
            name=interaction.hcpName or "Unknown Provider",
            title="MD",
            facility=interaction.facility or "Unknown Facility",
            tier="Tier 3",
            lastActivity="Just Now",
            initials=interaction.hcpName[:2].upper() if interaction.hcpName else "MD",
            specialty=interaction.specialty or "General",
            location=interaction.location or "Unknown",
            region=interaction.location or "Unspecified Region",
            loyalty="Medium",
            lastCallDays=0,
            engagement="Medium",
            rxPotential="Unknown",
            sentiment="Neutral",
            sentimentDetails="",
            recentTopics=[]
        )
        db.add(hcp)
        db.commit()
        db.refresh(hcp)
        
    # Update interaction with valid HCP ID and Name
    interaction.hcpId = str(hcp.id)
    db_interaction.hcpId = str(hcp.id)  # type: ignore
    db_interaction.hcpName = str(hcp.name)  # type: ignore
    
    # Now add the interaction since the HCP is created and committed
    db.add(db_interaction)
    
    hcp.lastActivity = "Just Now" # type: ignore
    hcp.lastCallDays = 0 # type: ignore
    
    # Update HCP location if the interaction provides a valid one
    if interaction.location and interaction.location != "Unknown":
        hcp.location = interaction.location # type: ignore
        hcp.region = interaction.location # type: ignore
        
    # Update HCP sentiment based on the interaction's engagement level
    if interaction.engagement:
        eng_upper = interaction.engagement.upper()
        if "HIGH" in eng_upper or "POSITIVE" in eng_upper:
            hcp.sentiment = "Positive" # type: ignore
            hcp.engagement = "High" # type: ignore
        elif "LOW" in eng_upper or "NEGATIVE" in eng_upper or "POOR" in eng_upper:
            hcp.sentiment = "Caution" # type: ignore
            hcp.engagement = "Low" # type: ignore
        elif "MEDIUM" in eng_upper:
            hcp.sentiment = "Neutral" # type: ignore
            hcp.engagement = "Medium" # type: ignore
        
    # Auto-calculate follow-up dates and create FollowUp entries
    if interaction.actions:
        for action in interaction.actions:
            due_date = parse_action_date(action)
            f_id = f"fu-{str(uuid.uuid4())[:8]}"
            db_followup = models.FollowUp(
                id=f_id,
                user_id=user_id,
                hcp=interaction.hcpName,
                reason=action,
                due=due_date,
                priority="Medium",
                completed=False
            )
            db.add(db_followup)

    db.add(hcp)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

# --- Schedule Endpoints ---
@app.get("/api/schedule", response_model=List[schemas.ScheduleItemResponse])
def read_schedule(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    return db.query(models.ScheduleItem).filter(models.ScheduleItem.user_id == user_id).all()

@app.post("/api/schedule", response_model=schemas.ScheduleItemResponse)
def create_schedule(item: schemas.ScheduleItemCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    db_item = models.ScheduleItem(**item.model_dump(), user_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# --- Follow Ups Endpoints ---
@app.get("/api/followups", response_model=List[schemas.FollowUpResponse])
def read_followups(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    return db.query(models.FollowUp).filter(models.FollowUp.user_id == user_id).all()

@app.post("/api/followups", response_model=schemas.FollowUpResponse)
def create_followup(item: schemas.FollowUpCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    db_item = models.FollowUp(**item.model_dump(), user_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# --- AI Endpoints ---
@app.post("/api/chat")
def chat_endpoint(req: schemas.ChatRequest):
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]
    response = chat_agent(req.message, history_dicts)
    return {"text": response}

@app.post("/api/suggest")
def suggest_endpoint(req: schemas.SuggestRequest):
    data = analyze_transcript(req.text)
    return data

# --- Auth Endpoints ---
import uuid
from .auth import get_password_hash, verify_password, create_access_token

@app.post("/api/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        id=str(uuid.uuid4()),
        email=user.email,
        hashed_password=hashed_password,
        name=user.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Note: Using UserCreate here for simplicity, typically you'd use OAuth2PasswordRequestForm
    # but we just expect JSON with email and password
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, str(db_user.hashed_password)):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user.id, "email": db_user.email, "name": db_user.name}}
