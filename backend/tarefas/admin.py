from django.contrib import admin

from .models import Tarefas


@admin.register(Tarefas) #notacao p registrar tarefas via admin
class TarefasAdmin(admin.ModelAdmin):
    list_display = ('nome_tarefa', 'prazo_tarefa', 'reponsavel_tarefa', 'status_tarefa')
    list_filter = ('status_tarefa',)
    search_fields = ('nome_tarefa', 'reponsavel_tarefa')
