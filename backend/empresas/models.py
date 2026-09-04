from django.db import models
from django.conf import settings
from django.utils import timezone

class Empresa(models.Model):
    razao_social = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=14, unique=True)
    ativo = models.BooleanField(default=True)
    regime = models.CharField(max_length=255) #quero q seja string sem opcoes, pode digitar qualquer coisa
    data_importacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.razao_social
    

class Certificado(models.Model):
    """
    Certificado digital A1 (.pfx/.p12) de um CNPJ.

    - pfx_encrypted / senha_encrypted: Fernet ciphertext (nunca plaintext em disco/DB).
    - Um certificado ativo por empresa (constraint parcial via is_active).
    """

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="certificados",
    )
    pfx_encrypted = models.BinaryField()
    senha_encrypted = models.BinaryField()
    subject_cn = models.CharField(max_length=255, blank=True)
    serial_number = models.CharField(max_length=64, blank=True, db_index=True)
    original_filename = models.CharField(
        max_length=255,
        blank=True,
        help_text="Nome do arquivo sem o trecho {senha ...}.",
    )
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    # Maior janela (em dias) já avisada por e-mail (ex.: 30 → depois 14 → 7…).
    expiry_alert_last_threshold = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Último limiar de dias (30/14/7/…) para o qual o alerta de vencimento foi enviado.",
    )
    is_active = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="certificados_uploaded",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Certificado"
        verbose_name_plural = "Certificados"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Certificado {self.empresa.cnpj} (até {self.valid_until:%Y-%m-%d})" if self.valid_until else f"Certificado {self.empresa.cnpj}"

    @property
    def is_expired(self) -> bool:
        if not self.valid_until:
            return False
        return self.valid_until <= timezone.now()

    @property
    def days_until_expiry(self) -> int | None:
        if not self.valid_until:
            return None
        delta = self.valid_until - timezone.now()
        return delta.days

    @property
    def is_expiring_soon(self) -> bool:
        days = self.days_until_expiry
        if days is None:
            return False
        warning = getattr(settings, "CERTIFICATE_EXPIRY_WARNING_DAYS", 30)
        return 0 <= days <= warning




