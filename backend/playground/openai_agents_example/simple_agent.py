"""
Simple example using the OpenAI Agents SDK.
This example creates a basic Book Recommendation Agent similar to the one in the main playground,
but implemented using the OpenAI Agents SDK.
"""

import os
import asyncio
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool
from typing import List, Optional

# Load environment variables (including OPENAI_API_KEY)
load_dotenv()

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
        limit = 3
        
    # In a real application, this would query a database or external API
    # Here we're simulating book search results
    mock_results = {
        "ai ethics": [
            {"title": "Human Compatible", "author": "Stuart Russell", "year": 2019},
            {"title": "Life 3.0", "author": "Max Tegmark", "year": 2017},
            {"title": "Atlas of AI", "author": "Kate Crawford", "year": 2021},
        ],
        "science fiction": [
            {"title": "Dune", "author": "Frank Herbert", "year": 1965},
            {"title": "Neuromancer", "author": "William Gibson", "year": 1984},
            {"title": "The Three-Body Problem", "author": "Liu Cixin", "year": 2008},
        ],
        "psychology": [
            {"title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "year": 2011},
            {"title": "Stumbling on Happiness", "author": "Daniel Gilbert", "year": 2006},
            {"title": "Flow", "author": "Mihaly Csikszentmihalyi", "year": 1990},
        ]
    }
    
    # Find the most relevant category (simplistic approach for demo)
    results = []
    for category, books in mock_results.items():
        if any(term in query.lower() for term in category.split()):
            results = books[:limit]
            break
    
    # Default results if no category matches
    if not results and mock_results:
        # Return the first category's books as default
        results = list(mock_results.values())[0][:limit]
    
    # Format the results
    formatted_results = "\n".join(
        f"- {book['title']} by {book['author']} ({book['year']})" 
        for book in results[:limit]
    )
    
    return f"Found {len(results)} books for '{query}':\n{formatted_results}"

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

async def main():
    # Check if OpenAI API key is set
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is not set.")
        print("Please set your OpenAI API key in a .env file or in your environment.")
        return
    
    # Create a book recommendation agent
    book_agent = Agent(
        name="Book Recommendation Agent",
        instructions="""
        You are a helpful book recommendation assistant. Your goal is to help users find books 
        they might enjoy based on their interests and reading history.
        
        When making recommendations:
        1. Consider the user's reading history if available
        2. Provide personalized explanations for each recommendation
        3. Include diverse recommendations when appropriate
        4. Be specific in your recommendations, including title, author, and brief description
        """,
        tools=[search_books, get_user_reading_history],
        model="gpt-4o"  # Using OpenAI's GPT-4o model
    )
    
    print("=" * 60)
    print("Welcome to the Book Recommendation Agent!")
    print("=" * 60)
    print("\nAsk for book recommendations or type 'exit' to quit.")
    
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in ("exit", "quit"):
            break
        
        print("\nProcessing your request...")
        
        # Run the agent
        result = await Runner.run(book_agent, user_input)
        
        # Display the result
        print(f"\nBook Agent: {result.final_output}")
    
    print("\nThank you for using the Book Recommendation Agent!")

if __name__ == "__main__":
    asyncio.run(main()) 