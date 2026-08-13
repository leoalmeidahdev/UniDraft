import { CsvImportForm } from "@/components/admin/CsvImportForm";

export default function AdminImportarPage() {
  return (
    <div className="max-w-lg">
      <h2 className="mb-6 text-xl font-semibold">Importar turmas e alunos via CSV</h2>
      <CsvImportForm />
    </div>
  );
}
