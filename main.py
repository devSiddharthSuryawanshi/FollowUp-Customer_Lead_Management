from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd
import joblib
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware  
from fastapi.responses import HTMLResponse


from NLP.nlp_utils import extract_nlp_features_from_message
from email_generation_using_genAI.followup_gen import load_text_generator, generate_followup_message
from database import SessionLocal, LeadModel, Base, engine

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
templates = Jinja2Templates(directory="templates")

# Load models
generator = load_text_generator()
model = joblib.load("Models/lead_scoring_model.pkl")
preprocessor = joblib.load("Models/preprocessor.pkl")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Lead(BaseModel):
    name: str
    location: str
    industry: str
    job_role: str
    lead_source: str
    lead_quality: str
    company_size: str
    age: int
    website_visits: int
    email_opens: int
    time_spent_on_site: float
    click_through_rate: float
    past_purchases: int
    inquiry_responses: int
    message: str

# Homepage
@app.get("/", response_class=HTMLResponse)
def show_dashboard(request: Request, db: Session = Depends(get_db)):
    leads = db.query(LeadModel).all()
    return templates.TemplateResponse("index.html", {"request": request, "leads": leads})

# Add Lead
@app.post("/add_lead")
def add_lead(lead: Lead, db: Session = Depends(get_db)):
    data = lead.dict()
    sentiment_score, intent_detected = extract_nlp_features_from_message(data["message"])

    features = data.copy()
    features["sentiment_score"] = sentiment_score
    features["intent_detected"] = intent_detected

    df = pd.DataFrame([features])
    df.drop(columns=["message"], inplace=True)
    X = preprocessor.transform(df)
    score = float(model.predict(X)[0])

    lead_entry = LeadModel(
        **data,
        sentiment_score=sentiment_score,
        intent_detected=bool(intent_detected),
        score=score,
        score_label="🔥 Hot" if score > 70 else "🌤️ Warm" if score > 40 else "❄️ Cold",
        sentiment_label="POSITIVE" if sentiment_score > 0 else "NEGATIVE",
        intent_label="✅ Yes" if intent_detected else "❌ No",
        followup=generate_followup_message(data, score, sentiment_score, intent_detected, generator)
    )

    db.add(lead_entry)
    db.commit()
    db.refresh(lead_entry)
    return {"message": "Lead added", "lead_score": lead_entry.score}


@app.get("/leads")
def get_leads(db: Session = Depends(get_db)):
    leads = db.query(LeadModel).order_by(LeadModel.id.desc()).all()
    return [
        {
            "id": lead.id, 
            "name": lead.name,
            "location": lead.location,
            "industry": lead.industry,
            "job_role": lead.job_role,
            "lead_source": lead.lead_source,
            "lead_quality": lead.lead_quality,
            "company_size": lead.company_size,
            "age": lead.age,
            "website_visits": lead.website_visits,
            "email_opens": lead.email_opens,
            "time_spent_on_site": lead.time_spent_on_site,
            "click_through_rate": lead.click_through_rate,
            "past_purchases": lead.past_purchases,
            "inquiry_responses": lead.inquiry_responses,
            "message": lead.message,
            "score": lead.score,
            "score_label": lead.score_label,
            "sentiment_score": lead.sentiment_score,
            "sentiment_label": lead.sentiment_label,
            "intent_detected": lead.intent_detected,
            "intent_label": lead.intent_label,
            "followup": lead.followup,
            "created_at": lead.created_at.isoformat() if hasattr(lead, 'created_at') else None
        }
        for lead in leads
    ]
