"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Filter,
  X,
  BookOpen,
  FileText,
  MapPin,
  Languages,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  SearchRequest,
  SearchResponse,
  VectorSearchResult,
} from "../types/vector";

interface AdvancedSearchProps {
  onSearchResults?: (results: VectorSearchResult[], query: string) => void;
  onSearchError?: (error: string) => void;
  className?: string;
}

interface SearchFilters {
  category: string;
  region: string;
  language: string;
  limit: number;
}

const categories = [
  { id: "all", name: "All Categories", icon: "🌟" },
  { id: "festival", name: "Festivals", icon: "🎉" },
  { id: "food", name: "Food & Cuisine", icon: "🍛" },
  { id: "custom", name: "Customs", icon: "🙏" },
  { id: "tradition", name: "Traditions", icon: "🏛️" },
  { id: "language", name: "Languages", icon: "🗣️" },
  { id: "mythology", name: "Mythology", icon: "📚" },
  { id: "art", name: "Art & Crafts", icon: "🎨" },
  { id: "dance", name: "Dance", icon: "💃" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "other", name: "Other", icon: "📖" },
];

const regions = [
  { id: "all", name: "All Regions" },
  { id: "North India", name: "North India" },
  { id: "South India", name: "South India" },
  { id: "East India", name: "East India" },
  { id: "West India", name: "West India" },
  { id: "Central India", name: "Central India" },
  { id: "Northeast India", name: "Northeast India" },
  { id: "Pan-India", name: "Pan-India" },
];

const languages = [
  { id: "all", name: "All Languages" },
  { id: "Hindi", name: "Hindi" },
  { id: "English", name: "English" },
  { id: "both", name: "Both" },
];

export function AdvancedSearch({
  onSearchResults,
  onSearchError,
  className = "",
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    category: "all",
    region: "all",
    language: "all",
    limit: 10,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    searchTime: 0,
    lastQuery: "",
  });

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const finalQuery = searchQuery || query;

      if (!finalQuery.trim()) {
        if (onSearchError) {
          onSearchError("Please enter a search query");
        }
        return;
      }

      setIsSearching(true);

      try {
        const searchRequest: SearchRequest = {
          query: finalQuery,
          options: {
            category: filters.category !== "all" ? filters.category : undefined,
            region: filters.region !== "all" ? filters.region : undefined,
            language: filters.language !== "all" ? filters.language : undefined,
            limit: filters.limit,
          },
        };

        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchRequest),
        });

        const data: SearchResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Search failed");
        }

        setResults(data.results);
        setSearchStats({
          totalResults: data.totalResults,
          searchTime: data.searchTime,
          lastQuery: finalQuery,
        });

        if (onSearchResults) {
          onSearchResults(data.results, finalQuery);
        }
      } catch (error) {
        console.error("Search error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Search failed";

        if (onSearchError) {
          onSearchError(errorMessage);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [query, filters, onSearchResults, onSearchError]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const updateFilter = useCallback(
    (key: keyof SearchFilters, value: string | number) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      category: "all",
      region: "all",
      language: "all",
      limit: 10,
    });
  }, []);

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.region !== "all" ||
    filters.language !== "all";

  const formatSearchTime = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case "cultural_knowledge":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "document":
        return <FileText className="w-4 h-4 text-green-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search cultural knowledge, documents, festivals..."
            className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-colors ${
              showFilters || hasActiveFilters
                ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Search Button */}
        <button
          onClick={() => handleSearch()}
          disabled={isSearching || !query.trim()}
          className="mt-3 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Searching...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Search Cultural Knowledge
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Search Filters
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region
              </label>
              <select
                value={filters.region}
                onChange={(e) => updateFilter("region", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => updateFilter("language", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Results Limit: {filters.limit}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={filters.limit}
              onChange={(e) => updateFilter("limit", parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Search Stats */}
      {searchStats.totalResults > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            {searchStats.totalResults} results for "{searchStats.lastQuery}"
          </span>
          <span>
            Search completed in {formatSearchTime(searchStats.searchTime)}
          </span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Results
          </h3>
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {getResultTypeIcon(result.metadata.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {result.metadata.title ||
                          result.metadata.fileName ||
                          "Untitled"}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                        {result.metadata.type === "cultural_knowledge"
                          ? "Knowledge"
                          : "Document"}
                      </span>
                    </div>

                    {result.metadata.category && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="capitalize">
                          {result.metadata.category}
                        </span>
                        {result.metadata.region && (
                          <>
                            <span>•</span>
                            <span>{result.metadata.region}</span>
                          </>
                        )}
                        {result.metadata.language && (
                          <>
                            <span>•</span>
                            <span>{result.metadata.language}</span>
                          </>
                        )}
                      </div>
                    )}

                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {truncateContent(result.content)}
                    </p>

                    {result.metadata.tags &&
                      Array.isArray(result.metadata.tags) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.metadata.tags
                            .slice(0, 3)
                            .map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          {result.metadata.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                              +{result.metadata.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && searchStats.lastQuery && !isSearching && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No results found for "{searchStats.lastQuery}"</p>
          <p className="text-sm mt-2">
            Try adjusting your search query or filters
          </p>
        </div>
      )}
    </div>
  );
}
