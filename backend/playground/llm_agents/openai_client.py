"""
OpenAI client for Mindmarks playground
This module provides a simple wrapper around the OpenAI API
"""

import os
import logging
import asyncio
from typing import List, Dict, Any, Optional, AsyncIterator, Iterator, Union
from pydantic import BaseModel, Field

import tiktoken
import openai
from openai import OpenAI, AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configure OpenAI client
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    logger.warning("OPENAI_API_KEY not found in environment variables")

# Message Types
class Message(BaseModel):
    """Base message class for chat interactions"""
    role: str
    content: str

class UserMessage(Message):
    """User message in a conversation"""
    role: str = "user"

class SystemMessage(Message):
    """System message in a conversation"""
    role: str = "system"

class AssistantMessage(Message):
    """Assistant message in a conversation"""
    role: str = "assistant"

# OpenAI Client
class MindmarksOpenAIClient:
    """
    A simple OpenAI client for the Mindmarks playground
    """
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-3.5-turbo"):
        """
        Initialize the OpenAI client
        
        Args:
            api_key: OpenAI API key (defaults to environment variable)
            model: OpenAI model to use
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.model = model
        self.client = OpenAI(api_key=self.api_key)
        self.async_client = AsyncOpenAI(api_key=self.api_key)
        
        # Initialize the tokenizer for the specified model
        # Use a try-except block to handle models not recognized by tiktoken
        try:
            self.tokenizer = tiktoken.encoding_for_model(model)
        except KeyError:
            logger.warning(f"Model {model} not recognized by tiktoken. Using cl100k_base tokenizer instead.")
            # Default to cl100k_base tokenizer which is used by most recent GPT models
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text: str) -> int:
        """
        Count the number of tokens in a text string
        
        Args:
            text: The text to count tokens for
            
        Returns:
            Number of tokens
        """
        return len(self.tokenizer.encode(text))
    
    def create_chat_completion(
        self, 
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Create a chat completion with the OpenAI API
        
        Args:
            messages: List of messages in the conversation
            temperature: Temperature for response generation (0-1)
            max_tokens: Maximum tokens in the response
            
        Returns:
            The API response
        """
        # Convert Message objects to dicts for the OpenAI API
        api_messages = [message.model_dump() for message in messages]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            raise
    
    async def create_chat_completion_async(
        self, 
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Create a chat completion with the OpenAI API asynchronously
        
        Args:
            messages: List of messages in the conversation
            temperature: Temperature for response generation (0-1)
            max_tokens: Maximum tokens in the response
            
        Returns:
            The API response
        """
        # Convert Message objects to dicts for the OpenAI API
        api_messages = [message.model_dump() for message in messages]
        
        try:
            response = await self.async_client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response
        except Exception as e:
            logger.error(f"Error calling async OpenAI API: {e}")
            raise
    
    def create_streaming_chat_completion(
        self, 
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Iterator[Dict[str, Any]]:
        """
        Create a streaming chat completion with the OpenAI API
        
        Args:
            messages: List of messages in the conversation
            temperature: Temperature for response generation (0-1)
            max_tokens: Maximum tokens in the response
            
        Returns:
            Iterator yielding response chunks
        """
        # Convert Message objects to dicts for the OpenAI API
        api_messages = [message.model_dump() for message in messages]
        
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            for chunk in stream:
                yield chunk
                
        except Exception as e:
            logger.error(f"Error in streaming OpenAI API: {e}")
            raise
    
    async def create_streaming_chat_completion_async(
        self, 
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Create a streaming chat completion with the OpenAI API asynchronously
        
        Args:
            messages: List of messages in the conversation
            temperature: Temperature for response generation (0-1)
            max_tokens: Maximum tokens in the response
            
        Returns:
            Async iterator yielding response chunks
        """
        # Convert Message objects to dicts for the OpenAI API
        api_messages = [message.model_dump() for message in messages]
        
        try:
            stream = await self.async_client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            async for chunk in stream:
                yield chunk
                
        except Exception as e:
            logger.error(f"Error in async streaming OpenAI API: {e}")
            raise

    def extract_text_from_streaming_response(self, stream: Iterator[Dict[str, Any]]) -> str:
        """
        Extract and concatenate text from a streaming response
        
        Args:
            stream: Iterator of response chunks
            
        Returns:
            Concatenated response text
        """
        full_response = ""
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content is not None:
                full_response += content
        return full_response
    
    async def extract_text_from_streaming_response_async(self, stream: AsyncIterator[Dict[str, Any]]) -> str:
        """
        Extract and concatenate text from an async streaming response
        
        Args:
            stream: Async iterator of response chunks
            
        Returns:
            Concatenated response text
        """
        full_response = ""
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content is not None:
                full_response += content
        return full_response 