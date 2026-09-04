from __future__ import annotations

from dataclasses import dataclass, field

from django.db import transaction
from django.utils import timezone

from empresas.models import Empresa, Certificado
from empresas.services.crypto_service import (
    encrypt_bytes,
    encrypt_str,
)
from empresas.services.pfx_service import (
    PfxError,
    extract_password_from_filename,
    load_pfx,
)


@dataclass
class CertificateImportResult:
    importados: int = 0
    atualizados: int = 0
    erros: int = 0

    itens: list[dict] = field(
        default_factory=list
    )

    def add_item(
        self,
        *,
        arquivo: str,
        status: str,
        mensagem: str,
        cnpj: str = "",
        razao_social: str = "",
    ) -> None:

        self.itens.append(
            {
                "arquivo": arquivo,
                "status": status,
                "mensagem": mensagem,
                "cnpj": cnpj,
                "razao_social": razao_social,
            }
        )

        if status == "importado":
            self.importados += 1

        elif status == "atualizado":
            self.atualizados += 1

        elif status == "erro":
            self.erros += 1


def importar_certificado(
    arquivo,
    usuario=None,
) -> CertificateImportResult:

    result = CertificateImportResult()

    filename = getattr(
        arquivo,
        "name",
        "certificado",
    )

    try:
        senha, nome_limpo = (
            extract_password_from_filename(
                filename
            )
        )

        if not senha:
            result.add_item(
                arquivo=filename,
                status="erro",
                mensagem=(
                    "Senha não encontrada no nome "
                    "do arquivo. Use, por exemplo, "
                    "'empresa {senha 1234}.pfx'."
                ),
            )

            return result

        conteudo = arquivo.read()

        if not conteudo:
            result.add_item(
                arquivo=filename,
                status="erro",
                mensagem="Arquivo vazio.",
            )

            return result

        material = load_pfx(
            conteudo,
            senha,
        )

        if not material.cnpj:
            result.add_item(
                arquivo=filename,
                status="erro",
                mensagem=(
                    "CNPJ não encontrado no certificado."
                ),
            )

            return result

        if len(material.cnpj) != 14:
            result.add_item(
                arquivo=filename,
                status="erro",
                mensagem=(
                    "CNPJ encontrado no certificado "
                    "é inválido."
                ),
                cnpj=material.cnpj,
            )

            return result

        if (
            material.valid_until
            and material.valid_until <= timezone.now()
        ):
            result.add_item(
                arquivo=filename,
                status="erro",
                mensagem="Certificado já está vencido.",
                cnpj=material.cnpj,
                razao_social=material.razao_social,
            )

            return result

        _salvar_certificado(
            material=material,
            conteudo=conteudo,
            senha=senha,
            nome_limpo=nome_limpo,
            usuario=usuario,
            result=result,
            arquivo=filename,
        )

    except PfxError as exc:

        result.add_item(
            arquivo=filename,
            status="erro",
            mensagem=str(exc),
        )

    except Exception as exc:

        result.add_item(
            arquivo=filename,
            status="erro",
            mensagem=(
                "Erro inesperado ao importar "
                "o certificado."
            ),
        )

        # não colocamos senha ou conteúdo do PFX
        # na mensagem/log

    return result


@transaction.atomic
def _salvar_certificado(
    *,
    material,
    conteudo: bytes,
    senha: str,
    nome_limpo: str,
    usuario,
    result: CertificateImportResult,
    arquivo: str,
) -> None:

    empresa = (
        Empresa.objects
        .filter(cnpj=material.cnpj)
        .first()
    )

    empresa_criada = False

    if not empresa:

        empresa = Empresa.objects.create(
            razao_social=(
                material.razao_social
                or f"Empresa {material.cnpj}"
            ),
            cnpj=material.cnpj,
            ativo=True,
            regime="Não informado",
        )

        empresa_criada = True

    if not empresa.razao_social and material.razao_social:
        empresa.razao_social = material.razao_social
        empresa.save(update_fields=["razao_social"])

    # verifica se já existe um certificado
    # com o mesmo CNPJ e serial
    existente = (
        Certificado.objects
        .filter(
            empresa=empresa,
            serial_number=material.serial_number,
            is_active=True,
        )
        .first()
    )

    if existente:
        result.add_item(
            arquivo=arquivo,
            status="erro",
            mensagem=(
                "Certificado já cadastrado."
            ),
            cnpj=material.cnpj,
            razao_social=empresa.razao_social,
        )

        return

    # desativa o certificado atualmente ativo
    Certificado.objects.filter(
        empresa=empresa,
        is_active=True,
    ).update(
        is_active=False
    )

    Certificado.objects.create(
        empresa=empresa,
        pfx_encrypted=encrypt_bytes(
            conteudo
        ),
        senha_encrypted=encrypt_str(
            senha
        ),
        subject_cn=material.subject_cn,
        serial_number=material.serial_number,
        original_filename=nome_limpo,
        valid_from=material.valid_from,
        valid_until=material.valid_until,
        is_active=True,
        uploaded_by=usuario,
    )

    status = (
        "atualizado"
        if existente is not None
        else "importado"
    )

    mensagem = (
        "Certificado importado com sucesso."
    )

    if empresa_criada:
        mensagem += " Empresa criada."

    result.add_item(
        arquivo=arquivo,
        status=status,
        mensagem=mensagem,
        cnpj=material.cnpj,
        razao_social=empresa.razao_social,
    )