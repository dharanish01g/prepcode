import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/** A group of questions, shown as a card on the Practice screen. */
export type Category = {
  slug: string;
  title: string;
  description: string;
  /** A lucide icon name, e.g. "brain". */
  icon: string | null;
  /** A company's logo (an image URL), shown instead of the icon. */
  logoUrl: string | null;
  /** Markdown: e.g. a company's exam pattern and eligibility requirements. */
  details: string | null;
  /** Paid content, marked with a star. */
  premium: boolean;
};

/** A heading on the Practice screen, e.g. "Indian Company Exams", with its categories. */
export type Section = {
  slug: string;
  title: string;
  categories: Category[];
};

/**
 * Every section (a prepwisely domain) with its categories, in display order.
 * The database returns only active ones.
 */
async function fetchSections(): Promise<Section[]> {
  const { data, error } = await supabase
    .from("pc_domains")
    .select(
      "slug, title, categories:pc_categories (slug, title, description, icon, logoUrl:logo_url, details)",
    )
    .order("position")
    .order("position", { referencedTable: "categories" });
  if (error) throw new Error(error.message);
  type FetchedSection = {
    slug: string;
    title: string;
    categories: Omit<Category, "premium">[];
  };
  return (data as unknown as FetchedSection[]).map((section) => ({
    ...section,
    categories: section.categories.map((category) => ({ ...category, premium: false })),
  }));
}

export function useSectionsQuery() {
  return useQuery({
    queryKey: ["practice-sections"],
    queryFn: fetchSections,
    // Categories change rarely; don't refetch on every visit to Practice.
    staleTime: 10 * 60 * 1000,
  });
}
