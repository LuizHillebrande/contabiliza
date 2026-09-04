import re

from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import Empresa
class EmpresaSerializer(ModelSerializer):
    class Meta:
        model = Empresa
        fields = [
            'id',
            'razao_social',
            'cnpj',
            'ativo',
            'regime',
            'data_importacao',
        ]
        read_only_fields = ["ativo", "data_importacao"] #n permite q o usuario ative a tarefa manualmente pelo frontend 

    def validate_cnpj(self, value):
        # remove qualquer caractere não numérico
        cnpj = re.sub(r"\D", "", value)

        if len(cnpj) != 14:
            raise serializers.ValidationError(
                "CNPJ deve conter exatamente 14 dígitos."
            )
        if not value.isdigit():
            raise serializers.ValidationError(
                "CNPJ deve conter apenas dígitos."
            )

        return cnpj