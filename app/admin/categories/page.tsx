import { requireAdmin } from "@/lib/auth";
import { AdminCategoriesManager } from "@/components/admin/categories-manager";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <AdminCategoriesManager />
    </div>
  );
}
