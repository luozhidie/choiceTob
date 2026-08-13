import { redirect } from "next/navigation";

export default function FashionTrendsPage() {
  redirect("/magazine?tab=trends");
}
