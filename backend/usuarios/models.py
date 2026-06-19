from django.db import models

class Usuario(models.Model):

    PERFIL_CHOICES = [
        ("ADMIN", "Administrador"),
        ("ENCARREGADO", "Encarregado"),
        ("USUARIO", "Usuário"),
    ]

    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)

    perfil = models.CharField(
        max_length=20,
        choices=PERFIL_CHOICES
    )

    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome