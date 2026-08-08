import { requireAdmin } from "@/lib/auth";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function AdminMediaPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <MediaLibrary />
    </div>
  );
}
