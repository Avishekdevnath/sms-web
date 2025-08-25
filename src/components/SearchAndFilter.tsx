"use client";

import { useState, useEffect } from "react";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, string>) => void;
  searchPlaceholder?: string;
  filters?: {
    [key: string]: {
      label: string;
      options: FilterOption[];
      placeholder?: string;
    };
  };
  className?: string;
}

export default function SearchAndFilter({
  onSearch,
  onFilterChange,
  searchPlaceholder = "Search...",
  filters = {},
  className = ""
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...activeFilters };
    
    if (value === "") {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = value;
    }
    
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      {Object.keys(filters).length > 0 && (
        <div className="space-y-3">
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <svg 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {Object.keys(activeFilters).length}
                </span>
              )}
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter Options */}
          {isExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg">
              {Object.entries(filters).map(([filterKey, filterConfig]) => (
                <div key={filterKey} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {filterConfig.label}
                  </label>
                  <select
                    value={activeFilters[filterKey] || ""}
                    onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">
                      {filterConfig.placeholder || `All ${filterConfig.label}`}
                    </option>
                    {filterConfig.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                        {option.count !== undefined && ` (${option.count})`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([filterKey, value]) => {
                const filterConfig = filters[filterKey];
                const option = filterConfig?.options.find(opt => opt.value === value);
                
                return (
                  <span
                    key={filterKey}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    <span className="font-medium">{filterConfig?.label}:</span>
                    <span className="ml-1">{option?.label || value}</span>
                    <button
                      onClick={() => handleFilterChange(filterKey, "")}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 