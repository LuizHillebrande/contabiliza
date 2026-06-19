from rest_framework.serializers import ModelSerializer

from .models import Tarefas


class TarefaSerializer(ModelSerializer):
    class Meta:
        model = Tarefas
        fields = [
            'id',
            'nome_tarefa',
            'prazo_tarefa',
            'reponsavel_tarefa',
            'observacoes',
            'status_tarefa',
        ]
