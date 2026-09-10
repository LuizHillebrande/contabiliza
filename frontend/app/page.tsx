import DashboardTarefas from "@/components/DashboardTarefas";
import { getTarefas } from "@/lib/api";

export default async function Home() {
  try {
    const tarefas = await getTarefas();

    return <DashboardTarefas tarefas={tarefas} />;
  } catch {
    return (
      <p>
        Não foi possível conectar ao backend. Verifique se o Django está
        rodando.
      </p>
    );
  }
}
