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


_SENHA_COM_CHAVES = re.compile(
    r"\{senha\s+([^}]+)\}",
    re.IGNORECASE,
)

# Ex.: 'empresa senha 1231.pfx' → captura '1231' (sem a extensão)
_SENHA_SEM_CHAVES = re.compile(
    r"(?:^|[\s_\-])senha\s+(\S+?)(?=\s*\.(?:pfx|p12)\b|\s|$)",
    re.IGNORECASE,
)


def extract_password_from_filename(filename: str) -> tuple[str | None, str]:
    # tira a senha do nome do arquivo (com ou sem {})
    """
    Aceita:
      - 'empresa {senha 1234}.pfx'
      - 'empresa senha 1231.pfx'
    Retorna (senha|None, nome sem o trecho da senha).
    """
    match = _SENHA_COM_CHAVES.search(filename)
    pattern = _SENHA_COM_CHAVES

    if not match:
        match = _SENHA_SEM_CHAVES.search(filename)
        pattern = _SENHA_SEM_CHAVES

    if not match:
        return None, filename

    senha = match.group(1).strip()
    # tira .pfx se o regex pegou junto
    senha = re.sub(r"\.(?:pfx|p12)$", "", senha, flags=re.IGNORECASE)

    nome_limpo = pattern.sub(" ", filename)
    nome_limpo = re.sub(r"\s+\.", ".", nome_limpo)
    nome_limpo = re.sub(r"\s{2,}", " ", nome_limpo).strip()

    return senha or None, nome_limpo or filename


def _attr_value(attr) -> str:
    try:
        return attr.value
    except Exception:
        return str(attr)


def _subject_cn(cert: x509.Certificate) -> str:
    # common name que ja vem no pfx
    attrs = cert.subject.get_attributes_for_oid(x509.NameOID.COMMON_NAME)
    if attrs:
        return _attr_value(attrs[0])
    return cert.subject.rfc4514_string()


def _digitos_san(valor) -> str:
    if isinstance(valor, (bytes, bytearray)):
        texto = bytes(valor).decode("latin-1", errors="ignore")
    else:
        texto = str(valor)
    return re.sub(r"\D", "", texto)


def _extract_cnpj(cert: x509.Certificate) -> str:
    # cnpj que ja vem no pfx (san / subject) — sem inventar de nome de arquivo
    # usa os ULTIMOS 14 digitos pra nao pegar prefixo de oid

    try:
        san = cert.extensions.get_extension_for_class(
            x509.SubjectAlternativeName
        ).value
        for name in san:
            digitos = _digitos_san(getattr(name, "value", name))
            if len(digitos) >= 14:
                return digitos[-14:]
    except x509.ExtensionNotFound:
        pass

    subject_digits = re.sub(r"\D", "", cert.subject.rfc4514_string())
    if len(subject_digits) >= 14:
        return subject_digits[-14:]

    cn_digits = re.sub(r"\D", "", _subject_cn(cert))
    if len(cn_digits) >= 14:
        return cn_digits[-14:]

    return ""


def _to_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=dt_timezone.utc)
    return dt


def load_pfx(conteudo: bytes, senha: str) -> PfxMaterial:
    # abre o A1 e le o que ja esta no certificado
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

    return PfxMaterial(
        cnpj=_extract_cnpj(cert),
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
