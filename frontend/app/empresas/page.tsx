import EmpresasManager from "@/components/EmpresasManager";
import { getCertificados, getTodasEmpresas } from "@/lib/api";

export default async function EmpresasPage() {
  try {
    const [empresas, certificados] = await Promise.all([
      getTodasEmpresas(),
      getCertificados(),
    ]);

    return (
      <EmpresasManager empresas={empresas} certificados={certificados} />
    );
  } catch {
    return (
      <p>
        Não foi possível conectar ao backend. Verifique se o Django está
        rodando.
      </p>
    );
  }
}
