from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./leads.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class LeadModel(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    location = Column(String)
    industry = Column(String)
    job_role = Column(String)
    lead_source = Column(String)
    lead_quality = Column(String)
    company_size = Column(String)
    age = Column(Integer)
    website_visits = Column(Integer)
    email_opens = Column(Integer)
    time_spent_on_site = Column(Float)
    click_through_rate = Column(Float)
    past_purchases = Column(Integer)
    inquiry_responses = Column(Integer)
    message = Column(Text)
    sentiment_score = Column(Float)
    intent_detected = Column(Boolean)
    score = Column(Float)
    score_label = Column(String)
    sentiment_label = Column(String)
    intent_label = Column(String)
    followup = Column(Text)
