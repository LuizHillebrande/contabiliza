from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Empresa, Certificado
from .empresa_serializer import EmpresaSerializer
from .certificado_serializer import CertificadoSerializer
from .importacao_serializer import ImportacaoEmpresaSerializer
from .importacao_certificado_serializer import ImportacaoCertificadoSerializer
from .services.empresa_import_service import importar_empresas_excel
from .services.certificado_import_service import importar_certificado


class EmpresaViewSet(ModelViewSet):
    queryset = Empresa.objects.all().order_by("id")
    serializer_class = EmpresaSerializer

    @action(detail=False, methods=["post"])
    def importar(self, request):
        serializer = ImportacaoEmpresaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        arquivo = serializer.validated_data["arquivo"]

        empresas = importar_empresas_excel(arquivo)

        return Response({
            "mensagem": f"{len(empresas)} empresas importadas com sucesso.",
            "empresas": empresas,
        })


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
