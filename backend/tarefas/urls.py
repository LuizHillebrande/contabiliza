from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TarefaViewSet

router = DefaultRouter()
router.register('tarefas', TarefaViewSet) #cria os métodos get put delete, etc

urlpatterns = [
    path('', include(router.urls)), #inclui as rotas
]
