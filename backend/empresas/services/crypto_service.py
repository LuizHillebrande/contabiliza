"""Criptografia Fernet para PFX e senha do certificado."""

from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings


def _fernet() -> Fernet:
    # chave vem do settings; senha/pfx nunca ficam em texto puro no banco
    """
    Chave estável derivada de CERTIFICATE_FERNET_KEY (se existir)
    ou de SECRET_KEY do Django.
    """
    raw = getattr(settings, "CERTIFICATE_FERNET_KEY", None) or settings.SECRET_KEY
    digest = hashlib.sha256(str(raw).encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_bytes(data: bytes) -> bytes:
    # cifra os bytes do arquivo .pfx
    return _fernet().encrypt(data)


def encrypt_str(value: str) -> bytes:
    # cifra a senha do certificado
    return encrypt_bytes(value.encode("utf-8"))


def decrypt_bytes(token: bytes) -> bytes:
    return _fernet().decrypt(token)


def decrypt_str(token: bytes) -> str:
    return decrypt_bytes(token).decode("utf-8")
