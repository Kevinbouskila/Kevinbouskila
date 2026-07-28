"""Portable column types shared across models.

``JSONB`` is used on PostgreSQL for indexing/query performance; the generic
``JSON`` type is used as a fallback (e.g. SQLite in tests) via ``with_variant``.
"""

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

JSONVariant = JSON().with_variant(JSONB(), "postgresql")
