import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

/** Debounced search bar — emits onChange after 300ms of no typing. */
export const SearchBar = ({ value, onChange, placeholder = "Search activities…" }: Props) => {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (internal !== value) onChange(internal);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internal]);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        aria-label="Search activities"
        className="w-full rounded-2xl glass text-foreground placeholder:text-muted-foreground pl-10 pr-10 py-3.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
      />
      {internal.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setInternal("");
            onChange("");
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center size-7 rounded-full hover:bg-card transition-colors"
        >
          <X className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      )}
    </div>
  );
};
