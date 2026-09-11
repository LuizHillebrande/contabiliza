"use client";

import { useMemo, useState } from "react";
import EmpresaTable from "@/app/empresas/EmpresaTable";
import {
  type Certificado,
  type Empresas,
  baixarModeloExcelEmpresas,
  createEmpresa,
  importarCertificado,
  importarEmpresas,
  inativarEmpresa,
  updateEmpresa,
  reativarEmpresa,
} from "@/lib/api";

type EmpresasManagerProps = {
  empresas: Empresas[];
  certificados: Certificado[];
};

const ITENS_POR_PAGINA = 10;

function certificadoEstaValido(certificado: Certificado, agora: Date) {
  if (!certificado.valid_until) {
    return null;
  }

  return new Date(certificado.valid_until) >= agora;
}

function montarVencimentos(certificados: Certificado[]) {
  const vencimentos: Record<number, string | null> = {};

  for (const certificado of certificados) {
    if (certificado.is_active && certificado.valid_until) {
      vencimentos[certificado.empresa] = certificado.valid_until;
    }
  }

  for (const certificado of certificados) {
    if (
      vencimentos[certificado.empresa] == null &&
      certificado.valid_until
    ) {
      vencimentos[certificado.empresa] = certificado.valid_until;
    }
  }

  return vencimentos;
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

function empresaCorrespondeBusca(empresa: Empresas, busca: string) {
  const termo = busca.trim().toLowerCase();

  if (!termo) {
    return true;
  }

  const razao = String(empresa.razao_social ?? "").toLowerCase();
  const cnpj = String(empresa.cnpj ?? "");
  const regime = String(empresa.regime ?? "").toLowerCase();
  const cnpjTermo = termo.replace(/\D/g, "");

  return (
    razao.includes(termo) ||
    regime.includes(termo) ||
    cnpj.includes(termo) ||
    (cnpjTermo.length > 0 && cnpj.includes(cnpjTermo))
  );
}

export default function EmpresasManager({
  empresas,
  certificados,
}: EmpresasManagerProps) {
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<"ativas" | "inativas" | "todas">(
    "ativas"
  );
  const [pagina, setPagina] = useState(1);
  const [listaEmpresas, setListaEmpresas] = useState<Empresas[]>(empresas);

  const [modalAberto, setModalAberto] = useState(false);
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState<Empresas | null>(
    null
  );
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [regime, setRegime] = useState("");

  const vencimentosPorEmpresa = useMemo(
    () => montarVencimentos(certificados),
    [certificados]
  );

  const statsCertificados = useMemo(() => {
    const agora = new Date();
    let validos = 0;
    let vencidos = 0;

    for (const certificado of certificados) {
      const status = certificadoEstaValido(certificado, agora);

      if (status === true) {
        validos += 1;
      } else if (status === false) {
        vencidos += 1;
      }
    }

    return { validos, vencidos, total: certificados.length };
  }, [certificados]);

  const empresasFiltradas = useMemo(
    () =>
      listaEmpresas.filter((empresa) => {
        const ativa = empresa.ativo !== false;

        if (filtroAtivo === "ativas" && !ativa) {
          return false;
        }
        if (filtroAtivo === "inativas" && ativa) {
          return false;
        }

        return empresaCorrespondeBusca(empresa, busca);
      }),
    [busca, filtroAtivo, listaEmpresas]
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(empresasFiltradas.length / ITENS_POR_PAGINA)
  );

  // Se o filtro reduzir as páginas, só ajusta o índice exibido — sem resetar a busca.
  const paginaAtual = Math.min(Math.max(pagina, 1), totalPaginas);

  const empresasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return empresasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [empresasFiltradas, paginaAtual]);

  const paginas = paginasVisiveis(paginaAtual, totalPaginas);

  async function handleSalvarEmpresa() {
    if (!razaoSocial.trim() || !cnpj.trim() || !regime.trim()) {
      alert("Preencha os campos obrigatórios: Razão Social, CNPJ e Regime.");
      return;
    }

    try {
      const payload = {
        razao_social: razaoSocial,
        cnpj: cnpj.replace(/\D/g, ""),
        regime: regime.trim(),
        ativo: empresaEmEdicao?.ativo ?? true,
      };

      if (empresaEmEdicao) {
        const empresaAtualizada = await updateEmpresa(
          empresaEmEdicao.id,
          payload
        );

        setListaEmpresas((empresasAtuais) =>
          empresasAtuais.map((empresa) =>
            empresa.id === empresaAtualizada.id ? empresaAtualizada : empresa
          )
        );
      } else {
        const novaEmpresa = await createEmpresa(payload);

        setListaEmpresas((empresasAtuais) => [novaEmpresa, ...empresasAtuais]);
        setPagina(1);
      }

      fecharModal();
    } catch (error) {
      console.error(error);
      alert(
        empresaEmEdicao
          ? "Erro ao editar empresa."
          : "Erro ao criar empresa."
      );
    }
  }

  function handleEditar(empresa: Empresas) {
    setEmpresaEmEdicao(empresa);
    setRazaoSocial(empresa.razao_social);
    setCnpj(String(empresa.cnpj ?? ""));
    setRegime(empresa.regime ?? "");
    setModalAberto(true);
  }

  async function handleExcluir(empresa: Empresas) {
    const confirmar = window.confirm(
      `Deseja inativar a empresa "${empresa.razao_social}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await inativarEmpresa(empresa.id);

      setListaEmpresas((empresasAtuais) =>
        empresasAtuais.map((empresaAtual) =>
          empresaAtual.id === empresa.id
            ? { ...empresaAtual, ativo: false }
            : empresaAtual
        )
      );
    } catch (error) {
      console.error(error);
      alert("Erro ao inativar empresa.");
    }
  }

  async function handleReativar(empresa: Empresas) {
    const confirmar = window.confirm(
      `Deseja reativar a empresa "${empresa.razao_social}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await reativarEmpresa(empresa.id);

      setListaEmpresas((empresasAtuais) =>
        empresasAtuais.map((empresaAtual) =>
          empresaAtual.id === empresa.id
            ? { ...empresaAtual, ativo: true }
            : empresaAtual
        )
      );
    } catch (error) {
      console.error(error);
      alert("Erro ao reativar empresa.");
    }
  }

  async function handleImportar(arquivo: File) {
    try {
      const data = await importarEmpresas(arquivo);
      const extras =
        data.erros && data.erros.length > 0
          ? `\n\nAvisos:\n${data.erros.slice(0, 8).join("\n")}`
          : "";
      alert(`${data.mensagem}${extras}`);
      window.location.reload();
    } catch (error) {
      console.error(error);
      const mensagem =
        error instanceof Error ? error.message : "Erro ao importar empresas.";
      alert(mensagem);
    }
  }

  async function handleBaixarModelo() {
    try {
      await baixarModeloExcelEmpresas();
    } catch (error) {
      console.error(error);
      alert("Erro ao baixar o modelo Excel.");
    }
  }

  async function handleImportarCertificados(arquivos: FileList) {
    const linhas: string[] = [];
    let algumSucesso = false;

    for (const arquivo of Array.from(arquivos)) {
      try {
        const data = await importarCertificado(arquivo);

        for (const item of data.itens) {
          const marca = item.status === "erro" ? "✗" : "✓";
          linhas.push(`${marca} ${item.arquivo}\n   ${item.mensagem}`);

          if (item.status !== "erro") {
            algumSucesso = true;
          }
        }

        if (data.itens.length === 0) {
          linhas.push(`• ${arquivo.name}: ${data.mensagem}`);
        }
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao importar.";
        linhas.push(`✗ ${arquivo.name}\n   ${mensagem}`);
      }
    }

    alert(linhas.join("\n\n"));

    if (algumSucesso) {
      window.location.reload();
    }
  }

  function abrirNovaEmpresa() {
    setEmpresaEmEdicao(null);
    setRazaoSocial("");
    setCnpj("");
    setRegime("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEmpresaEmEdicao(null);
    setRazaoSocial("");
    setCnpj("");
    setRegime("");
  }

  return (
    <section className="empresas-page">
      <header className="empresas-page-header">
        <h1>Gerenciar Empresas</h1>
        <p>Empresas</p>
      </header>

      <div className="empresas-stats">
        <article className="empresas-stat-card">
          <span>Total de empresas</span>
          <strong>{listaEmpresas.length}</strong>
        </article>

        <article className="empresas-stat-card">
          <span>Certificados Digitais Válidos</span>
          <strong>{statsCertificados.validos}</strong>
        </article>

        <article className="empresas-stat-card">
          <span>Certificados vencidos</span>
          <strong>{statsCertificados.vencidos}</strong>
        </article>

        <article className="empresas-stat-card">
          <span>Total de certificados</span>
          <strong>{statsCertificados.total}</strong>
        </article>
      </div>

      <div className="empresas-toolbar">
        <div className="empresas-toolbar-actions">
          <div className="empresas-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Buscar por razão social ou CNPJ..."
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(1);
              }}
            />
          </div>

          <select
            className="empresas-filter-select"
            value={filtroAtivo}
            aria-label="Filtrar por situação"
            onChange={(event) => {
              setFiltroAtivo(
                event.target.value as "ativas" | "inativas" | "todas"
              );
              setPagina(1);
            }}
          >
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
            <option value="todas">Todas</option>
          </select>

          <button
            type="button"
            className="empresas-action-btn"
            onClick={abrirNovaEmpresa}
          >
            <span aria-hidden="true">👤+</span>
            Adicionar nova empresa
          </button>

          <button
            type="button"
            className="empresas-action-btn"
            onClick={handleBaixarModelo}
          >
            <span aria-hidden="true">⇩</span>
            Baixar modelo Excel
          </button>

          <label className="empresas-action-btn" style={{ cursor: "pointer" }}>
            <span aria-hidden="true">⇪</span>
            Importar Excel
            <input
              type="file"
              accept=".xlsx,.xlsm"
              style={{ display: "none" }}
              onChange={(event) => {
                const arquivo = event.target.files?.[0];
                if (arquivo) {
                  handleImportar(arquivo);
                }
                event.target.value = "";
              }}
            />
          </label>

          <label className="empresas-action-btn" style={{ cursor: "pointer" }}>
            <span aria-hidden="true">⇪</span>
            Importar certificados
            <input
              type="file"
              accept=".pfx,.p12"
              multiple
              style={{ display: "none" }}
              onChange={(event) => {
                const arquivos = event.target.files;
                if (arquivos && arquivos.length > 0) {
                  handleImportarCertificados(arquivos);
                }
                event.target.value = "";
              }}
            />
          </label>

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

      <EmpresaTable
        empresas={empresasPaginadas}
        vencimentosPorEmpresa={vencimentosPorEmpresa}
        onEditar={handleEditar}
        onExcluir={handleExcluir}
        onReativar={handleReativar}
      />

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content empresas-modal">
            <h3>{empresaEmEdicao ? "Editar Empresa" : "Nova Empresa"}</h3>

            <div className="empresas-modal-field">
              <label htmlFor="empresa-razao">
                Razão Social <span className="required-mark">*</span>
              </label>
              <input
                id="empresa-razao"
                type="text"
                placeholder="Razão Social"
                value={razaoSocial}
                required
                onChange={(event) => setRazaoSocial(event.target.value)}
              />
            </div>

            <div className="empresas-modal-field">
              <label htmlFor="empresa-cnpj">
                CNPJ <span className="required-mark">*</span>
              </label>
              <input
                id="empresa-cnpj"
                type="text"
                placeholder="CNPJ"
                value={cnpj}
                required
                onChange={(event) => setCnpj(event.target.value)}
              />
            </div>

            <div className="empresas-modal-field">
              <label htmlFor="empresa-regime">
                Regime <span className="required-mark">*</span>
              </label>
              <select
                id="empresa-regime"
                value={regime}
                required
                onChange={(event) => setRegime(event.target.value)}
              >
                <option value="">Selecione o regime</option>
                <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO_REAL">Lucro Real</option>
                <option value="MEI">MEI</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={fecharModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleSalvarEmpresa}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
