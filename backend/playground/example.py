"""
Example usage of the Mindmarks playground book recommendation agent
"""

import os
import json
from dotenv import load_dotenv

# Fix imports for proper module paths
from llm_agents.book_agent import BookRecommendationAgent
from llm_agents.openai_client import MindmarksOpenAIClient

# Load environment variables (including OPENAI_API_KEY)
load_dotenv()

def get_user_books():
    """Get books from user input"""
    books = []
    print("\nEnter your previously read books (leave title empty to finish):")
    while True:
        title = input("Book title (or press Enter to finish): ").strip()
        if not title:
            break
        author = input("Author: ").strip()
        books.append({"title": title, "author": author})
    return books

def get_user_interests():
    """Get interests from user input"""
    print("\nEnter your interests, separated by commas:")
    interests_input = input("> ")
    return [interest.strip() for interest in interests_input.split(",") if interest.strip()]

def get_int_input(prompt, default, min_value=1, max_value=10):
    """Get integer input with validation"""
    while True:
        try:
            user_input = input(prompt).strip()
            if not user_input:
                return default
            value = int(user_input)
            if min_value <= value <= max_value:
                return value
            print(f"Please enter a number between {min_value} and {max_value}.")
        except ValueError:
            print("Please enter a valid number.")

def choose_model():
    """Let user choose an OpenAI model"""
    models = {
        "1": "gpt-3.5-turbo",
        "2": "gpt-4",
        "3": "gpt-4-turbo"
    }
    
    print("\nSelect OpenAI model to use:")
    print("1. GPT-3.5 Turbo (faster, less expensive)")
    print("2. GPT-4 (more capable)")
    print("3. GPT-4 Turbo (faster GPT-4)")
    
    while True:
        choice = input("Enter choice (1-3, default: 1): ").strip()
        if not choice:
            return models["1"]
        if choice in models:
            return models[choice]
        print("Please enter a valid choice (1-3).")

def get_book_recommendations(openai_client, book_agent, user_content):
    """Get book recommendations based on user query"""
    # Get query from user input
    print("\nPlease enter your book recommendation query below:")
    query = input("> ")
    
    # Get number of recommendations
    num_recs = get_int_input("\nHow many book recommendations would you like? (1-5, default: 3): ", 3, 1, 5)
    
    print(f"\nFetching {num_recs} book recommendations based on your query...")
    # Get book recommendations
    response = book_agent.get_book_recommendations(
        query=query,
        user_content=user_content,
        num_recommendations=num_recs
    )
    
    # Print the results
    print("\n" + "=" * 60)
    print(f"Response message:\n{response.message}\n")
    
    print(f"Book Recommendations ({len(response.recommendations)}):")
    for i, rec in enumerate(response.recommendations, 1):
        print(f"Book {i}: {rec.title} by {rec.author} ({rec.year if rec.year else 'Year unknown'})")
        print(f"Description: {rec.description}")
        print(f"Reason: {rec.reason}")
        print(f"Genres: {', '.join(rec.genres)}")
        print()
    
    print(f"Insights ({len(response.insights)}):")
    for i, insight in enumerate(response.insights, 1):
        print(f"Insight {i}: {insight.title} ({insight.resource_type})")
        print(f"Content: {insight.insight}")
        print()
    
    print(f"Related Topics: {', '.join(response.related_topics)}")
    print("=" * 60)
    
    return True

def main():
    """
    Demo the book recommendation agent
    """
    # Display welcome message
    print("=" * 60)
    print("Welcome to the Mindmarks Book Recommendation Agent!")
    print("=" * 60)
    
    # Choose OpenAI model
    model = choose_model()
    print(f"\nUsing model: {model}")
    
    # Create the OpenAI client and book agent
    openai_client = MindmarksOpenAIClient(model=model)
    book_agent = BookRecommendationAgent(openai_client=openai_client)
    
    # Default user content for context
    default_user_content = {
        "books": [
            {"title": "Sapiens", "author": "Yuval Noah Harari"},
            {"title": "Thinking, Fast and Slow", "author": "Daniel Kahneman"},
            {"title": "The Innovators", "author": "Walter Isaacson"}
        ],
        "interests": ["technology", "psychology", "history", "philosophy"],
        "notes": [
            "I found Harari's discussion of cognitive revolution particularly interesting. How humans used storytelling to cooperate at scale.",
            "Kahneman's dual process theory helps explain why we make poor decisions under uncertainty."
        ]
    }
    
    # Ask if user wants to use default content or provide their own
    print("\nWould you like to use the default reading history and interests?")
    print("Default includes books like 'Sapiens', 'Thinking, Fast and Slow', etc.")
    use_default = input("Use default? (y/n): ").lower().strip() == 'y'
    
    if use_default:
        user_content = default_user_content
    else:
        books = get_user_books()
        interests = get_user_interests()
        
        user_content = {
            "books": books,
            "interests": interests,
            "notes": []  # Empty notes for user input version
        }
    
    # Loop to allow multiple queries with the same user content
    while True:
        get_book_recommendations(openai_client, book_agent, user_content)
        
        # Ask if user wants to try another query
        try_again = input("\nWould you like to try another query? (y/n): ").lower().strip() == 'y'
        if not try_again:
            break
    
    print("\nThank you for using the Mindmarks Book Recommendation Agent!")

if __name__ == "__main__":
    main() 