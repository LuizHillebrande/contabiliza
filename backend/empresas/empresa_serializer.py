from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import Empresa
from br_cpf_cnpj import is_valid_cnpj


class EmpresaSerializer(ModelSerializer):
    class Meta:
        model = Empresa
        fields = [
            "id",
            "razao_social",
            "cnpj",
            "ativo",
            "regime",
        ]

    def validate_cnpj(self, value):
        cnpj = value.strip()

        if not is_valid_cnpj(cnpj):
            raise serializers.ValidationError(
                "CNPJ inválido."
            )

        return cnpj