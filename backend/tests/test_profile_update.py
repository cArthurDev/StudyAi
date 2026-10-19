from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.api.v1.endpoints.auth import update_me
from app.schemas.schemas import UserProfileUpdate


def database_with(existing=None):
    db = AsyncMock()
    result = MagicMock()
    result.scalars.return_value.first.return_value = existing
    db.execute.return_value = result
    return db


@pytest.mark.asyncio
async def test_profile_update_updates_authenticated_user():
    user = SimpleNamespace(id="user-1", full_name="Nome antigo", email="old@example.com")
    db = database_with()
    result = await update_me(UserProfileUpdate(full_name="  Novo nome  ", email="new@example.com"), db, user)
    assert result is user
    assert user.full_name == "Novo nome"
    assert user.email == "new@example.com"
    query = db.execute.call_args.args[0].compile()
    assert "user-1" in query.params.values()
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_duplicate_email_leaves_profile_unchanged():
    user = SimpleNamespace(id="user-1", full_name="Nome", email="old@example.com")
    db = database_with(SimpleNamespace(id="user-2"))
    with pytest.raises(HTTPException) as error:
        await update_me(UserProfileUpdate(full_name="Outro", email="taken@example.com"), db, user)
    assert error.value.status_code == 409
    assert user.email == "old@example.com"
    assert user.full_name == "Nome"
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_concurrent_duplicate_rolls_back():
    user = SimpleNamespace(id="user-1")
    db = database_with()
    db.commit.side_effect = IntegrityError("update", {}, Exception("duplicate"))
    with pytest.raises(HTTPException) as error:
        await update_me(UserProfileUpdate(full_name="Nome", email="taken@example.com"), db, user)
    assert error.value.status_code == 409
    db.rollback.assert_awaited_once()


@pytest.mark.parametrize("name,email", [("   ", "ok@example.com"), ("Nome", "invalid"), ("x" * 256, "ok@example.com")])
def test_invalid_profile_is_rejected(name, email):
    with pytest.raises(ValidationError):
        UserProfileUpdate(full_name=name, email=email)
