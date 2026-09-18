import { type ReactNode } from "react";

type ScrollableTablePanelProps = {
  children: ReactNode;
  /** Mensagem quando não há dados (opcional). */
  emptyMessage?: string;
  isEmpty?: boolean;
  className?: string;
};


export default function ScrollableTablePanel({
  children,
  emptyMessage = "Nenhum registro encontrado.",
  isEmpty = false,
  className = "",
}: ScrollableTablePanelProps) {
  return (
    <section
      className={`empresas-table-section scrollable-table-panel${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="scrollable-table-body">
        {isEmpty ? (
          <p className="tarefas-empty">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
