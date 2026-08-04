from rest_framework import serializers


class ImportacaoEmpresaSerializer(serializers.Serializer):
    arquivo = serializers.FileField()

    def validate_arquivo(self, arquivo):
        if not arquivo.name.endswith((".xlsx", ".xlsm")):
            raise serializers.ValidationError(
                "Envie um arquivo Excel válido (.xlsx)."
            )

        return arquivo