"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Search,
  User,
  X,
} from "lucide-react";

/**
 * Global SearchableSelect Component
 * A flexible, accessible, beautiful dropdown with built-in search.
 *
 * @param {Object} props
 * @param {string|number} props.value - Currently selected value
 * @param {Function} props.onChange - Triggered when value changes (e, option) or (value)
 * @param {Function} [props.onSelect] - Direct callback with the selected option
 * @param {Array<Object>} props.options - Array of option objects:
 *    {
 *      value: string|number,
 *      label: string,
 *      subLabel?: string,
 *      badge?: string|React.ReactNode,
 *      badgeVariant?: "success" | "danger" | "warning" | "info" | "neutral",
 *      disabled?: boolean,
 *      disabledReason?: string,
 *      icon?: React.ReactNode,
 *      avatar?: string,
 *      keywords?: string[],
 *      raw?: any
 *    }
 * @param {string} [props.placeholder="-- เลือกข้อมูล --"]
 * @param {string} [props.searchPlaceholder="ค้นหาข้อมูล..."]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.error=false]
 * @param {boolean} [props.clearable=true]
 * @param {string} [props.className=""]
 * @param {string} [props.menuClassName=""]
 * @param {string} [props.name=""]
 * @param {string} [props.id=""]
 * @param {string} [props.noOptionsMessage="ไม่มีรายการให้เลือก"]
 * @param {string} [props.noResultsMessage="ไม่พบข้อมูลที่ค้นหา"]
 * @param {Function} [props.renderOption] - Custom renderer for list items
 * @param {Function} [props.renderSelected] - Custom renderer for selected value in trigger
 * @param {Function} [props.filterFn] - Custom search filter logic (option, query)
 */
export default function SearchableSelect({
  value,
  onChange,
  onSelect,
  options = [],
  placeholder = "-- เลือกข้อมูล --",
  searchPlaceholder = "ค้นหาข้อมูล...",
  disabled = false,
  error = false,
  clearable = true,
  searchable = true,
  className = "",
  menuClassName = "",
  name = "",
  id = "",
  noOptionsMessage = "ไม่มีรายการให้เลือก",
  noResultsMessage = "ไม่พบข้อมูลที่ค้นหา",
  renderOption,
  renderSelected,
  filterFn,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [options, value]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;

    if (filterFn) {
      return options.filter((opt) => filterFn(opt, q));
    }

    return options.filter((opt) => {
      const label = (opt.label || "").toLowerCase();
      const subLabel = (opt.subLabel || "").toLowerCase();
      const badge = typeof opt.badge === "string" ? opt.badge.toLowerCase() : "";
      const valStr = String(opt.value || "").toLowerCase();
      const keywords = Array.isArray(opt.keywords)
        ? opt.keywords.join(" ").toLowerCase()
        : "";

      return (
        label.includes(q) ||
        subLabel.includes(q) ||
        badge.includes(q) ||
        valStr.includes(q) ||
        keywords.includes(q)
      );
    });
  }, [options, searchQuery, filterFn]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
      return nextState;
    });
  }, [disabled]);

  // Handle option selection
  const handleSelect = useCallback(
    (option) => {
      if (!option || option.disabled) return;

      if (onSelect) {
        onSelect(option);
      }

      if (onChange) {
        // Emit synthetic event compatible with standard <select> onChange
        const syntheticEvent = {
          target: { value: option.value, name },
          currentTarget: { value: option.value, name },
          preventDefault: () => {},
          stopPropagation: () => {},
        };
        onChange(syntheticEvent, option);
      }

      setIsOpen(false);
      setSearchQuery("");
    },
    [onChange, onSelect, name]
  );

  // Handle clearing value
  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      if (disabled) return;

      if (onSelect) {
        onSelect(null);
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: "", name },
          currentTarget: { value: "", name },
          preventDefault: () => {},
          stopPropagation: () => {},
        };
        onChange(syntheticEvent, null);
      }

      setSearchQuery("");
    },
    [disabled, onChange, onSelect, name]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev + 1;
            return next >= filteredOptions.length ? 0 : next;
          });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? filteredOptions.length - 1 : next;
          });
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          setIsOpen(false);
          break;
        }
        default:
          break;
      }
    },
    [disabled, isOpen, filteredOptions, highlightedIndex, handleSelect]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (
      highlightedIndex >= 0 &&
      listRef.current &&
      listRef.current.children[highlightedIndex]
    ) {
      listRef.current.children[highlightedIndex].scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // Badge variant helper
  const getBadgeStyle = (variant) => {
    switch (variant) {
      case "danger":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "info":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-left shadow-xs outline-none transition-all flex items-center justify-between gap-2 cursor-pointer ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            : isOpen
              ? "border-indigo-500 ring-2 ring-indigo-100 shadow-sm"
              : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {renderSelected ? (
            renderSelected(selectedOption)
          ) : selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedOption.icon || (
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-indigo-50 text-[10px] font-bold text-indigo-700 uppercase">
                  {selectedOption.label.slice(0, 2)}
                </span>
              )}
              <span className="truncate font-medium text-slate-900">
                {selectedOption.label}
              </span>
              {selectedOption.subLabel && (
                <span className="truncate text-xs text-slate-400 font-mono hidden sm:inline">
                  {selectedOption.subLabel}
                </span>
              )}
              {selectedOption.badge && (
                <span
                  className={`ml-auto shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getBadgeStyle(
                    selectedOption.badgeVariant
                  )}`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="truncate text-slate-400">{placeholder}</span>
          )}
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              title="ล้างค่าที่เลือก"
              className="p-0.5 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-indigo-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 top-full z-50 mt-1.5 w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 transition-all ${menuClassName}`}
        >
          {/* Search Box */}
          {searchable && (
            <div className="relative mb-1.5 px-1 pt-0.5">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options Counter / Info */}
          {searchable && (
            <div className="px-2 py-1 text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-100 mb-1">
              <span>รายการทั้งหมด</span>
              <span className="font-medium text-slate-600">
                {filteredOptions.length} รายการ
              </span>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="thin-scrollbar max-h-60 overflow-y-auto space-y-0.5 p-0.5"
          >
            {/* Clear / Unselect default option */}
            {clearable && (
              <button
                type="button"
                onClick={handleClear}
                className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  !selectedOption
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="italic">{placeholder}</span>
                {!selectedOption && <Check className="h-3.5 w-3.5 text-slate-600" />}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                <AlertCircle className="mx-auto h-5 w-5 text-slate-300" />
                <p>
                  {options.length === 0 ? noOptionsMessage : noResultsMessage}
                </p>
                {searchQuery && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected =
                  selectedOption &&
                  String(selectedOption.value) === String(opt.value);
                const isHighlighted = highlightedIndex === idx;

                if (renderOption) {
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      {renderOption(opt, isSelected)}
                    </div>
                  );
                }

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`group w-full rounded-xl px-2.5 py-2 text-left text-xs transition-all flex items-center justify-between gap-2.5 ${
                      opt.disabled
                        ? "opacity-50 bg-slate-50/60 cursor-not-allowed"
                        : isSelected
                          ? "bg-indigo-50/80 text-indigo-900 font-semibold shadow-2xs border-l-2 border-indigo-600 cursor-pointer"
                          : isHighlighted
                            ? "bg-slate-100/80 text-slate-900 cursor-pointer"
                            : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon || (
                        <div
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase transition-colors ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}
                        >
                          {opt.label ? opt.label.slice(0, 2) : "ID"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="truncate font-medium text-slate-800 text-xs">
                            {opt.label}
                          </p>
                          {opt.badge && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getBadgeStyle(
                                opt.badgeVariant
                              )}`}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subLabel && (
                          <p className="truncate text-[11px] text-slate-400 mt-0.5 font-mono">
                            {opt.subLabel}
                          </p>
                        )}
                        {opt.disabledReason && (
                          <p className="text-[10px] text-rose-500 mt-0.5">
                            {opt.disabledReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isSelected && (
                        <Check className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { SearchableSelect };
