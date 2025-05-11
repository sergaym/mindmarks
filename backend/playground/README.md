# Mindmarks LLM Playground

The Mindmarks Playground is an experimental space for working with LLMs to enhance the reading and learning experience. It contains prototype implementations of agents and tools that can be integrated into the main application.

## Current Features

- **Book Recommendation Agent**: An LLM-powered agent that provides personalized book recommendations based on user queries and reading history

## Usage

### Prerequisites

1. Python 3.10+
2. Required libraries (install via `pip install -r requirements.txt`)
3. An OpenAI API key

### Setting Up

1. Create a `.env` file in the backend directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

You can try the `example.py`:
2. Use `python example.py` inside the playground folder

Or the FastAPI server (not integrated here with our backend API):
2. Start the FastAPI server:
   ```
   cd backend
   python -m uvicorn app.main:app --reload
   ```

3. Access the Swagger docs at: http://localhost:8000/docs

### API Endpoints

- `POST /api/v1/playground/book-recommendations`: Get book recommendations
  - Request JSON:
    ```json
    {
      "query": "I want books about AI ethics",
      "user_content": {
        "books": [
          {"title": "Book Title", "author": "Author Name"}
        ],
        "interests": ["topic1", "topic2"],
        "notes": ["Some notes text"]
      },
      "num_recommendations": 3,
      "temperature": 0.7
    }
    ```

- `GET /api/v1/playground/health`: Check if playground API is working

### Example Script

For a quick demonstration, run the example script:

```bash
cd backend
python -m playground/example.py
```

## Development

- Agent implementations are located in `playground/llm_agents/`
- API routes are defined in `playground/api.py`
- Pydantic models are used for request/response validation

## Adding a New Agent

1. Create a new file in `playground/llm_agents/` for your agent implementation
2. Add appropriate API routes in `playground/api.py`
3. Update the main API router if needed

## Future Ideas

- Content categorization agent
- Note summarization capabilities
- Question answering against user's content
- Reading recommendation agent with spaced repetition integration
- Topic clustering across different content 