"use client";

import { useMemo, useState } from "react";

import TarefaTable from "@/components/tarefas/TarefaTable";
import {
  createTarefa,
  deleteTarefa,
  reativarTarefa,
  updateTarefa,
  type Tarefa,
  type TarefaPayload,
} from "@/lib/api";

type TarefasManagerProps = {
  initialTarefas: Tarefa[];
};

const ITENS_POR_PAGINA = 10;

type FiltroAtivo = "ativas" | "inativas" | "todas";
type FiltroStatus = "TODOS" | Tarefa["status_tarefa"];

function paginasVisiveis(pagina: number, totalPaginas: number) {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, index) => index + 1);
  }

  const paginas = new Set<number>([1, totalPaginas, pagina]);

  for (let offset = 1; offset <= 2; offset += 1) {
    if (pagina - offset > 1) {
      paginas.add(pagina - offset);
    }
    if (pagina + offset < totalPaginas) {
      paginas.add(pagina + offset);
    }
  }

  return Array.from(paginas).sort((a, b) => a - b);
}

export default function TarefasManager({ initialTarefas }: TarefasManagerProps) {
  const [tarefas, setTarefas] = useState(initialTarefas);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("TODOS");
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>("ativas");
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState<Tarefa | null>(
    null
  );

  const tarefasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return tarefas.filter((tarefa) => {
      const ativa = tarefa.ativo !== false;

      if (filtroAtivo === "ativas" && !ativa) {
        return false;
      }
      if (filtroAtivo === "inativas" && ativa) {
        return false;
      }
      if (filtroStatus !== "TODOS" && tarefa.status_tarefa !== filtroStatus) {
        return false;
      }
      if (!termo) {
        return true;
      }

      return (
        tarefa.nome_tarefa.toLowerCase().includes(termo) ||
        tarefa.reponsavel_tarefa.toLowerCase().includes(termo) ||
        String(tarefa.observacoes ?? "")
          .toLowerCase()
          .includes(termo)
      );
    });
  }, [busca, filtroAtivo, filtroStatus, tarefas]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(tarefasFiltradas.length / ITENS_POR_PAGINA)
  );

  const paginaAtual = Math.min(Math.max(pagina, 1), totalPaginas);

  const tarefasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return tarefasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [paginaAtual, tarefasFiltradas]);

  const paginas = paginasVisiveis(paginaAtual, totalPaginas);

  async function salvarTarefa(
    payload: TarefaPayload,
    id?: number
  ): Promise<boolean> {
    setCarregando(true);
    setErro(null);

    try {
      if (id !== undefined) {
        const atualizada = await updateTarefa(id, payload);
        setTarefas((lista) =>
          lista.map((item) =>
            Number(item.id) === Number(id)
              ? { ...atualizada, id: Number(item.id) }
              : item
          )
        );
      } else {
        const criada = await createTarefa(payload);
        setTarefas((lista) => [criada, ...lista]);
        setPagina(1);
      }

      return true;
    } catch {
      setErro("Não foi possível salvar a tarefa. Tente novamente.");
      return false;
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarExclusao() {
    if (!tarefaParaExcluir) {
      return;
    }

    const tarefa = tarefaParaExcluir;
    setErro(null);
    setCarregando(true);

    try {
      await deleteTarefa(tarefa.id);
      setTarefas((lista) =>
        lista.map((item) =>
          Number(item.id) === Number(tarefa.id)
            ? { ...item, ativo: false }
            : item
        )
      );
      setTarefaParaExcluir(null);
    } catch {
      setErro("Não foi possível inativar a tarefa. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleReativar(tarefa: Tarefa) {
    const confirmar = window.confirm(
      `Deseja reativar a tarefa "${tarefa.nome_tarefa}"?`
    );

    if (!confirmar) {
      return;
    }

    setErro(null);
    setCarregando(true);

    try {
      await reativarTarefa(tarefa.id);
      setTarefas((lista) =>
        lista.map((item) =>
          Number(item.id) === Number(tarefa.id)
            ? { ...item, ativo: true }
            : item
        )
      );
    } catch {
      setErro("Não foi possível reativar a tarefa. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="empresas-page">
      <header className="empresas-page-header">
        <h1>Gerenciar Tarefas</h1>
        <p>Tarefas</p>
      </header>

      {erro && (
        <div className="tarefas-alert" role="alert">
          <span>{erro}</span>
          <button
            type="button"
            className="tarefas-alert-close"
            aria-label="Fechar aviso"
            onClick={() => setErro(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="empresas-toolbar">
        <div className="empresas-toolbar-actions">
          <div className="empresas-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Buscar tarefa..."
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(1);
              }}
            />
          </div>

          <select
            className="empresas-filter-select"
            value={filtroStatus}
            aria-label="Filtrar por status"
            onChange={(event) => {
              setFiltroStatus(event.target.value as FiltroStatus);
              setPagina(1);
            }}
          >
            <option value="TODOS">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>

          <select
            className="empresas-filter-select"
            value={filtroAtivo}
            aria-label="Filtrar por situação"
            onChange={(event) => {
              setFiltroAtivo(event.target.value as FiltroAtivo);
              setPagina(1);
            }}
          >
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
            <option value="todas">Todas</option>
          </select>
        </div>

        <div className="empresas-pagination">
          <button
            type="button"
            className="page-btn"
            aria-label="Página anterior"
            disabled={paginaAtual <= 1}
            onClick={() => setPagina(paginaAtual - 1)}
          >
            ‹
          </button>

          {paginas.map((numero, index) => {
            const anterior = paginas[index - 1];
            const mostrarEllipsis =
              anterior !== undefined && numero - anterior > 1;

            return (
              <span key={numero} className="empresas-pagination-item">
                {mostrarEllipsis && <span className="page-ellipsis">…</span>}
                <button
                  type="button"
                  className={`page-btn${
                    paginaAtual === numero ? " page-btn-active" : ""
                  }`}
                  onClick={() => setPagina(numero)}
                >
                  {numero}
                </button>
              </span>
            );
          })}

          <button
            type="button"
            className="page-btn"
            aria-label="Próxima página"
            disabled={paginaAtual >= totalPaginas}
            onClick={() => setPagina(paginaAtual + 1)}
          >
            ›
          </button>
        </div>
      </div>

      <TarefaTable
        tarefas={tarefasPaginadas}
        carregando={carregando}
        onSalvar={salvarTarefa}
        onExcluir={setTarefaParaExcluir}
        onReativar={handleReativar}
      />

      {tarefaParaExcluir && (
        <div
          className="tarefas-modal-overlay"
          role="presentation"
          onClick={() => !carregando && setTarefaParaExcluir(null)}
        >
          <div
            className="tarefas-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tarefas-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="tarefas-modal-title">Inativar tarefa</h3>
            <p>
              Tem certeza que deseja inativar{" "}
              <strong>{tarefaParaExcluir.nome_tarefa}</strong>?
            </p>

            <div className="tarefas-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={carregando}
                onClick={() => setTarefaParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={carregando}
                onClick={confirmarExclusao}
              >
                {carregando ? "Inativando..." : "Inativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
