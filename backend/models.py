from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class HCP(Base):
    __tablename__ = "hcps"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    name = Column(String, index=True)
    title = Column(String)
    facility = Column(String)
    tier = Column(String)
    lastActivity = Column(String)
    initials = Column(String)
    specialty = Column(String)
    location = Column(String)
    loyalty = Column(String)
    lastCallDays = Column(Integer)
    engagement = Column(String)
    rxPotential = Column(String)
    sentiment = Column(String)
    sentimentDetails = Column(Text)
    recentTopics = Column(JSON)  # List of strings
    region = Column(String, nullable=True)

class Interaction(Base):
    __tablename__ = "interactions"
    refId = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    hcpId = Column(String, ForeignKey("hcps.id"))
    hcpName = Column(String)
    specialty = Column(String)
    facility = Column(String)
    timestamp = Column(String)
    products = Column(JSON)  # List of strings
    engagement = Column(String)
    narrative = Column(Text)
    actions = Column(JSON)  # List of strings
    complianceVerified = Column(Boolean, default=False)

class ScheduleItem(Base):
    __tablename__ = "schedule_items"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    time = Column(String)
    title = Column(String)
    hcpName = Column(String)
    type = Column(String)

class FollowUp(Base):
    __tablename__ = "follow_ups"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    hcp = Column(String)
    reason = Column(String)
    due = Column(String)
    priority = Column(String)
    completed = Column(Boolean, default=False)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
