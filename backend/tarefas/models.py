from django.db import models

# Create your models here.

#models.Model indica que a classe será uma tabela no banco
class Tarefas(models.Model):
    STATUS_CHOICES = [
        ("PENDENTE", "Pendente"),
        ("EM_ANDAMENTO", "Em andamento"),
        ("CONCLUIDA", "Concluída"),
    ]

    nome_tarefa = models.CharField(max_length=255)
    prazo_tarefa = models.DateField()
    reponsavel_tarefa = models.CharField(max_length=255, default='nao_atribuido')
    observacoes = models.CharField(max_length=500)
    status_tarefa = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDENTE"
    )

    def __str__(self):
        return self.nome_tarefa
    
    