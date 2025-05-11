# OpenAI Agents SDK Examples

This directory contains examples of using the OpenAI Agents SDK to build intelligent agents for book recommendations and reading assistance.

## Setup

1. Make sure you have Python 3.10+ installed
2. Install the required dependencies:
   ```bash
   pip install openai-agents python-dotenv
   ```
3. Create a `.env` file in the `backend` directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Examples

### 1. Simple Agent (`simple_agent.py`)

A basic example showing how to create an agent with tools. This agent can:
- Search for books based on queries
- Access user reading history
- Provide book recommendations in natural language

Run with:
```bash
python simple_agent.py
```

### 2. Structured Agent (`structured_agent.py`)

A more advanced example using Pydantic models for structured output. This agent:
- Returns structured data with book recommendations
- Includes detailed metadata for each recommendation
- Demonstrates how to use `output_type` for structured responses

Run with:
```bash
python structured_agent.py
```

### 3. Handoff Agent (`handoff_agent.py`)

Demonstrates agent handoffs between a main triage agent and specialized agents. This example:
- Creates a main triage agent that directs queries to specialized agents
- Implements specialized agents for book recommendations, reading techniques, and note-taking
- Shows how agents can collaborate to provide comprehensive assistance

Run with:
```bash
python handoff_agent.py
```

## Key Concepts

- **Agent**: An LLM equipped with instructions and tools
- **Tools**: Functions that agents can call to perform actions
- **Handoffs**: Allow agents to delegate tasks to other specialized agents
- **Structured Output**: Using Pydantic models to define structured responses

## Usage Tips

1. Try different queries with each agent to see how they respond
2. Observe how the handoff agent delegates to specialized agents based on the query
3. Notice the difference between free-text responses and structured outputs

## Further Reading

- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-python/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference) 