"""Common contract shared by all platform agents (scanner, news, LLM, quant, ...)."""

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """Every agent exposes a single async ``run`` entrypoint invoked by Celery."""

    name: str

    @abstractmethod
    async def run(self, *args: Any, **kwargs: Any) -> Any: ...
