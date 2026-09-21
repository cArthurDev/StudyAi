import pytest
from app.services.mastery_service import mastery_service
from app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from app.document_processing.extractors import DocumentExtractor
from app.ai.ollama_client import ollama_client

def test_password_hashing():
    pwd = "StudyMindPassword123!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_flow():
    user_id = "user-12345-test"
    token = create_access_token(subject=user_id)
    decoded_id = decode_token(token)
    assert decoded_id == user_id

def test_deterministic_mastery_classification():
    assert mastery_service.classify_mastery_status(95.0) == "DOMINADO"
    assert mastery_service.classify_mastery_status(80.0) == "DOMINADO"
    assert mastery_service.classify_mastery_status(75.5) == "EM PROGRESSO"
    assert mastery_service.classify_mastery_status(60.0) == "EM PROGRESSO"
    assert mastery_service.classify_mastery_status(52.0) == "PRECISA REVISAR"
    assert mastery_service.classify_mastery_status(40.0) == "PRECISA REVISAR"
    assert mastery_service.classify_mastery_status(35.0) == "CRÍTICO"
    assert mastery_service.classify_mastery_status(0.0) == "CRÍTICO"

def test_cram_priority_scoring():
    # Low mastery (0%), high difficulty, exam likely -> High priority score
    high_prio = mastery_service.calculate_cram_priority(
        difficulty="Difícil",
        mastery_score=10.0,
        importance_score=90.0,
        is_exam_likely=True,
        last_reviewed_days=10
    )
    # Mastered (95%), easy, not likely on exam -> Low priority
    low_prio = mastery_service.calculate_cram_priority(
        difficulty="Fácil",
        mastery_score=95.0,
        importance_score=30.0,
        is_exam_likely=False,
        last_reviewed_days=1
    )
    assert high_prio > low_prio
    assert high_prio >= 70.0
    assert low_prio < 30.0

def test_token_estimation():
    text = "Palavra " * 100
    tokens = ollama_client.estimate_tokens(text)
    assert tokens > 0
    assert tokens < len(text)
