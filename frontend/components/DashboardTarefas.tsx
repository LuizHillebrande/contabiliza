"use client";

import { useMemo, useState } from "react";

import ScrollableTablePanel from "@/components/ScrollableTablePanel";
import { type Tarefa } from "@/lib/api";

type DashboardTarefasProps = {
  tarefas: Tarefa[];
};

const ITENS_POR_PAGINA = 10;

const statusLabels: Record<Tarefa["status_tarefa"], string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

function formatarData(valor: string | null | undefined) {
  if (!valor) {
    return "--";
  }

  const match = String(valor).match(/(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return "--";
  }

  const [, ano, mes, dia] = match;
  return `${dia}.${mes}.${ano}`;
}

function textoOuTraco(valor: string | null | undefined) {
  const texto = String(valor ?? "").trim();
  return texto || "--";
}

function dataPrazo(valor: string) {
  const match = String(valor).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }
  return new Date(`${match[1]}-${match[2]}-${match[3]}T23:59:59`);
}

function tarefaUrgente(tarefa: Tarefa, agora: Date) {
  if (tarefa.status_tarefa === "CONCLUIDA") {
    return false;
  }

  const prazo = dataPrazo(tarefa.prazo_tarefa);
  if (!prazo) {
    return false;
  }

  return prazo.getTime() <= agora.getTime();
}

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

export default function DashboardTarefas({ tarefas }: DashboardTarefasProps) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const stats = useMemo(() => {
    const agora = new Date();
    let concluidas = 0;
    let pendentes = 0;
    let urgentes = 0;

    for (const tarefa of tarefas) {
      if (tarefa.status_tarefa === "CONCLUIDA") {
        concluidas += 1;
      }

      if (tarefa.status_tarefa === "PENDENTE") {
        pendentes += 1;
      }

      if (tarefaUrgente(tarefa, agora)) {
        urgentes += 1;
      }
    }

    return {
      total: tarefas.length,
      concluidas,
      pendentes,
      urgentes,
    };
  }, [tarefas]);

  const tarefasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return tarefas;
    }

    return tarefas.filter((tarefa) => {
      const nome = String(tarefa.nome_tarefa ?? "").toLowerCase();
      const responsavel = String(tarefa.reponsavel_tarefa ?? "").toLowerCase();
      const observacoes = String(tarefa.observacoes ?? "").toLowerCase();
      const status = statusLabels[tarefa.status_tarefa].toLowerCase();

      return (
        nome.includes(termo) ||
        responsavel.includes(termo) ||
        observacoes.includes(termo) ||
        status.includes(termo)
      );
    });
  }, [busca, tarefas]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(tarefasFiltradas.length / ITENS_POR_PAGINA)
  );

  const paginaAtual = Math.min(Math.max(pagina, 1), totalPaginas);

  const tarefasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return tarefasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [tarefasFiltradas, paginaAtual]);

  const paginas = paginasVisiveis(paginaAtual, totalPaginas);

  return (
    <section className="dashboard-page">
      <header className="dashboard-page-header">
        <h1>Bem vindo, Usuário!</h1>
      </header>

      <div className="empresas-stats">
        <article className="empresas-stat-card">
          <span>Total de tarefas</span>
          <strong>{stats.total}</strong>
        </article>

        <article className="empresas-stat-card">
          <span>Tarefas concluídas</span>
          <strong>{stats.concluidas}</strong>
        </article>

        <article className="empresas-stat-card">
          <span>Tarefas pendentes</span>
          <strong>{stats.pendentes}</strong>
        </article>

        <article className="empresas-stat-card">
          <span>Tarefas com urgência</span>
          <strong>{stats.urgentes}</strong>
        </article>
      </div>

      <div className="empresas-toolbar">
        <div className="empresas-toolbar-actions">
          <div className="empresas-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Search"
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(1);
              }}
            />
          </div>
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

        <button
          type="button"
          className="empresas-action-btn empresas-action-btn-disabled"
          disabled
          title="Caso de uso ainda não implementado"
        >
          <span aria-hidden="true">☆</span>
          Exportar Relatórios
        </button>
      </div>

      <ScrollableTablePanel
        isEmpty={tarefasPaginadas.length === 0}
        emptyMessage="Nenhuma tarefa encontrada."
      >
        <table className="empresas-table dashboard-tarefas-table">
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Responsável</th>
              <th>Observações</th>
              <th>Prazo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tarefasPaginadas.map((tarefa) => (
              <tr key={tarefa.id}>
                <td>{textoOuTraco(tarefa.nome_tarefa)}</td>
                <td>{textoOuTraco(tarefa.reponsavel_tarefa)}</td>
                <td>{textoOuTraco(tarefa.observacoes)}</td>
                <td>{formatarData(tarefa.prazo_tarefa)}</td>
                <td>
                  <span
                    className={`dashboard-status dashboard-status-${tarefa.status_tarefa.toLowerCase()}`}
                  >
                    {statusLabels[tarefa.status_tarefa]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableTablePanel>
    </section>
  );
}
