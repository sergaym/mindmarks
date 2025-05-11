"""
Advanced example using the OpenAI Agents SDK with structured outputs.
This example creates a Book Recommendation Agent that returns structured data
using Pydantic models.
"""

import os
import asyncio
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool
from typing import List, Optional
from pydantic import BaseModel, Field

# Load environment variables (including OPENAI_API_KEY)
load_dotenv()

class BookRecommendation(BaseModel):
    """A book recommendation with metadata"""
    title: str = Field(..., description="The title of the book")
    author: str = Field(..., description="The author of the book")
    year: Optional[int] = Field(None, description="The publication year of the book")
    description: str = Field(..., description="A brief description of the book")
    reason: str = Field(..., description="Why this book is recommended to the user")
    genres: List[str] = Field(..., description="Genres associated with the book")

class BookRecommendationResponse(BaseModel):
    """Response model for book recommendations"""
    recommendations: List[BookRecommendation] = Field(..., description="List of book recommendations")
    message: str = Field(..., description="A personalized message explaining the recommendations")
    related_topics: List[str] = Field(..., description="Related topics that might interest the user")

@function_tool
def search_books(query: str, limit: Optional[int] = None) -> str:
    """
    Search for books based on a query.
    
    Args:
        query: The search query for finding books
        limit: Maximum number of books to return
        
    Returns:
        A string containing the search results
    """
    # Set default limit if None is provided
    if limit is None:
        limit = 5
        
    # In a real application, this would query a database or external API
    # Here we're simulating book search results
    mock_results = {
        "ai ethics": [
            {"title": "Human Compatible", "author": "Stuart Russell", "year": 2019},
            {"title": "Life 3.0", "author": "Max Tegmark", "year": 2017},
            {"title": "Atlas of AI", "author": "Kate Crawford", "year": 2021},
            {"title": "Weapons of Math Destruction", "author": "Cathy O'Neil", "year": 2016},
            {"title": "The Alignment Problem", "author": "Brian Christian", "year": 2020},
        ],
        "science fiction": [
            {"title": "Dune", "author": "Frank Herbert", "year": 1965},
            {"title": "Neuromancer", "author": "William Gibson", "year": 1984},
            {"title": "The Three-Body Problem", "author": "Liu Cixin", "year": 2008},
            {"title": "Snow Crash", "author": "Neal Stephenson", "year": 1992},
            {"title": "Hyperion", "author": "Dan Simmons", "year": 1989},
        ],
        "psychology": [
            {"title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "year": 2011},
            {"title": "Stumbling on Happiness", "author": "Daniel Gilbert", "year": 2006},
            {"title": "Flow", "author": "Mihaly Csikszentmihalyi", "year": 1990},
            {"title": "Predictably Irrational", "author": "Dan Ariely", "year": 2008},
            {"title": "Influence", "author": "Robert Cialdini", "year": 1984},
        ]
    }
    
    # Find the most relevant category (simplistic approach for demo)
    results = []
    matched_category = None
    for category, books in mock_results.items():
        if any(term in query.lower() for term in category.split()):
            results = books[:limit]
            matched_category = category
            break
    
    # Default results if no category matches
    if not results and mock_results:
        # Return the first category's books as default
        matched_category = list(mock_results.keys())[0]
        results = list(mock_results.values())[0][:limit]
    
    # Format the results
    formatted_results = "\n".join(
        f"- {book['title']} by {book['author']} ({book['year']})" 
        for book in results[:limit]
    )
    
    return f"Found {len(results)} books in category '{matched_category}':\n{formatted_results}"

@function_tool
def get_user_reading_history() -> str:
    """
    Get the user's reading history.
    
    Returns:
        A string containing the user's reading history
    """
    # This would typically fetch from a database in a real application
    mock_history = [
        {"title": "Sapiens", "author": "Yuval Noah Harari", "completed": True},
        {"title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "completed": True},
        {"title": "The Innovators", "author": "Walter Isaacson", "completed": False}
    ]
    
    formatted_history = "\n".join(
        f"- {book['title']} by {book['author']} ({'Completed' if book['completed'] else 'In Progress'})"
        for book in mock_history
    )
    
    return f"User's reading history:\n{formatted_history}"

@function_tool
def get_user_interests() -> str:
    """
    Get the user's interests.
    
    Returns:
        A string containing the user's interests
    """
    # This would typically fetch from a database in a real application
    mock_interests = ["technology", "psychology", "history", "philosophy"]
    
    return f"User's interests: {', '.join(mock_interests)}"

async def main():
    # Check if OpenAI API key is set
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is not set.")
        print("Please set your OpenAI API key in a .env file or in your environment.")
        return
    
    # Create a book recommendation agent with structured output
    book_agent = Agent(
        name="Book Recommendation Agent",
        instructions="""
        You are a helpful book recommendation assistant. Your goal is to help users find books 
        they might enjoy based on their interests and reading history.
        
        When making recommendations:
        1. Consider the user's reading history if available
        2. Provide personalized explanations for each recommendation
        3. Include diverse recommendations when appropriate
        4. For each book, include:
           - Title and author
           - Publication year if known
           - A brief description
           - Why it's relevant to the user
           - Appropriate genres
        """,
        tools=[search_books, get_user_reading_history, get_user_interests],
        model="gpt-4o",  # Using OpenAI's GPT-4o model
        output_type=BookRecommendationResponse  # Specifying structured output
    )
    
    print("=" * 60)
    print("Welcome to the Book Recommendation Agent (Structured Output)!")
    print("=" * 60)
    print("\nAsk for book recommendations or type 'exit' to quit.")
    
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in ("exit", "quit"):
            break
        
        print("\nProcessing your request...")
        
        # Run the agent
        result = await Runner.run(book_agent, user_input)
        
        # Display the structured result
        response = result.final_output
        print("\n" + "=" * 60)
        print(f"Message: {response.message}\n")
        
        print(f"Book Recommendations ({len(response.recommendations)}):")
        for i, rec in enumerate(response.recommendations, 1):
            print(f"Book {i}: {rec.title} by {rec.author} ({rec.year if rec.year else 'Year unknown'})")
            print(f"Description: {rec.description}")
            print(f"Reason: {rec.reason}")
            print(f"Genres: {', '.join(rec.genres)}")
            print()
        
        print(f"Related Topics: {', '.join(response.related_topics)}")
        print("=" * 60)
    
    print("\nThank you for using the Book Recommendation Agent!")

if __name__ == "__main__":
    asyncio.run(main()) 