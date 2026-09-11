"use client";

import {
  type Tarefa,
  type TarefaPayload,
} from "@/lib/api";

type TarefaFormProps = {
  initialValues?: Partial<Tarefa>;
  submitLabel?: string;
  onSubmit: (payload: TarefaPayload) => Promise<void>;
  onCancel?: () => void;
};

const emptyValues: TarefaPayload = {
  nome_tarefa: "",
  prazo_tarefa: "",
  reponsavel_tarefa: "",
  observacoes: "",
  status_tarefa: "PENDENTE",
  ativo: true,
};

export default function TarefaForm({
  initialValues,
  submitLabel = "Salvar",
  onSubmit,
  onCancel,
}: TarefaFormProps) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload: TarefaPayload = {
      nome_tarefa: String(formData.get("nome_tarefa") ?? ""),
      prazo_tarefa: String(formData.get("prazo_tarefa") ?? ""),
      reponsavel_tarefa: String(formData.get("reponsavel_tarefa") ?? ""),
      observacoes: String(formData.get("observacoes") ?? ""),
      status_tarefa: String(formData.get("status_tarefa") ?? "PENDENTE") as Tarefa["status_tarefa"],
      ativo: initialValues?.ativo ?? true,
    };

    await onSubmit(payload);
  }

  const values = {
    ...emptyValues,
    ...initialValues,
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h2>{initialValues?.id ? "Editar tarefa" : "Criar nova tarefa"}</h2>

        <div className="input-group">
          <label htmlFor="nome_tarefa">Tarefa</label>
          <input
            id="nome_tarefa"
            name="nome_tarefa"
            type="text"
            defaultValue={values.nome_tarefa}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="reponsavel_tarefa">Responsável</label>
          <input
            id="reponsavel_tarefa"
            name="reponsavel_tarefa"
            type="text"
            defaultValue={values.reponsavel_tarefa}
            required //nao adianta nada se no backend o models tiver sem Blank=True
          />
        </div>

        <div className="input-group">
          <label htmlFor="observacoes">Observações</label>
          <input
            id="observacoes"
            name="observacoes"
            type="text"
            defaultValue={values.observacoes}
          />
        </div>

        <div className="input-group">
          <label htmlFor="prazo_tarefa">Prazo</label>
          <input
            id="prazo_tarefa"
            name="prazo_tarefa"
            type="date"
            defaultValue={values.prazo_tarefa}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="status_tarefa">Status</label>
          <select
            id="status_tarefa"
            name="status_tarefa"
            defaultValue={values.status_tarefa}
          >
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {submitLabel}
          </button>

          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
