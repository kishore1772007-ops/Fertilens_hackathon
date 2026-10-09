import hashlib
import math
from typing import List, Optional
import httpx
from app.core.config import settings
from app.core.logging_config import logger

class EmbeddingService:
    def __init__(self):
        self.host = settings.OLLAMA_EMBED_HOST
        self.model = settings.OLLAMA_EMBED_MODEL
        self.dimensions = settings.EMBEDDING_DIMENSIONS
        self._is_ollama_available: Optional[bool] = None

    async def _check_ollama_health(self) -> bool:
        if self._is_ollama_available is not None:
            return self._is_ollama_available
        try:
            async with httpx.AsyncClient(timeout=0.8) as client:
                res = await client.get(f"{self.host.rstrip('/')}/api/tags")
                self._is_ollama_available = (res.status_code == 200)
        except Exception:
            self._is_ollama_available = False
        return self._is_ollama_available

    def _generate_fallback_embedding(self, text: str) -> List[float]:
        """
        Generates a deterministic 768-dimensional normalized embedding
        used if the local Ollama service is unavailable.
        """
        vec = []
        for seed_idx in range(self.dimensions):
            hash_input = f"{seed_idx}:{text}".encode("utf-8")
            h = int(hashlib.md5(hash_input).hexdigest()[:8], 16)
            val = (h / 0xFFFFFFFF) * 2.0 - 1.0
            vec.append(val)

        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 6) for x in vec]

    async def get_embedding(self, text: str) -> List[float]:
        is_available = await self._check_ollama_health()
        if is_available:
            try:
                from ollama import AsyncClient as OllamaAsyncClient
                client = OllamaAsyncClient(host=self.host)
                res = await client.embeddings(model=self.model, prompt=text)
                embedding = res.get("embedding", [])
                if len(embedding) == self.dimensions:
                    return embedding
                elif len(embedding) > self.dimensions:
                    return embedding[:self.dimensions]
                else:
                    return embedding + [0.0] * (self.dimensions - len(embedding))
            except Exception as e:
                logger.info(f"Ollama call failed ({e}). Falling back to deterministic vector.")
                self._is_ollama_available = False
        
        return self._generate_fallback_embedding(text)

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        results = []
        for text in texts:
            emb = await self.get_embedding(text)
            results.append(emb)
        return results

embedding_service = EmbeddingService()
