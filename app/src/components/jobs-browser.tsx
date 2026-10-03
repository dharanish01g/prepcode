import { useState } from "react";
import { SearchIcon, WifiOffIcon, XIcon } from "lucide-react";
import {
  BRANCH_LABELS,
  CompanyLogo,
  EXPERIENCE_LABELS,
  JobDetails,
  JOB_TYPE_LABELS,
  postedAgo,
  WORK_MODE_LABELS,
} from "@/components/job-details";
import { PRACTICE_COLUMN } from "@/components/practice-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BRANCHES,
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  jobCities,
  useJobsQuery,
  WORK_MODES,
  type Job,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";

/** The same centered column as Practice, so both screens are the same width. */
const JOBS_COLUMN = cn(PRACTICE_COLUMN, "flex min-h-0 flex-1 flex-col gap-4");

/** Jobs on each page of the list. */
const PAGE_SIZE = 10;

/** A filter's value: "all" doesn't filter. */
const ALL = "all";

type Filters = {
  branch: string;
  city: string;
  workMode: string;
  jobType: string;
  experience: string;
};

const NO_FILTERS: Filters = {
  branch: ALL,
  city: ALL,
  workMode: ALL,
  jobType: ALL,
  experience: ALL,
};

function matches(job: Job, query: string, filters: Filters) {
  const text = [job.title, job.company, job.location, ...job.skills].join(" ").toLowerCase();
  return (
    text.includes(query) &&
    (filters.branch === ALL || job.branch === filters.branch) &&
    (filters.city === ALL || jobCities(job).includes(filters.city)) &&
    (filters.workMode === ALL || job.workMode === filters.workMode) &&
    (filters.jobType === ALL || job.jobType === filters.jobType) &&
    (filters.experience === ALL || job.experience === filters.experience)
  );
}

/** A dropdown filter, with "All …" first. */
function FilterSelect({
  allLabel,
  options,
  value,
  onChange,
}: {
  allLabel: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const items = [{ value: ALL, label: allLabel }, ...options];
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The page numbers to show: all of them when there are few, otherwise the
 * first, the last and the ones around the current page, with gaps as null.
 * Always seven slots at most, so the bar fits a narrow list.
 */
function pageNumbers(current: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, null, count];
  if (current >= count - 3) return [1, null, count - 4, count - 3, count - 2, count - 1, count];
  return [1, null, current - 1, current, current + 1, null, count];
}

/** Previous, the page numbers and Next, under the job list. */
function JobsPagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  // The links are anchors (so they're focusable), but they only change the page.
  function go(next: number) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      if (next >= 1 && next <= pageCount) onPageChange(next);
    };
  }
  const disabled = "pointer-events-none opacity-50";

  return (
    <Pagination className="shrink-0 border-t p-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text=""
            aria-disabled={page === 1}
            className={cn(page === 1 && disabled)}
            onClick={go(page - 1)}
          />
        </PaginationItem>
        {pageNumbers(page, pageCount).map((number, i) => (
          <PaginationItem key={number ?? `gap-${i}`}>
            {number === null ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href="#" isActive={number === page} onClick={go(number)}>
                {number}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            text=""
            aria-disabled={page === pageCount}
            className={cn(page === pageCount && disabled)}
            onClick={go(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/** Search and filters on top, the matching jobs on the left, the picked one on the right. */
export function JobsBrowser() {
  const jobs = useJobsQuery({ enabled: true });
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [slug, setSlug] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  if (jobs.isPending) return <JobsSkeleton />;
  if (jobs.isError) {
    // Most likely offline: the jobs come from Supabase.
    return (
      <Empty className="pb-24">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WifiOffIcon />
          </EmptyMedia>
          <EmptyTitle>Couldn't load jobs</EmptyTitle>
          <EmptyDescription>Check your internet connection and try again.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => jobs.refetch()}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const cities = [...new Set(jobs.data.flatMap(jobCities))].sort();
  const query = search.trim().toLowerCase();
  const shown = jobs.data.filter((job) => matches(job, query, filters));
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  // Clamped, in case a refetch left fewer pages than the one being viewed.
  const currentPage = Math.min(page, pageCount);
  const first = (currentPage - 1) * PAGE_SIZE;
  const pageJobs = shown.slice(first, first + PAGE_SIZE);
  // The picked job, or the page's first until a job on this page is picked.
  const selected = pageJobs.find((job) => job.slug === slug) ?? pageJobs[0];
  const filtering = query !== "" || Object.values(filters).some((value) => value !== ALL);

  function setFilter(key: keyof Filters) {
    return (value: string) => {
      setFilters((current) => ({ ...current, [key]: value }));
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setFilters(NO_FILTERS);
    setPage(1);
  }

  return (
    <div className={JOBS_COLUMN}>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title, company or skill..."
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <FilterSelect
          allLabel="All branches"
          options={BRANCHES.map((branch) => ({ value: branch, label: BRANCH_LABELS[branch] }))}
          value={filters.branch}
          onChange={setFilter("branch")}
        />
        <FilterSelect
          allLabel="All locations"
          options={cities.map((city) => ({ value: city, label: city }))}
          value={filters.city}
          onChange={setFilter("city")}
        />
        <FilterSelect
          allLabel="Any work mode"
          options={WORK_MODES.map((mode) => ({ value: mode, label: WORK_MODE_LABELS[mode] }))}
          value={filters.workMode}
          onChange={setFilter("workMode")}
        />
        <FilterSelect
          allLabel="Any job type"
          options={JOB_TYPES.map((type) => ({ value: type, label: JOB_TYPE_LABELS[type] }))}
          value={filters.jobType}
          onChange={setFilter("jobType")}
        />
        <FilterSelect
          allLabel="Any experience"
          options={EXPERIENCE_LEVELS.map((level) => ({
            value: level,
            label: EXPERIENCE_LABELS[level],
          }))}
          value={filters.experience}
          onChange={setFilter("experience")}
        />
        {filtering && (
          <Button variant="ghost" onClick={clearFilters}>
            <XIcon />
            Clear
          </Button>
        )}
      </div>
      {selected ? (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1 border">
          <ResizablePanel defaultSize="38%" minSize="25%" maxSize="60%" className="flex flex-col">
            {/* Keyed so each page starts scrolled to the top. */}
            <ScrollArea key={currentPage} className="min-h-0 flex-1">
              <p className="px-4 pt-3 pb-1 text-xs text-muted-foreground">
                {pageCount > 1
                  ? `${first + 1}–${first + pageJobs.length} of ${shown.length} jobs`
                  : `${shown.length} ${shown.length === 1 ? "job" : "jobs"}`}
              </p>
              <ul className="flex flex-col">
                {pageJobs.map((job) => (
                  <li key={job.slug}>
                    <button
                      type="button"
                      onClick={() => setSlug(job.slug)}
                      aria-current={job === selected}
                      className={cn(
                        "flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-muted/50",
                        job === selected && "bg-muted",
                      )}
                    >
                      <CompanyLogo job={job} className="size-9" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-sm font-medium">{job.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {job.company} · {job.location}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline">{JOB_TYPE_LABELS[job.jobType]}</Badge>
                          <Badge variant="outline">{WORK_MODE_LABELS[job.workMode]}</Badge>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {postedAgo(job.postedAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            {pageCount > 1 && (
              <JobsPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="62%" minSize="40%">
            <JobDetails job={selected} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <Empty className="pb-24">
          <EmptyHeader>
            <EmptyTitle>{filtering ? "No jobs match" : "No openings right now"}</EmptyTitle>
            <EmptyDescription>
              {filtering
                ? "Try a different search, or clear the filters."
                : "New jobs are added often. Check back soon."}
            </EmptyDescription>
          </EmptyHeader>
          {filtering && (
            <EmptyContent>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyContent>
          )}
        </Empty>
      )}
    </div>
  );
}

/** Stands in for the filters, list and details while jobs load from Supabase. */
function JobsSkeleton() {
  return (
    <div className={JOBS_COLUMN}>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Skeleton className="h-8 w-full max-w-xs" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-32" />
        ))}
      </div>
      <div className="flex min-h-0 flex-1 border">
        <div className="flex w-[38%] flex-col border-r">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 border-b px-4 py-3">
              <Skeleton className="size-9" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-4 h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
