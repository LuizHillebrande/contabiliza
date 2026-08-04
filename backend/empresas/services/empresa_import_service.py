import re
import openpyxl as opx

from empresas.models import Empresa


def importar_empresas_excel(arquivo_excel):
    workbook = opx.load_workbook(arquivo_excel)
    sheet = workbook.active

    empresas_importadas = []

    # Linha 1 = cabeçalho
    for linha in sheet.iter_rows(min_row=2):
        razao_social = linha[0].value
        cnpj = linha[1].value
    
        if not razao_social or not cnpj:
            continue

        razao_social = str(razao_social).strip()

        cnpj_limpo = re.sub(
            r"\D",
            "",
            str(cnpj)
        )

        if len(cnpj_limpo) != 14:
            continue

        empresa, criada = Empresa.objects.update_or_create(
            cnpj=cnpj_limpo,
            defaults={
                "razao_social": razao_social
            }
        )

        empresas_importadas.append({
            "id": empresa.id,
            "razao_social": empresa.razao_social,
            "cnpj": empresa.cnpj,
            "criada": criada,
        })

    return empresas_importadas