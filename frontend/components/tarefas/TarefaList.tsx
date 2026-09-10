import { type ReactNode } from "react";

import { type Tarefa } from "@/lib/api";

const statusLabels: Record<Tarefa["status_tarefa"], string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

type TarefaListProps = {
  tarefas: Tarefa[];
  renderActions?: (tarefa: Tarefa) => ReactNode;
};

export default function TarefaList({
  tarefas,
  renderActions,
}: TarefaListProps) {
  if (tarefas.length === 0) {
    return <p>Nenhuma tarefa cadastrada.</p>;
  }

  return (
    <ul className="tarefa-list">
      {tarefas.map((tarefa) => (
        <li key={tarefa.id} className="tarefa-item">
          <div className="tarefa-item-content">
            <strong>{tarefa.nome_tarefa}</strong>
            <p>Prazo: {tarefa.prazo_tarefa}</p>
            <p>Responsável: {tarefa.reponsavel_tarefa}</p>
            <p>Status: {statusLabels[tarefa.status_tarefa]}</p>
            {tarefa.observacoes && <p>Observações: {tarefa.observacoes}</p>}
          </div>

          {renderActions && (
            <div className="tarefa-item-actions">{renderActions(tarefa)}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
