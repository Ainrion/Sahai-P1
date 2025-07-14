import { NextRequest, NextResponse } from "next/server";
import {
  searchCulturalKnowledge,
  searchDocuments,
  getWeaviateStatus,
} from "../../lib/weaviate";
import {
  SearchRequest,
  SearchResponse,
  VectorSearchResult,
} from "../../types/vector";

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, options = {} } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Search both cultural knowledge and documents
    const [culturalResults, documentResults] = await Promise.all([
      searchCulturalKnowledge(query, options.category, options.limit || 5),
      searchDocuments(query, options.limit || 5),
    ]);

    const searchTime = Date.now() - startTime;

    // Combine and format results
    const results: VectorSearchResult[] = [];

    // Add cultural knowledge results
    if (culturalResults.success) {
      culturalResults.data.forEach((item: any) => {
        results.push({
          id: item.id || "",
          distance: 0, // Weaviate doesn't return distance in this format
          content: item.content,
          metadata: {
            type: "cultural_knowledge",
            title: item.title,
            category: item.category,
            region: item.region,
            language: item.language,
            tags: item.tags,
            source: item.source,
            dateAdded: item.dateAdded,
          },
        });
      });
    }

    // Add document results
    if (documentResults.success) {
      documentResults.data.forEach((item: any) => {
        results.push({
          id: item.id || "",
          distance: 0,
          content: item.content,
          metadata: {
            type: "document",
            fileName: item.fileName,
            fileType: item.fileType,
            fileSize: item.fileSize,
            uploadDate: item.uploadDate,
            chunks: item.chunks,
          },
        });
      });
    }

    // Apply filters if specified
    let filteredResults = results;

    if (options.category) {
      filteredResults = results.filter(
        (result) => result.metadata.category === options.category
      );
    }

    if (options.region) {
      filteredResults = results.filter(
        (result) => result.metadata.region === options.region
      );
    }

    if (options.language) {
      filteredResults = results.filter(
        (result) =>
          result.metadata.language === options.language ||
          result.metadata.language === "both"
      );
    }

    // Sort by relevance (for now, just by type - cultural knowledge first)
    filteredResults.sort((a, b) => {
      if (
        a.metadata.type === "cultural_knowledge" &&
        b.metadata.type === "document"
      ) {
        return -1;
      }
      if (
        a.metadata.type === "document" &&
        b.metadata.type === "cultural_knowledge"
      ) {
        return 1;
      }
      return 0;
    });

    // Apply limit
    if (options.limit) {
      filteredResults = filteredResults.slice(0, options.limit);
    }

    const response: SearchResponse = {
      success: true,
      results: filteredResults,
      totalResults: filteredResults.length,
      searchTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        success: false,
        results: [],
        totalResults: 0,
        searchTime: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const language = searchParams.get("language");
    const limit = searchParams.get("limit");

    if (!query) {
      // Return search capabilities and categories
      return NextResponse.json({
        capabilities: {
          searchTypes: ["cultural_knowledge", "documents"],
          categories: [
            "festival",
            "food",
            "custom",
            "tradition",
            "language",
            "mythology",
            "art",
            "dance",
            "music",
            "other",
          ],
          regions: [
            "North India",
            "South India",
            "East India",
            "West India",
            "Central India",
            "Northeast India",
            "Pan-India",
          ],
          languages: ["Hindi", "English", "both"],
          filters: ["category", "region", "language", "dateRange"],
          maxResults: 50,
        },
        usage: {
          endpoint: "/api/search",
          methods: ["GET", "POST"],
          queryParams: {
            q: "Search query (required)",
            category: "Filter by category (optional)",
            region: "Filter by region (optional)",
            language: "Filter by language (optional)",
            limit: "Maximum results (optional, default: 10)",
          },
          example: "/api/search?q=diwali&category=festival&limit=5",
        },
      });
    }

    // Handle GET request with query parameters
    const searchRequest: SearchRequest = {
      query,
      options: {
        category: category || undefined,
        region: region || undefined,
        language: language || undefined,
        limit: limit ? parseInt(limit) : 10,
      },
    };

    // Reuse POST logic
    const startTime = Date.now();

    const [culturalResults, documentResults] = await Promise.all([
      searchCulturalKnowledge(
        query,
        searchRequest.options?.category,
        searchRequest.options?.limit || 5
      ),
      searchDocuments(query, searchRequest.options?.limit || 5),
    ]);

    const searchTime = Date.now() - startTime;

    const results: VectorSearchResult[] = [];

    if (culturalResults.success) {
      culturalResults.data.forEach((item: any) => {
        results.push({
          id: item.id || "",
          distance: 0,
          content: item.content,
          metadata: {
            type: "cultural_knowledge",
            title: item.title,
            category: item.category,
            region: item.region,
            language: item.language,
            tags: item.tags,
            source: item.source,
            dateAdded: item.dateAdded,
          },
        });
      });
    }

    if (documentResults.success) {
      documentResults.data.forEach((item: any) => {
        results.push({
          id: item.id || "",
          distance: 0,
          content: item.content,
          metadata: {
            type: "document",
            fileName: item.fileName,
            fileType: item.fileType,
            fileSize: item.fileSize,
            uploadDate: item.uploadDate,
            chunks: item.chunks,
          },
        });
      });
    }

    const response: SearchResponse = {
      success: true,
      results,
      totalResults: results.length,
      searchTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Search GET error:", error);
    return NextResponse.json(
      {
        success: false,
        results: [],
        totalResults: 0,
        searchTime: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
