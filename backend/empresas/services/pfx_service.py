"""Leitura de certificados A1 (.pfx / .p12) e senha no nome do arquivo."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone

from cryptography import x509
from cryptography.hazmat.primitives.serialization import pkcs12


class PfxError(Exception):
    """Erro ao ler ou interpretar o arquivo PFX."""


@dataclass
class PfxMaterial:
    cnpj: str
    razao_social: str
    subject_cn: str
    serial_number: str
    valid_from: datetime | None
    valid_until: datetime | None


_SENHA_NO_NOME = re.compile(
    r"\{senha\s+([^}]+)\}",
    re.IGNORECASE,
)

_CNPJ_DIGITS = re.compile(r"\d{14}")


def extract_password_from_filename(filename: str) -> tuple[str | None, str]:
    """
    Ex.: 'empresa {senha 1234}.pfx' → ('1234', 'empresa .pfx')
    Retorna (senha|None, nome sem o trecho da senha).
    """
    match = _SENHA_NO_NOME.search(filename)

    if not match:
        return None, filename

    senha = match.group(1).strip()
    nome_limpo = (_SENHA_NO_NOME.sub("", filename)).strip()
    nome_limpo = re.sub(r"\s+\.", ".", nome_limpo)
    nome_limpo = re.sub(r"\s{2,}", " ", nome_limpo).strip()

    return senha or None, nome_limpo or filename


def _attr_value(attr) -> str:
    try:
        return attr.value
    except Exception:
        return str(attr)


def _subject_cn(cert: x509.Certificate) -> str:
    attrs = cert.subject.get_attributes_for_oid(x509.NameOID.COMMON_NAME)
    if attrs:
        return _attr_value(attrs[0])
    return cert.subject.rfc4514_string()


def _extract_cnpj(cert: x509.Certificate) -> str:
    # 1) Subject Alternative Name
    try:
        san = cert.extensions.get_extension_for_class(
            x509.SubjectAlternativeName
        ).value
        for name in san:
            text = str(getattr(name, "value", name))
            match = _CNPJ_DIGITS.search(re.sub(r"\D", "", text))
            if match:
                return match.group(0)
    except x509.ExtensionNotFound:
        pass

    # 2) Subject DN completo
    subject_digits = re.sub(r"\D", "", cert.subject.rfc4514_string())
    match = _CNPJ_DIGITS.search(subject_digits)
    if match:
        return match.group(0)

    # 3) Common Name
    cn_digits = re.sub(r"\D", "", _subject_cn(cert))
    match = _CNPJ_DIGITS.search(cn_digits)
    if match:
        return match.group(0)

    return ""


def _to_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=dt_timezone.utc)
    return dt


def load_pfx(conteudo: bytes, senha: str) -> PfxMaterial:
    try:
        _key, cert, _additional = pkcs12.load_key_and_certificates(
            conteudo,
            senha.encode("utf-8"),
        )
    except ValueError as exc:
        raise PfxError(
            "Não foi possível abrir o PFX. Verifique a senha no nome do arquivo."
        ) from exc
    except Exception as exc:
        raise PfxError(f"Arquivo PFX inválido: {exc}") from exc

    if cert is None:
        raise PfxError("Nenhum certificado encontrado no arquivo PFX.")

    subject_cn = _subject_cn(cert)
    cnpj = _extract_cnpj(cert)

    return PfxMaterial(
        cnpj=cnpj,
        razao_social=subject_cn,
        subject_cn=subject_cn,
        serial_number=format(cert.serial_number, "x"),
        valid_from=_to_aware(cert.not_valid_before_utc)
        if hasattr(cert, "not_valid_before_utc")
        else _to_aware(cert.not_valid_before),
        valid_until=_to_aware(cert.not_valid_after_utc)
        if hasattr(cert, "not_valid_after_utc")
        else _to_aware(cert.not_valid_after),
    )
