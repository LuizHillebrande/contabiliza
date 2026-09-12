from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.http import HttpResponse

from .models import Empresa, Certificado
from .empresa_serializer import EmpresaSerializer
from .certificado_serializer import CertificadoSerializer
from .importacao_serializer import ImportacaoEmpresaSerializer
from .importacao_certificado_serializer import ImportacaoCertificadoSerializer
from .services.empresa_import_service import (
    importar_empresas_excel,
    gerar_modelo_excel_empresas,
)
from .services.certificado_import_service import importar_certificado


class EmpresaViewSet(ModelViewSet):
    queryset = Empresa.objects.all().order_by("id")
    serializer_class = EmpresaSerializer

    @action(detail=False, methods=["post"])
    def importar(self, request):
        serializer = ImportacaoEmpresaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        arquivo = serializer.validated_data["arquivo"]
        resultado = importar_empresas_excel(arquivo)

        empresas = resultado["empresas"]
        erros = resultado["erros"]

        if erros and not empresas:
            return Response(
                {
                    "mensagem": "Nenhuma empresa importada.",
                    "erros": erros,
                    "empresas": [],
                },
                status=400,
            )

        mensagem = f"{len(empresas)} empresa(s) importada(s) com sucesso."
        if erros:
            mensagem += f" {len(erros)} linha(s) com erro."

        return Response({
            "mensagem": mensagem,
            "empresas": empresas,
            "erros": erros,
        })

    @action(detail=False, methods=["get"], url_path="modelo-excel")
    def modelo_excel(self, request):
        """Baixa planilha modelo com dropdown de regime."""
        conteudo = gerar_modelo_excel_empresas()
        response = HttpResponse(
            conteudo,
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
        )
        response["Content-Disposition"] = (
            'attachment; filename="modelo_importacao_empresas.xlsx"'
        )
        return response


class CertificadoViewSet(ModelViewSet):
    queryset = Certificado.objects.all().order_by("id")
    serializer_class = CertificadoSerializer

    @action(detail=False, methods=["post"])
    def importar(self, request):
        serializer = ImportacaoCertificadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        arquivo = serializer.validated_data["arquivo"]
        resultado = importar_certificado(
            arquivo,
            usuario=request.user if request.user.is_authenticated else None,
        )

        so_erros = resultado.erros and not (
            resultado.importados or resultado.atualizados
        )

        if so_erros and len(resultado.itens) == 1:
            mensagem = resultado.itens[0]["mensagem"]
        else:
            mensagem = (
                f"{resultado.importados} importado(s), "
                f"{resultado.atualizados} atualizado(s), "
                f"{resultado.erros} erro(s)."
            )

        return Response(
            {
                "mensagem": mensagem,
                "importados": resultado.importados,
                "atualizados": resultado.atualizados,
                "erros": resultado.erros,
                "itens": resultado.itens,
            },
            status=400 if so_erros else 200,
        )
