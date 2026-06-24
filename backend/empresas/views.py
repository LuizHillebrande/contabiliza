from rest_framework.viewsets import ModelViewSet

from .models import Empresa, Certificado
from .certificado_serializer import CertificadoSerializer
from .empresa_serializer import EmpresaSerializer


class EmpresaViewSet(ModelViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer


class CertificadoViewSet(ModelViewSet):
    queryset = Certificado.objects.all()
    serializer_class = CertificadoSerializer