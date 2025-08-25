"use client";

import { useState } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface SimpleSearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  filters?: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  }[];
}

export default function SimpleSearchAndFilter({
  searchTerm,
  onSearchChange,
  placeholder = "Search...",
  filters = []
}: SimpleSearchAndFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filters */}
      {filters.map((filter, index) => (
        <div key={index} className="min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {filter.label}
          </label>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
