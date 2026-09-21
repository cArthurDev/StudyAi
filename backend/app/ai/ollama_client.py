import json
import re
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.llm_model = settings.OLLAMA_LLM_MODEL
        self.embedding_model = settings.OLLAMA_EMBEDDING_MODEL
        self.timeout = httpx.Timeout(120.0, connect=10.0)

    async def check_health(self) -> Dict[str, Any]:
        """Check if Ollama server is accessible and verify models."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "available": True,
                        "base_url": self.base_url,
                        "models_found": models,
                        "llm_model": self.llm_model,
                        "embedding_model": self.embedding_model,
                        "llm_ready": any(self.llm_model in m for m in models),
                        "embedding_ready": any(self.embedding_model in m for m in models),
                    }
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
        
        return {
            "available": False,
            "base_url": self.base_url,
            "error": "O servidor de Inteligência Artificial local (Ollama) não está disponível.",
            "llm_model": self.llm_model,
            "embedding_model": self.embedding_model,
            "llm_ready": False,
            "embedding_ready": False
        }

    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for safety and context window checks (~3.5-4 chars/token)."""
        if not text:
            return 0
        return max(1, len(text) // 4)

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: Optional[int] = None
    ) -> str:
        """Generate plain or markdown text using the local LLM model."""
        payload: Dict[str, Any] = {
            "model": self.llm_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            }
        }
        if system_prompt:
            payload["system"] = system_prompt
        if max_tokens:
            payload["options"]["num_predict"] = max_tokens

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                if response.status_code != 200:
                    raise RuntimeError(f"Ollama returned HTTP {response.status_code}: {response.text}")
                data = response.json()
                return data.get("response", "").strip()
        except httpx.ConnectError:
            raise RuntimeError("O servidor de Inteligência Artificial local não está disponível. Inicie o Ollama com 'ollama serve'.")
        except Exception as e:
            logger.error(f"Error in generate_text: {e}")
            raise

    async def generate_structured(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema_format: Optional[str] = "JSON",
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """Generate structured JSON output with validation and automatic markdown stripping."""
        enhanced_system = (
            f"{system_prompt or ''}\n"
            "IMPORTANTE: Você é uma IA de estudos precisa. Você DEVE responder APENAS com um objeto JSON válido. "
            "Não inclua introduções, explicações fora do JSON ou comentários. "
            "Estrutura requerida: " + (schema_format or "JSON")
        ).strip()

        payload = {
            "model": self.llm_model,
            "prompt": prompt,
            "system": enhanced_system,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": temperature,
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                if response.status_code != 200:
                    raise RuntimeError(f"Ollama error {response.status_code}: {response.text}")
                raw_text = response.json().get("response", "").strip()
                
                # Clean potential markdown codeblock formatting ```json ... ```
                cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
                cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
                
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError:
                    # Attempt bracket matching
                    match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
                    if match:
                        return json.loads(match.group(1))
                    raise ValueError(f"Could not parse valid JSON from Ollama output: {raw_text[:200]}")
        except httpx.ConnectError:
            raise RuntimeError("O servidor de Inteligência Artificial local não está disponível.")
        except Exception as e:
            logger.error(f"Error in generate_structured: {e}")
            raise

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate a vector embedding using the local embedding model."""
        clean_text = text.replace("\n", " ").strip()
        if not clean_text:
            return [0.0] * settings.EMBEDDING_DIMENSION

        payload = {
            "model": self.embedding_model,
            "prompt": clean_text
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/api/embeddings", json=payload)
                if response.status_code != 200:
                    raise RuntimeError(f"Ollama embeddings error {response.status_code}: {response.text}")
                embedding = response.json().get("embedding", [])
                return embedding
        except httpx.ConnectError:
            raise RuntimeError("O servidor de Inteligência Artificial local não está disponível.")
        except Exception as e:
            logger.error(f"Error in generate_embedding: {e}")
            raise

    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings sequentially or in small batches to prevent Ollama overload."""
        results = []
        for t in texts:
            emb = await self.generate_embedding(t)
            results.append(emb)
        return results

ollama_client = OllamaClient()
