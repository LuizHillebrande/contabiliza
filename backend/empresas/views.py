from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Empresa, Certificado
from .empresa_serializer import EmpresaSerializer
from .certificado_serializer import CertificadoSerializer
from .importacao_serializer import ImportacaoEmpresaSerializer
from .services.empresa_import_service import importar_empresas_excel


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
