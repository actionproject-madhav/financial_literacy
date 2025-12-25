"""
LLM Service - Wrapper for AI content generation

Supports multiple LLM providers:
- OpenAI (GPT-4, GPT-3.5)
- Google Gemini
- Anthropic Claude

Configure via environment variables:
- LLM_PROVIDER: "openai", "gemini", or "anthropic"
- OPENAI_API_KEY
- GEMINI_API_KEY
- ANTHROPIC_API_KEY
"""

import os
from typing import Optional


class LLMService:
    """
    Unified interface for LLM providers
    """

    def __init__(self, provider: Optional[str] = None):
        """
        Initialize LLM service

        Args:
            provider: LLM provider ("openai", "gemini", "anthropic")
                     Uses LLM_PROVIDER env var if not specified
        """
        self.provider = provider or os.getenv('LLM_PROVIDER', 'openai')
        self._client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the appropriate LLM client"""
        if self.provider == 'openai':
            self._initialize_openai()
        elif self.provider == 'gemini':
            self._initialize_gemini()
        elif self.provider == 'anthropic':
            self._initialize_anthropic()
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    def _initialize_openai(self):
        """Initialize OpenAI client"""
        try:
            from openai import OpenAI
            from config.services import config
            
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set in environment")
            
            self._client = OpenAI(api_key=api_key)
            model = config.OPENAI_CHAT_MODEL
            print(f"✅ LLM Service initialized with OpenAI ({model})")
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")

    def _initialize_gemini(self):
        """Initialize Google Gemini client"""
        try:
            import google.generativeai as genai
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not set in environment")
            genai.configure(api_key=api_key)
            model_name = os.getenv('GEMINI_MODEL', 'gemini-pro')
            self._client = genai.GenerativeModel(model_name)
            print(f"✅ LLM Service initialized with Gemini ({model_name})")
        except ImportError:
            raise ImportError("google-generativeai package not installed. Run: pip install google-generativeai")

    def _initialize_anthropic(self):
        """Initialize Anthropic Claude client"""
        try:
            import anthropic
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not set in environment")
            self._client = anthropic.Anthropic(api_key=api_key)
            print(f"✅ LLM Service initialized with Anthropic Claude")
        except ImportError:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")

    def generate_content(self, prompt: str, max_tokens: int = 500,
                        temperature: float = 0.7) -> str:
        """
        Generate content using the configured LLM

        Args:
            prompt: The prompt text
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0-1.0)

        Returns:
            Generated text
        """
        if self.provider == 'openai':
            return self._generate_openai(prompt, max_tokens, temperature)
        elif self.provider == 'gemini':
            return self._generate_gemini(prompt, max_tokens, temperature)
        elif self.provider == 'anthropic':
            return self._generate_anthropic(prompt, max_tokens, temperature)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _generate_openai(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate with OpenAI using cheapest model"""
        try:
            from config.services import config
            from openai import OpenAI
            
            # Use cheapest model from config
            model = config.OPENAI_CHAT_MODEL  # gpt-4o-mini (cheapest)
            
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful financial literacy tutor for immigrants learning about US finance."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"❌ OpenAI API error: {e}")
            raise

    def _generate_gemini(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate with Google Gemini"""
        try:
            # Gemini uses generation_config for parameters
            generation_config = {
                'max_output_tokens': max_tokens,
                'temperature': temperature,
            }

            response = self._client.generate_content(
                prompt,
                generation_config=generation_config
            )

            return response.text.strip()

        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            raise

    def _generate_anthropic(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Generate with Anthropic Claude"""
        try:
            model = os.getenv('ANTHROPIC_MODEL', 'claude-3-sonnet-20240229')

            message = self._client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            return message.content[0].text.strip()

        except Exception as e:
            print(f"❌ Anthropic API error: {e}")
            raise

    def generate_with_fallback(self, prompt: str, default: str = "",
                              max_tokens: int = 500, temperature: float = 0.7) -> str:
        """
        Generate content with fallback to default on error

        Args:
            prompt: The prompt text
            default: Default text to return on error
            max_tokens: Maximum tokens
            temperature: Sampling temperature

        Returns:
            Generated text or default on error
        """
        try:
            return self.generate_content(prompt, max_tokens, temperature)
        except Exception as e:
            print(f"⚠️  LLM generation failed, using fallback: {e}")
            return default


# Global instance for convenience
_llm_service = None


def get_llm_service() -> LLMService:
    """Get or create global LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def generate_content(prompt: str, max_tokens: int = 500,
                    temperature: float = 0.7) -> str:
    """
    Convenience function for content generation

    Args:
        prompt: The prompt text
        max_tokens: Maximum tokens
        temperature: Sampling temperature

    Returns:
        Generated text
    """
    service = get_llm_service()
    return service.generate_content(prompt, max_tokens, temperature)
