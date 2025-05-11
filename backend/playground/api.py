"""
API routes for the Mindmarks playground
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException

from pydantic import BaseModel, Field

from llm_agents.book_agent import (
    BookRecommendationAgent, 
    BookAgentResponse,
    BookRecommendation,
    ContentInsight
)

router = APIRouter(prefix="/playground", tags=["playground"])

class BookRecommendationRequest(BaseModel):
    """Request model for book recommendation endpoint"""
    query: str = Field(..., description="User query for book recommendations")
    user_content: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Optional user content context (books, notes, interests)"
    )
    num_recommendations: int = Field(default=3, description="Number of book recommendations to return")
    temperature: float = Field(default=0.7, description="Temperature for LLM generation (0-1)")

@router.post("/book-recommendations", response_model=BookAgentResponse)
async def get_book_recommendations(request: BookRecommendationRequest):
    """
    Get book recommendations using the Mindmarks book agent
    
    This endpoint uses an LLM to generate intelligent book recommendations
    based on the user's query and optional content context.
    """
    try:
        agent = BookRecommendationAgent()
        response = agent.get_book_recommendations(
            query=request.query,
            user_content=request.user_content,
            num_recommendations=request.num_recommendations,
            temperature=request.temperature
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting book recommendations: {str(e)}")

@router.get("/health")
async def playground_health():
    """Health check for the playground API"""
    return {"status": "healthy", "message": "Playground API is operational"} 