"use client";

import { useEffect, useRef, useState } from "react";

import ScrollableTablePanel from "@/components/ScrollableTablePanel";
import { type Tarefa, type TarefaPayload } from "@/lib/api";

type TarefaTableProps = {
  tarefas: Tarefa[];
  carregando?: boolean;
  onSalvar: (payload: TarefaPayload, id?: number) => Promise<boolean>;
  onExcluir: (tarefa: Tarefa) => void;
  onReativar: (tarefa: Tarefa) => void;
};

type TarefaDraft = Omit<TarefaPayload, "ativo">;

const emptyDraft: TarefaDraft = {
  nome_tarefa: "",
  prazo_tarefa: "",
  reponsavel_tarefa: "",
  observacoes: "",
  status_tarefa: "PENDENTE",
};

const statusLabels: Record<Tarefa["status_tarefa"], string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

function formatarPrazo(prazo: string) {
  const match = String(prazo).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return "—";
  }
  const [, ano, mes, dia] = match;
  return `${dia}.${mes}.${ano}`;
}

function tarefaParaDraft(tarefa: Tarefa): TarefaDraft {
  return {
    nome_tarefa: tarefa.nome_tarefa,
    prazo_tarefa: tarefa.prazo_tarefa,
    reponsavel_tarefa: tarefa.reponsavel_tarefa,
    observacoes: tarefa.observacoes,
    status_tarefa: tarefa.status_tarefa,
  };
}

function draftValido(draft: TarefaDraft) {
  return Boolean(
    draft.nome_tarefa.trim() &&
      draft.reponsavel_tarefa.trim() &&
      draft.prazo_tarefa
  );
}

type InlineFieldsProps = {
  draft: TarefaDraft;
  autoFocus?: boolean;
  onChange: (draft: TarefaDraft) => void;
};

function InlineFields({ draft, autoFocus, onChange }: InlineFieldsProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      firstInputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <>
      <td>
        <label className="tarefas-inline-label">
          Tarefa <span className="required-mark">*</span>
        </label>
        <input
          ref={firstInputRef}
          className="tarefas-inline-input"
          type="text"
          placeholder="Nome da tarefa"
          value={draft.nome_tarefa}
          required
          onChange={(event) =>
            onChange({ ...draft, nome_tarefa: event.target.value })
          }
        />
      </td>
      <td>
        <label className="tarefas-inline-label">
          Responsável <span className="required-mark">*</span>
        </label>
        <input
          className="tarefas-inline-input"
          type="text"
          placeholder="Responsável"
          value={draft.reponsavel_tarefa}
          required
          onChange={(event) =>
            onChange({ ...draft, reponsavel_tarefa: event.target.value })
          }
        />
      </td>
      <td>
        <label className="tarefas-inline-label">Observações</label>
        <input
          className="tarefas-inline-input"
          type="text"
          placeholder="Observações"
          value={draft.observacoes}
          onChange={(event) =>
            onChange({ ...draft, observacoes: event.target.value })
          }
        />
      </td>
      <td>
        <label className="tarefas-inline-label">
          Prazo <span className="required-mark">*</span>
        </label>
        <input
          className="tarefas-inline-input"
          type="date"
          value={draft.prazo_tarefa}
          required
          onChange={(event) =>
            onChange({ ...draft, prazo_tarefa: event.target.value })
          }
        />
      </td>
      <td>
        <label className="tarefas-inline-label">Status</label>
        <select
          className="tarefas-inline-input"
          value={draft.status_tarefa}
          onChange={(event) =>
            onChange({
              ...draft,
              status_tarefa: event.target.value as Tarefa["status_tarefa"],
            })
          }
        >
          <option value="PENDENTE">Pendente</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDA">Concluída</option>
        </select>
      </td>
    </>
  );
}

export default function TarefaTable({
  tarefas,
  carregando = false,
  onSalvar,
  onExcluir,
  onReativar,
}: TarefaTableProps) {
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [draftEdicao, setDraftEdicao] = useState<TarefaDraft>(emptyDraft);
  const [draftNova, setDraftNova] = useState<TarefaDraft>(emptyDraft);

  function iniciarEdicao(tarefa: Tarefa) {
    setEditandoId(Number(tarefa.id));
    setDraftEdicao(tarefaParaDraft(tarefa));
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setDraftEdicao({ ...emptyDraft });
  }

  async function salvarEdicao() {
    if (editandoId === null || !draftValido(draftEdicao)) {
      return;
    }

    const tarefaAtual = tarefas.find(
      (item) => Number(item.id) === Number(editandoId)
    );

    const salvou = await onSalvar(
      { ...draftEdicao, ativo: tarefaAtual?.ativo ?? true },
      editandoId
    );

    if (salvou) {
      cancelarEdicao();
    }
  }

  async function salvarNova() {
    if (!draftValido(draftNova)) {
      return;
    }

    const salvou = await onSalvar({ ...draftNova, ativo: true });

    if (salvou) {
      setDraftNova({ ...emptyDraft });
    }
  }

  return (
    <ScrollableTablePanel>
      <table className="empresas-table">
        <thead>
          <tr>
            <th>
              Tarefa <span className="required-mark">*</span>
            </th>
            <th>
              Responsável <span className="required-mark">*</span>
            </th>
            <th>Observações</th>
            <th>
              Prazo <span className="required-mark">*</span>
            </th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tarefas.length === 0 && (
            <tr>
              <td colSpan={6} className="tarefas-empty">
                Nenhuma tarefa encontrada. Use a linha abaixo para criar.
              </td>
            </tr>
          )}

          {tarefas.map((tarefa) =>
            Number(editandoId) === Number(tarefa.id) ? (
              <tr key={tarefa.id} className="tarefas-row-editing">
                <InlineFields
                  draft={draftEdicao}
                  autoFocus
                  onChange={setDraftEdicao}
                />
                <td className="tarefas-table-action">
                  <button
                    type="button"
                    className="icon-btn icon-btn-save"
                    aria-label="Salvar alterações"
                    disabled={carregando || !draftValido(draftEdicao)}
                    onClick={salvarEdicao}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-cancel"
                    aria-label="Cancelar edição"
                    disabled={carregando}
                    onClick={cancelarEdicao}
                  >
                    ↩
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={tarefa.id}>
                <td>{tarefa.nome_tarefa}</td>
                <td>{tarefa.reponsavel_tarefa}</td>
                <td>{tarefa.observacoes || "—"}</td>
                <td>{formatarPrazo(tarefa.prazo_tarefa)}</td>
                <td>{statusLabels[tarefa.status_tarefa]}</td>
                <td className="tarefas-table-action">
                  <button
                    type="button"
                    className="icon-btn icon-btn-edit"
                    aria-label={`Editar ${tarefa.nome_tarefa}`}
                    disabled={carregando}
                    onClick={() => iniciarEdicao(tarefa)}
                  >
                    ✎
                  </button>

                  {tarefa.ativo !== false ? (
                    <button
                      type="button"
                      className="icon-btn icon-btn-delete"
                      aria-label={`Inativar ${tarefa.nome_tarefa}`}
                      disabled={carregando}
                      onClick={() => onExcluir(tarefa)}
                    >
                      ×
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="icon-btn icon-btn-reactivate"
                      aria-label={`Reativar ${tarefa.nome_tarefa}`}
                      disabled={carregando}
                      onClick={() => onReativar(tarefa)}
                    >
                      🔄
                    </button>
                  )}
                </td>
              </tr>
            )
          )}

          <tr className="tarefas-row-create">
            <InlineFields draft={draftNova} onChange={setDraftNova} />
            <td className="tarefas-table-action">
              <button
                type="button"
                className="icon-btn icon-btn-save"
                aria-label="Criar tarefa"
                disabled={carregando || !draftValido(draftNova)}
                onClick={salvarNova}
              >
                +
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-cancel"
                aria-label="Limpar nova tarefa"
                disabled={carregando}
                onClick={() => setDraftNova({ ...emptyDraft })}
              >
                ↩
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </ScrollableTablePanel>
  );
}
