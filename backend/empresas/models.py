from django.db import models

class Empresa(models.Model):
    razao_social = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=14, unique=True)

    def __str__(self):
        return self.razao_social
    
class Certificado(models.Model):
    empresa = models.ForeignKey(
    Empresa,
    on_delete=models.CASCADE,
    related_name="certificados"
    )   

    arquivo = models.FileField(upload_to="certificados/")
    senha = models.CharField(max_length=255)

    validade_inicio = models.DateTimeField()
    validade_fim = models.DateTimeField()

    numero_serie = models.CharField(max_length=255)

    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.empresa.razao_social} - {self.validade_fim}"

