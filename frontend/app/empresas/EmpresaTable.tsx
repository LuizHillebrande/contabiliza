"use client";

import ScrollableTablePanel from "@/components/ScrollableTablePanel";
import { type Empresas } from "@/lib/api";

type EmpresaTableProps = {
  empresas: Empresas[];
  vencimentosPorEmpresa: Record<number, string | null>;
  onEditar: (empresa: Empresas) => void;
  onExcluir: (empresa: Empresas) => void;
  onReativar: (empresa: Empresas) => void;
};

/** Aceita ISO, "2026-09-04 09:41:16.759 -0300" e similares → DD.MM.YYYY */
function formatarData(valor: string | null | undefined) {
  if (!valor) {
    return "—";
  }

  const match = String(valor).match(/(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return "—";
  }

  const [, ano, mes, dia] = match;
  return `${dia}.${mes}.${ano}`;
}

export default function EmpresaTable({
  empresas,
  vencimentosPorEmpresa,
  onEditar,
  onExcluir,
  onReativar,
}: EmpresaTableProps) {
  return (
    <ScrollableTablePanel
      isEmpty={empresas.length === 0}
      emptyMessage="Nenhuma empresa encontrada."
    >
      <table className="empresas-table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Data da importação</th>
            <th>Regime</th>
            <th>Certificado</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {empresas.map((empresa) => (
            <tr key={empresa.id}>
              <td>
                {empresa.razao_social}
                <br />
                <br />
                <p>CNPJ:{empresa.cnpj}</p>
              </td>
              <td>{formatarData(empresa.data_importacao)}</td>
              <td>{empresa.regime?.trim() ? empresa.regime : "—"}</td>
              <td>
                {formatarData(vencimentosPorEmpresa[empresa.id] ?? null)}
              </td>
              <td className="tarefas-table-action">
                <button
                  type="button"
                  className="icon-btn icon-btn-edit"
                  aria-label={`Editar ${empresa.razao_social}`}
                  onClick={() => onEditar(empresa)}
                >
                  ✎
                </button>

                {empresa.ativo && (
                  <button
                    type="button"
                    className="icon-btn icon-btn-delete"
                    aria-label={`Inativar ${empresa.razao_social}`}
                    onClick={() => onExcluir(empresa)}
                  >
                    ×
                  </button>
                )}

                {!empresa.ativo && (
                  <button
                    type="button"
                    className="icon-btn icon-btn-reactivate"
                    aria-label={`Reativar ${empresa.razao_social}`}
                    onClick={() => onReativar(empresa)}
                  >
                    🔄
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableTablePanel>
  );
}
