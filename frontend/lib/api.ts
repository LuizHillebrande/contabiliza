const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"; //porta da API backend 8000 django
console.log("API_URL:", API_URL);
//arquivo de chamada das API
export type Tarefa = {
  id: number;
  nome_tarefa: string;
  prazo_tarefa: string;
  reponsavel_tarefa: string;
  observacoes: string;
  status_tarefa: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA";
  ativo: boolean;
};

export type Empresas = {
  id: number;
  razao_social: string;
  cnpj: string; //tratar como string pra nao perder zero a esquerda
  ativo: boolean;
  regime: string;
  data_importacao?: string | null;
};

export type EmpresaPayload = {
  razao_social: string;
  cnpj: string;
  ativo: boolean;
  regime: string;
};

export type Certificado = {
  id: number;
  empresa: number;
  subject_cn: string;
  serial_number: string;
  original_filename: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  uploaded_by: number | null;
  created_at: string;
  updated_at: string;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detalhe = `${response.status} ${response.statusText}`;

    try {
      const body = await response.json();

      if (typeof body === "string") {
        detalhe = body;
      } else if (body?.detail) {
        detalhe = String(body.detail);
      } else if (body?.mensagem) {
        detalhe = String(body.mensagem);
      } else if (body?.arquivo) {
        // DRF: { arquivo: ["Envie um certificado..."] }
        const msgs = Array.isArray(body.arquivo)
          ? body.arquivo
          : [body.arquivo];
        detalhe = msgs.map(String).join(" ");
      } else if (typeof body === "object") {
        detalhe = Object.entries(body)
          .map(([campo, valor]) => {
            const texto = Array.isArray(valor)
              ? valor.map(String).join(" ")
              : String(valor);
            return `${campo}: ${texto}`;
          })
          .join("\n");
      }
    } catch {
      // mantém status/statusText
    }

    throw new Error(detalhe);
  }

  return response.json() as Promise<T>; //transforma em JSON
}

export async function getTarefas(): Promise<Tarefa[]> {
  const todas: Tarefa[] = [];
  let pagina = 1;
  let temProxima = true;

  while (temProxima) {
    const response = await fetch(`${API_URL}/tarefas/?page=${pagina}`, {
      cache: "no-store",
    });

    const data = await parseResponse<
      PaginatedResponse<Tarefa> | Tarefa[]
    >(response);

    if (Array.isArray(data)) {
      return data;
    }

    todas.push(...data.results);
    temProxima = Boolean(data.next);
    pagina += 1;
  }

  return todas;
}

export async function createTarefa(
  payload: Omit<Tarefa, "id">
): Promise<Tarefa> { //promesa
  const response = await fetch(`${API_URL}/tarefas/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Tarefa>(response);
}

export async function updateTarefa(
  id: number,
  payload: Omit<Tarefa, "id">
): Promise<Tarefa> {
  const response = await fetch(`${API_URL}/tarefas/${id}/`, { //pausa ate q o Django responda
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Tarefa>(response);
}

export async function deleteTarefa(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/tarefas/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: false }), //desativa
  }); 

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }
}

export async function reativarTarefa(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/tarefas/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: true }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }
}

export type TarefaPayload = Omit<Tarefa, "id">;


//getEmpresas
export async function getEmpresas(
  pagina: number = 1
): Promise<PaginatedResponse<Empresas>> {
  const response = await fetch(
    `${API_URL}/empresas/?page=${pagina}`,
    {
      cache: "no-store",
    }
  );

  return parseResponse<PaginatedResponse<Empresas>>(response);
}

// carrega todas as páginas (busca/filtro no cliente)
export async function getTodasEmpresas(): Promise<Empresas[]> {
  const todas: Empresas[] = [];
  let pagina = 1;
  let temProxima = true;

  while (temProxima) {
    const data = await getEmpresas(pagina);
    todas.push(...data.results);
    temProxima = Boolean(data.next);
    pagina += 1;
  }

  return todas;
}

//createEmpresa
export async function createEmpresa(
  payload: EmpresaPayload
): Promise<Empresas> {
  const response = await fetch(`${API_URL}/empresas/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Empresas>(response);
}

//up
export async function updateEmpresa(
  id: number,
  payload: EmpresaPayload
): Promise<Empresas> {
  const response = await fetch(`${API_URL}/empresas/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Empresas>(response);
}

//deleteEmpresa
export async function inativarEmpresa(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/empresas/${id}/`, {
    method: "PATCH", //soft delete, apenas desativa a empresa no banco de dados
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: false }), //desativa
  }); 

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }
}

//reativarEmpresa
export async function reativarEmpresa(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/empresas/${id}/`, {
    method: "PATCH", //soft delete, apenas reativa a empresa no banco de dados
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: true }), //ativa
  }); 

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }
}

//importar empresas
export async function importarEmpresas(arquivo: File) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  const response = await fetch(`${API_URL}/empresas/importar/`, {
    method: "POST",
    body: formData,
  });

  return parseResponse<{
    mensagem: string;
    empresas: Empresas[];
    erros?: string[];
  }>(response);
}

export async function baixarModeloExcelEmpresas(): Promise<void> {
  const response = await fetch(`${API_URL}/empresas/modelo-excel/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível baixar o modelo Excel.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo_importacao_empresas.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

//importar certificado A1 (.pfx / .p12)
export type ImportacaoCertificadoItem = {
  arquivo: string;
  status: string;
  mensagem: string;
  cnpj: string;
  razao_social: string;
};

export type ImportacaoCertificadoResultado = {
  mensagem: string;
  importados: number;
  atualizados: number;
  erros: number;
  itens: ImportacaoCertificadoItem[];
};

export async function importarCertificado(
  arquivo: File
): Promise<ImportacaoCertificadoResultado> {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  const response = await fetch(`${API_URL}/certificados/importar/`, {
    method: "POST",
    body: formData,
  });

  let data: ImportacaoCertificadoResultado | Record<string, unknown>;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Falha ao importar "${arquivo.name}" (${response.status} ${response.statusText}).`
    );
  }

  // Resposta do service com itens (200 ou 400)
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as ImportacaoCertificadoResultado).itens)
  ) {
    const resultado = data as ImportacaoCertificadoResultado;

    if (!response.ok || resultado.erros > 0) {
      const detalhes = resultado.itens
        .map((item) => `${item.arquivo}: ${item.mensagem}`)
        .join("\n");

      if (!resultado.importados && !resultado.atualizados) {
        throw new Error(detalhes || resultado.mensagem);
      }
    }

    return resultado;
  }

  // Validação DRF (ex.: extensão inválida)
  if (!response.ok) {
    const body = data as Record<string, unknown>;

    if (body.arquivo) {
      const msgs = Array.isArray(body.arquivo)
        ? body.arquivo.map(String)
        : [String(body.arquivo)];
      throw new Error(`${arquivo.name}: ${msgs.join(" ")}`);
    }

    if (body.detail) {
      throw new Error(`${arquivo.name}: ${String(body.detail)}`);
    }

    throw new Error(
      `${arquivo.name}: não foi possível importar (${response.status}).`
    );
  }

  throw new Error(`${arquivo.name}: resposta inesperada do servidor.`);
}

//get certificados (todas as páginas, para totais reais)
export async function getCertificados(): Promise<Certificado[]> {
  const todos: Certificado[] = [];
  let pagina = 1;
  let temProxima = true;

  while (temProxima) {
    const response = await fetch(
      `${API_URL}/certificados/?page=${pagina}`,
      { cache: "no-store" }
    );

    const data = await parseResponse<
      PaginatedResponse<Certificado> | Certificado[]
    >(response);

    if (Array.isArray(data)) {
      return data;
    }

    todos.push(...data.results);
    temProxima = Boolean(data.next);
    pagina += 1;
  }

  return todos;
}
