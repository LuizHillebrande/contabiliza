from .models import Certificado
from rest_framework.serializers import ModelSerializer

class CertificadoSerializer(ModelSerializer):
    class Meta:
        model = Certificado
        fields = [
            'id',
            'empresa',
            'arquivo',
            'validade_inicio',
            'validade_fim',
            'numero_serie',
            'ativo',
        ]
#poderia usar ALL para retornar tudo, mas por boas práticas faz-se assim.