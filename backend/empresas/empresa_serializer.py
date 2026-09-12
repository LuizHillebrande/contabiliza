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
            "data_importacao",
        ]
        # Remove UniqueValidator automático do DRF (mensagem genérica).
        # A unicidade fica só em validate_cnpj, com mensagem para inativa.
        extra_kwargs = {
            "cnpj": {"validators": []},
        }

    def validate_cnpj(self, value):
        cnpj = "".join(ch for ch in str(value).strip() if ch.isdigit())

        if not is_valid_cnpj(cnpj):
            raise serializers.ValidationError("CNPJ inválido.")

        qs = Empresa.objects.filter(cnpj=cnpj)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)

        existente = qs.first()
        if existente is not None:
            if not existente.ativo:
                raise serializers.ValidationError(
                    "Empresa existe porém está inativa."
                )
            raise serializers.ValidationError("Empresa já existe.")

        return cnpj
