import { redirect } from "next/navigation";

// The training content moved to /training when the site was split into two
// main product pages (Saj, 9 Sept 2026). Old links and search results still
// land here, so send them on. Anchors (#mock-cqc-inspections etc.) are the
// same slugs on the new page.
export default function ServicesPage() {
  redirect("/training");
}
