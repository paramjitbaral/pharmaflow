import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from pydantic import BaseModel, Field
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
import datetime
import uuid
from .database import SessionLocal  # type: ignore
from .models import Interaction, HCP, FollowUp  # type: ignore
from sqlalchemy import or_

load_dotenv()

llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY", os.getenv("GEMINI_API_KEY", "your-default-key")))

# Schema for structured output
class SuggestionOutput(BaseModel):
    hcpName: str = Field(description="Name of the Healthcare Professional")
    facility: str = Field(description="Name of the medical facility, hospital, or clinic if mentioned, else empty string", default="")
    date: str = Field(description="Date of interaction in YYYY-MM-DD format")
    products: list[str] = Field(description="List of products or therapeutic areas discussed")
    summary: str = Field(description="Clinical summary of the interaction")
    receptivity: str = Field(description="High, Medium, or Low")
    sentimentDetails: str = Field(description="Brief details about the sentiment")
    followUp: list[str] = Field(description="List of follow-up actions or next steps", default_factory=list)
    insights: str = Field(description="Key insights or concerns mentioned", default="")

def analyze_transcript(text: str) -> dict:
    current_date = datetime.date.today().isoformat()
    prompt = f"""
    Analyze the following clinical transcript and extract the structured data.
    If the date is today, use the current date ({current_date}). Ensure follow-up actions capture any mentioned timeframes like 'next monday' or 'next week'.
    Explicitly extract the medical facility, hospital, or clinic name if it is mentioned in the transcript.
    
    Transcript: {text}
    """
    try:
        structured_llm = llm.with_structured_output(SuggestionOutput)
        result = structured_llm.invoke(prompt)
        return result if isinstance(result, dict) else result.model_dump()
    except Exception as e:
        print("Error parsing transcript:", e)
        return {
            "error": "Failed to extract structured data",
            "details": str(e)
        }

class DateExtraction(BaseModel):
    date: str = Field(description="The extracted date in YYYY-MM-DD format, or 'None' if no date is mentioned")

def parse_action_date(text: str) -> str:
    current_date = datetime.date.today().isoformat()
    prompt = f"Given the action text: '{text}'. The current date is {current_date}. Extract the exact due date mentioned in YYYY-MM-DD format. If no date is mentioned, return 'None'."
    try:
        structured_llm = llm.with_structured_output(DateExtraction)
        res = structured_llm.invoke(prompt)
        # Type assertion for safety
        if isinstance(res, dict):
            date_val = res.get('date')
        else:
            date_val = getattr(res, 'date', None)
            
        if date_val and date_val != 'None':
            return date_val
    except Exception as e:
        print("Error parsing action date:", e)
        
    # Default to 7 days from now if we can't parse it
    return (datetime.date.today() + datetime.timedelta(days=7)).isoformat()



# Define LangGraph Tools
@tool
def log_interaction(hcpName: str, summary: str, products: str):
    """Logs a new interaction with an HCP into the CRM."""
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{hcpName}%")).first()
        if not hcp:
            # Create a new HCP if not found
            hcp = HCP(
                id=f"hcp-{str(uuid.uuid4())[:8]}",
                name=hcpName,
                title="Dr.",
                facility="Unknown",
                tier="Tier 3",
                lastActivity="Just Now",
                initials="".join([n[0] for n in hcpName.split() if n])[:2].upper() if hcpName else "DR",
                specialty="General Practice",
                location="Unknown",
                loyalty="Neutral",
                lastCallDays=0,
                engagement="New",
                rxPotential="Medium",
                sentiment="Neutral",
                sentimentDetails="New HCP added automatically.",
                recentTopics=[]
            )
            db.add(hcp)
            db.commit()
            db.refresh(hcp)
        
        refId = f"#IX-{str(uuid.uuid4())[:4].upper()}"
        timestamp = datetime.datetime.now().strftime("%d %b, %H:%M")
        prod_list = [p.strip() for p in products.split(",")] if products else []
        
        interaction = Interaction(
            refId=refId,
            hcpId=hcp.id,
            hcpName=hcp.name,
            specialty=hcp.specialty,
            facility=hcp.facility,
            timestamp=timestamp,
            products=prod_list,
            engagement="Logged via AI",
            narrative=summary,
            actions=[],
            complianceVerified=True
        )
        db.add(interaction)
        
        hcp.lastActivity = "Just Now"  # type: ignore
        hcp.lastCallDays = 0  # type: ignore
        db.commit()
        return f"Successfully logged interaction {refId} with {hcp.name}. Summary: {summary}."
    finally:
        db.close()

@tool
def edit_interaction(refId: str, updated_summary: str):
    """Edits an existing interaction by reference ID."""
    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.refId == refId).first()
        if not interaction:
            return f"Error: Interaction {refId} not found."
        
        interaction.narrative = updated_summary  # type: ignore
        db.commit()
        return f"Successfully updated interaction {refId}."
    finally:
        db.close()

@tool
def view_interaction_history(hcpName: str):
    """Views interaction history for a specific HCP."""
    db = SessionLocal()
    try:
        interactions = db.query(Interaction).filter(Interaction.hcpName.ilike(f"%{hcpName}%")).order_by(Interaction.timestamp.desc()).limit(5).all()
        if not interactions:
            return f"No interaction history found for {hcpName}."
        
        history = [f"- {i.timestamp} ({i.refId}): Discussed {', '.join(i.products or [])}. Summary: {i.narrative}" for i in interactions]  # type: ignore
        return "\n".join(history)
    finally:
        db.close()

@tool
def search_hcp(query: str):
    """Searches for an HCP by name or facility in the directory."""
    db = SessionLocal()
    try:
        hcps = db.query(HCP).filter(or_(HCP.name.ilike(f"%{query}%"), HCP.facility.ilike(f"%{query}%"))).all()
        if not hcps:
            return f"No HCPs found matching '{query}'."
        
        results = [f"{h.name} ({h.specialty}) at {h.facility}" for h in hcps]
        return "\n".join(results)
    finally:
        db.close()

@tool
def schedule_followup(hcpName: str, date: str, reason: str):
    """Schedules a follow-up for a given HCP."""
    db = SessionLocal()
    try:
        f_id = f"fu-{str(uuid.uuid4())[:8]}"
        followup = FollowUp(
            id=f_id,
            hcp=hcpName,
            reason=reason,
            due=date,
            priority="Medium",
            completed=False
        )
        db.add(followup)
        db.commit()
        return f"Scheduled follow-up with {hcpName} on {date} for {reason}."
    finally:
        db.close()

# Create LangGraph Agent
tools = [log_interaction, edit_interaction, view_interaction_history, search_hcp, schedule_followup]
agent_executor = create_react_agent(llm, tools)  # type: ignore

def chat_agent(message: str, history: list) -> str:
    messages: list = [SystemMessage(content="You are PharmaFlow AI, a helpful CRM assistant. Use your tools to manage interactions and data when asked.")]
    
    for msg in history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))
            
    messages.append(HumanMessage(content=message))
    
    try:
        response = agent_executor.invoke({"messages": messages})
        return response["messages"][-1].content
    except Exception as e:
        return f"I encountered an error: {e}"
