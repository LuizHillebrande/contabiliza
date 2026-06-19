from rest_framework.viewsets import ModelViewSet

from .models import Tarefas
from .serializers import TarefaSerializer


class TarefaViewSet(ModelViewSet):
    queryset = Tarefas.objects.all()
    serializer_class = TarefaSerializer
