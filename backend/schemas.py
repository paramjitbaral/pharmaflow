from pydantic import BaseModel
from typing import List, Optional

class HCPBase(BaseModel):
    name: str
    title: str
    facility: str
    tier: str
    lastActivity: str
    initials: str
    specialty: str
    location: str
    loyalty: str
    lastCallDays: int
    engagement: str
    rxPotential: str
    sentiment: str
    sentimentDetails: str
    recentTopics: List[str]
    region: Optional[str] = None

class HCPCreate(HCPBase):
    id: str

class HCPResponse(HCPBase):
    id: str
    class Config:
        from_attributes = True

class InteractionBase(BaseModel):
    hcpId: str
    hcpName: str
    specialty: str
    facility: str
    location: Optional[str] = None
    timestamp: str
    products: List[str]
    engagement: str
    narrative: str
    actions: List[str]
    complianceVerified: bool

class InteractionCreate(InteractionBase):
    refId: str

class InteractionResponse(InteractionBase):
    refId: str
    class Config:
        from_attributes = True

class ScheduleItemBase(BaseModel):
    time: str
    title: str
    hcpName: str
    type: str

class ScheduleItemCreate(ScheduleItemBase):
    id: str

class ScheduleItemResponse(ScheduleItemBase):
    id: str
    class Config:
        from_attributes = True

class FollowUpBase(BaseModel):
    hcp: str
    reason: str
    due: str
    priority: str
    completed: bool = False

class FollowUpCreate(FollowUpBase):
    id: str

class FollowUpResponse(FollowUpBase):
    id: str
    class Config:
        from_attributes = True

# Chat Request Schemas
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]

class SuggestRequest(BaseModel):
    text: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserResponse] = None
