"""
Handoff example using the OpenAI Agents SDK.
This example creates a main triage agent that can delegate to specialized reading agents
based on the user's query.
"""

import os
import asyncio
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool
from typing import Optional

# Load environment variables (including OPENAI_API_KEY)
load_dotenv()

# Helper tools for the agents
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
        
    # Simplified mock book search
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
        ]
    }
    
    # Simple category matching
    results = []
    for category, books in mock_results.items():
        if any(term in query.lower() for term in category.split()):
            results = books[:limit]
            break
    
    # Default if no match
    if not results and mock_results:
        results = list(mock_results.values())[0][:limit]
    
    formatted_results = "\n".join(
        f"- {book['title']} by {book['author']} ({book['year']})" 
        for book in results[:limit]
    )
    
    return f"Found {len(results)} books for '{query}':\n{formatted_results}"

@function_tool
def get_reading_tips() -> str:
    """
    Get tips for effective reading.
    
    Returns:
        A string with reading tips
    """
    tips = [
        "Take notes while reading to improve retention",
        "Set aside dedicated time for reading each day",
        "Try the Pomodoro technique: 25 minutes of focused reading, then a 5-minute break",
        "Consider using a reading journal to track insights",
        "Use highlighting sparingly - focus on key insights"
    ]
    return "\n".join([f"- {tip}" for tip in tips])

@function_tool
def get_note_taking_methods() -> str:
    """
    Get information about effective note-taking methods.
    
    Returns:
        A string with note-taking methods
    """
    methods = {
        "Cornell Method": "Divide your page into sections for notes, cues, and summary",
        "Mind Mapping": "Create visual diagrams connecting related ideas",
        "Outline Method": "Organize information hierarchically with headings and subheadings",
        "Feynman Technique": "Explain concepts in simple terms as if teaching someone else",
        "Progressive Summarization": "Highlight important points, then highlight within highlights"
    }
    result = []
    for name, description in methods.items():
        result.append(f"- {name}: {description}")
    return "\n".join(result)

@function_tool
def get_book_summaries() -> str:
    """
    Get summaries of popular books.
    
    Returns:
        A string with book summaries
    """
    summaries = {
        "Thinking, Fast and Slow": "Explores the two systems of thinking: System 1 (fast, intuitive) and System 2 (slow, deliberate), and how cognitive biases affect decision-making.",
        "Sapiens": "Chronicles the history of humankind from ancient humans to the present, exploring how Homo sapiens came to dominate the world through cognitive, agricultural, and scientific revolutions.",
        "Atomic Habits": "Provides practical strategies for forming good habits and breaking bad ones, focusing on small changes that compound over time."
    }
    result = []
    for title, summary in summaries.items():
        result.append(f"- {title}: {summary}")
    return "\n".join(result)

async def main():
    # Check if OpenAI API key is set
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is not set.")
        print("Please set your OpenAI API key in a .env file or in your environment.")
        return
    
    # Create specialized agents
    
    # Book recommendation agent
    book_recommendation_agent = Agent(
        name="Book Recommendation Agent",
        instructions="""
        You are a helpful book recommendation assistant. Your goal is to help users find books 
        they might enjoy based on their interests and reading habits.
        
        Provide thoughtful, personalized book recommendations with brief explanations of why
        each book might be relevant to the user.
        """,
        tools=[search_books, get_book_summaries],
        model="gpt-3.5-turbo"  # Using a less expensive model for the specialized agent
    )
    
    # Reading technique agent
    reading_technique_agent = Agent(
        name="Reading Technique Agent",
        instructions="""
        You are an expert on reading techniques and strategies. Your goal is to help users 
        improve their reading efficiency, comprehension, and retention.
        
        Provide practical, actionable advice that users can implement immediately.
        """,
        tools=[get_reading_tips],
        model="gpt-3.5-turbo"
    )
    
    # Note-taking agent
    note_taking_agent = Agent(
        name="Note-Taking Agent",
        instructions="""
        You are an expert on note-taking methods and techniques. Your goal is to help users 
        capture, organize, and revisit information from their reading effectively.
        
        Provide specific methods tailored to the user's needs and reading goals.
        """,
        tools=[get_note_taking_methods],
        model="gpt-3.5-turbo"
    )
    
    # Main triage agent that can hand off to specialized agents
    triage_agent = Agent(
        name="Reading Assistant",
        instructions="""
        You are a helpful reading assistant that can help users with various aspects of reading.
        
        Based on the user's question:
        - If they're asking for book recommendations, hand off to the Book Recommendation Agent
        - If they're asking about reading techniques or strategies, hand off to the Reading Technique Agent
        - If they're asking about note-taking or information retention, hand off to the Note-Taking Agent
        - If you can handle the question directly, do so without handing off
        
        When handing off, briefly explain why you're connecting them with a specialist.
        """,
        handoffs=[book_recommendation_agent, reading_technique_agent, note_taking_agent],
        model="gpt-4o"  # Using a more powerful model for the triage agent
    )
    
    print("=" * 60)
    print("Welcome to the Reading Assistant with Agent Handoffs!")
    print("=" * 60)
    print("\nI can help you with book recommendations, reading techniques, and note-taking methods.")
    print("Ask me a question or type 'exit' to quit.")
    
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in ("exit", "quit"):
            break
        
        print("\nProcessing your request...")
        
        # Run the triage agent, which may hand off to specialized agents
        result = await Runner.run(triage_agent, user_input)
        
        # Display the result
        print(f"\nAssistant: {result.final_output}")
    
    print("\nThank you for using the Reading Assistant!")

if __name__ == "__main__":
    asyncio.run(main()) 