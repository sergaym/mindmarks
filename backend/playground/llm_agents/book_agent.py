"""
Book Recommendation Agent for Mindmarks
This module provides a specialized LLM agent for book recommendations and content insights
"""

import logging
from typing import List, Dict, Any, Optional
import json
from pydantic import BaseModel, Field

from .openai_client import (
    MindmarksOpenAIClient, 
    Message, 
    SystemMessage, 
    UserMessage, 
    AssistantMessage
)

logger = logging.getLogger(__name__)

class BookRecommendation(BaseModel):
    """Book recommendation data model"""
    title: str
    author: str
    description: str
    reason: str
    genres: List[str] = Field(default_factory=list)
    year: Optional[int] = None

class ContentInsight(BaseModel):
    """Insight about content the user might be interested in"""
    title: str
    insight: str
    resource_type: str = Field(description="Type of content (book, article, podcast, etc.)")
    
class BookAgentResponse(BaseModel):
    """Response from the book agent"""
    message: str
    recommendations: List[BookRecommendation] = Field(default_factory=list)
    insights: List[ContentInsight] = Field(default_factory=list)
    related_topics: List[str] = Field(default_factory=list)

class BookRecommendationAgent:
    """
    Agent that specializes in book recommendations and content insights
    """
    
    def __init__(self, openai_client: Optional[MindmarksOpenAIClient] = None):
        """
        Initialize the book recommendation agent
        
        Args:
            openai_client: OpenAI client to use
        """
        self.openai_client = openai_client or MindmarksOpenAIClient()
        
        # Default system prompt for the book agent
        self.system_prompt = """
        You are Mindmarks Book Assistant, an AI specialized in book recommendations and content insights.
        Your goals are to:
        1. Recommend books that match the user's interests and preferences
        2. Provide insightful connections between books and other content
        3. Help users discover new topics and ideas related to their interests
        
        When making recommendations:
        - Be precise and thoughtful about your recommendations
        - Explain why each book would be valuable to the user
        - Consider a diverse range of perspectives and authors
        - Prioritize books that have stood the test of time or are particularly insightful
        
        Structure your response consistently:
        - Conversational response to the user's query
        - Structured data in JSON format within designated markers
        """
    
    def _build_query_with_user_content(self, query: str, user_content: Optional[Dict[str, Any]] = None) -> str:
        """
        Build a query that incorporates the user's content
        
        Args:
            query: The user's query
            user_content: Optional user content to include in context
            
        Returns:
            Enhanced query with user content context
        """
        if not user_content:
            return query
        
        # Build a context string from the user's content
        context_parts = []
        
        if "books" in user_content and user_content["books"]:
            books_str = ", ".join([f"'{b['title']}' by {b['author']}" for b in user_content["books"][:5]])
            context_parts.append(f"Books I've read: {books_str}")
        
        if "notes" in user_content and user_content["notes"]:
            notes_summary = "\n".join([f"- {note[:100]}..." for note in user_content["notes"][:3]])
            context_parts.append(f"Some of my reading notes:\n{notes_summary}")
            
        if "interests" in user_content and user_content["interests"]:
            interests_str = ", ".join(user_content["interests"][:5])
            context_parts.append(f"My interests: {interests_str}")
        
        # Combine the context with the query
        if context_parts:
            context_str = "\n\n".join(context_parts)
            return f"{query}\n\nFor context, here's some information about me and my reading:\n{context_str}"
        
        return query
    
    def get_book_recommendations(
        self, 
        query: str, 
        user_content: Optional[Dict[str, Any]] = None,
        num_recommendations: int = 3,
        temperature: float = 0.7
    ) -> BookAgentResponse:
        """
        Get book recommendations based on a user query
        
        Args:
            query: The user's query
            user_content: Optional information about the user's content/preferences
            num_recommendations: Number of recommendations to request
            temperature: Temperature for LLM generation
            
        Returns:
            BookAgentResponse containing recommendations and insights
        """
        enhanced_prompt = self._build_query_with_user_content(query, user_content)
        
        # Add instructions for structured output
        function_prompt = f"""
        For your recommendations, generate a JSON object with this structure:
        {{
            "recommendations": [
                {{
                    "title": "Book Title",
                    "author": "Author Name",
                    "description": "Brief description of the book",
                    "reason": "Why this book is relevant to the query",
                    "genres": ["Genre1", "Genre2"],
                    "year": 2020 (or null if unknown)
                }}
                // Include {num_recommendations} recommendations
            ],
            "insights": [
                {{
                    "title": "Insight Title",
                    "insight": "Brief insight about content that might interest the user",
                    "resource_type": "Type of resource (book, article, podcast, etc.)"
                }}
            ],
            "related_topics": ["Topic 1", "Topic 2", "Topic 3"]
        }}
        
        First respond conversationally to the user's query, then add your structured JSON response between triple backticks and JSON labels like this:
        ```json
        {{your structured response here}}
        ```
        """
        
        # Create messages for the chat
        messages = [
            SystemMessage(content=self.system_prompt + function_prompt),
            UserMessage(content=enhanced_prompt)
        ]
        
        # Get response from OpenAI
        response = self.openai_client.create_chat_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=2000
        )
        
        # Extract the response content
        response_content = response.choices[0].message.content
        
        # Parse the JSON data from the response
        try:
            # Find JSON content between ```json and ``` markers
            import re
            json_match = re.search(r'```json\n(.*?)\n```', response_content, re.DOTALL)
            
            if json_match:
                json_str = json_match.group(1)
                data = json.loads(json_str)
                
                # Message is everything before the JSON
                message_text = response_content.split('```json')[0].strip()
                
                # Create the response object
                return BookAgentResponse(
                    message=message_text,
                    recommendations=[BookRecommendation(**rec) for rec in data.get("recommendations", [])],
                    insights=[ContentInsight(**insight) for insight in data.get("insights", [])],
                    related_topics=data.get("related_topics", [])
                )
            else:
                # If no JSON found, return just the message
                return BookAgentResponse(message=response_content)
                
        except Exception as e:
            logger.error(f"Error parsing response: {e}")
            return BookAgentResponse(
                message=response_content,
                recommendations=[],
                insights=[],
                related_topics=[]
            ) 