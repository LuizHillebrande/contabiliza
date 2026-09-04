from rest_framework import serializers


class ImportacaoCertificadoSerializer(serializers.Serializer):
    arquivo = serializers.FileField()

    def validate_arquivo(self, arquivo):
        nome = arquivo.name.lower()

        if not nome.endswith((".pfx", ".p12")):
            raise serializers.ValidationError(
                "Envie um certificado A1 válido (.pfx ou .p12)."
            )

        return arquivo
