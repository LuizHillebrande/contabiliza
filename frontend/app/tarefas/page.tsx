import TarefasManager from "@/components/tarefas/TarefasManager";
import { getTarefas } from "@/lib/api";

export default async function TarefasPage() {
  try {
    const tarefas = await getTarefas();
    return <TarefasManager initialTarefas={tarefas} />;
  } catch {
    return <p>Erro ao carregar tarefas. Verifique se o backend está rodando.</p>;
  }
}
