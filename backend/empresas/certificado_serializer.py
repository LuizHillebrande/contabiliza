from rest_framework.serializers import ModelSerializer
from .models import Certificado


class CertificadoSerializer(ModelSerializer):
    class Meta:
        model = Certificado
        fields = [
            'id',
            'empresa',
            'subject_cn',
            'serial_number',
            'original_filename',
            'valid_from',
            'valid_until',
            'is_active',
            'uploaded_by',
            'created_at',
            'updated_at',
        ]
#poderia usar ALL para retornar tudo, mas por boas práticas faz-se assim.