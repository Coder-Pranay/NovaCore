"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  FileIcon,
  FolderIcon,
  Loader2Icon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants";
import { useSearchResults } from "@/features/search/hooks";
import {
  clearRecentSearches,
  getRecentSearches,
  highlightSegments,
  pushRecentSearch,
} from "@/features/search/utils";
import { getErrorMessage, parseApiError } from "@/utils/api-error";
import { cn } from "@/utils";

function Highlight({ text, query }: { text: string; query: string }) {
  const parts = highlightSegments(text, query);
  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            key={`${part.text}-${index}`}
            className="bg-primary/20 text-foreground rounded-sm px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function SearchPage() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches());
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const searchQuery = useSearchResults(debounced);
  const apiError = searchQuery.error ? parseApiError(searchQuery.error) : null;

  const results = useMemo(() => {
    if (!searchQuery.data) {
      return [];
    }
    const spaces = searchQuery.data.spaces.map((space) => ({
      id: `space-${space.id}`,
      kind: "space" as const,
      label: space.name,
      description: space.description,
      href: `${ROUTES.SPACES}/${space.id}`,
    }));
    const assets = searchQuery.data.assets.map((asset) => ({
      id: `asset-${asset.id}`,
      kind: "asset" as const,
      label: asset.name,
      description: asset.spaceName
        ? `${asset.assetType} · ${asset.spaceName}`
        : String(asset.assetType),
      href: `${ROUTES.SPACES}/${asset.spaceId}`,
    }));
    return [...spaces, ...assets];
  }, [searchQuery.data]);

  const commitSearch = useCallback(
    (value: string) => {
      const next = value.trim();
      setQuery(next);
      setDebounced(next);
      if (next.length >= 2) {
        setRecent(pushRecentSearch(next));
      }
      setActiveIndex(-1);
    },
    [],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(results[activeIndex].href);
        return;
      }
      commitSearch(query);
      return;
    }
    if (event.key === "Escape") {
      setQuery("");
      setDebounced("");
      setActiveIndex(-1);
    }
  };

  const showRecent = debounced.length < 2 && recent.length > 0;
  const showEmpty =
    debounced.length >= 2 &&
    !searchQuery.isLoading &&
    !searchQuery.isError &&
    results.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground text-sm">
          Find spaces and assets across your workspace. Use arrow keys to navigate results.
        </p>
      </div>

      <div className="relative">
        <Label htmlFor="global-search" className="sr-only">
          Search NovaCore
        </Label>
        <SearchIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          id="global-search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search spaces and assets…"
          className="h-11 pl-9 pr-10"
          autoComplete="off"
        />
        {query ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="absolute top-1/2 right-2 -translate-y-1/2"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setDebounced("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            <XIcon className="size-4" />
          </Button>
        ) : null}
        {searchQuery.isFetching ? (
          <Loader2Icon
            className="text-muted-foreground absolute top-1/2 right-10 size-4 -translate-y-1/2 animate-spin"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {showRecent ? (
        <section aria-label="Recent searches" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent searches</h2>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                clearRecentSearches();
                setRecent([]);
              }}
            >
              Clear
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <li key={item}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => commitSearch(item)}
                >
                  {item}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {debounced.length > 0 && debounced.length < 2 ? (
        <p className="text-muted-foreground text-sm">Type at least 2 characters to search.</p>
      ) : null}

      {searchQuery.isError ? (
        <ErrorState
          title="Search failed"
          message={
            apiError?.status
              ? getErrorMessage(searchQuery.error)
              : `${getErrorMessage(searchQuery.error)}. Check your connection and try again.`
          }
          action={
            <Button type="button" variant="outline" onClick={() => void searchQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {searchQuery.isLoading && debounced.length >= 2 ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading search results">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      {showEmpty ? (
        <EmptyState
          title="No results"
          description={`Nothing matched “${debounced}”. Try a different term.`}
          icon={SearchIcon}
        />
      ) : null}

      {results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="border-border divide-y overflow-hidden rounded-xl border"
        >
          {results.map((result, index) => {
            const Icon = result.kind === "space" ? FolderIcon : FileIcon;
            const active = index === activeIndex;
            return (
              <li key={result.id} role="option" aria-selected={active} id={`${listId}-option-${index}`}>
                <Link
                  href={result.href}
                  className={cn(
                    "hover:bg-muted/50 focus-visible:bg-muted/50 flex items-start gap-3 px-4 py-3 transition-colors outline-none",
                    active && "bg-muted/60",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pushRecentSearch(debounced)}
                >
                  <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      <Highlight text={result.label} query={debounced} />
                    </span>
                    {result.description ? (
                      <span className="text-muted-foreground block truncate text-sm">
                        <Highlight text={result.description} query={debounced} />
                      </span>
                    ) : null}
                    <span className="text-muted-foreground mt-0.5 block text-xs capitalize">
                      {result.kind}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
