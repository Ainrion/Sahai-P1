import weaviate from "weaviate-client";

// Global client instance
let weaviateClient: any = null;

// Create a function to get the Weaviate client
export async function getWeaviateClient() {
  if (!weaviateClient) {
    try {
      weaviateClient = await weaviate.connectToLocal({
        skipInitChecks: true,
      });
    } catch (error) {
      console.error("Failed to create Weaviate client:", error);
      throw error;
    }
  }
  return weaviateClient;
}

// Test connection to Weaviate
export async function testWeaviateConnection(): Promise<boolean> {
  try {
    const client = await getWeaviateClient();
    const result = await client.isReady();
    console.log("Weaviate connection successful:", result);
    return result;
  } catch (error) {
    console.error("Weaviate connection failed:", error);
    return false;
  }
}

// Get Weaviate cluster status
export async function getWeaviateStatus() {
  try {
    const client = await getWeaviateClient();
    const result = await client.getMeta();
    return {
      success: true,
      version: result.version,
      hostname: result.hostname,
      modules: result.modules,
    };
  } catch (error) {
    console.error("Failed to get Weaviate status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Initialize Weaviate with cultural knowledge schema
export async function initializeCulturalSchema() {
  try {
    const client = await getWeaviateClient();

    // Check if CulturalKnowledge collection already exists
    try {
      await client.collections.get("CulturalKnowledge").config.get();
      console.log("CulturalKnowledge collection already exists");
    } catch (error) {
      // Collection doesn't exist, create it
      await client.collections.create({
        name: "CulturalKnowledge",
        properties: [
          {
            name: "title",
            dataType: "text",
            description: "Title of the cultural knowledge",
          },
          {
            name: "content",
            dataType: "text",
            description: "Detailed content about the cultural topic",
          },
          {
            name: "category",
            dataType: "text",
            description: "Category like festival, food, tradition, etc.",
          },
          {
            name: "region",
            dataType: "text",
            description: "Geographic region where this is practiced",
          },
          {
            name: "language",
            dataType: "text",
            description: "Primary language of the content",
          },
          {
            name: "tags",
            dataType: "text[]",
            description: "Tags for easy categorization",
          },
          {
            name: "source",
            dataType: "text",
            description: "Source of the information",
          },
        ],
        vectorizers: weaviate.configure.vectorizer.none(),
      });
      console.log("CulturalKnowledge collection created successfully");
    }

    // Check if Document collection already exists
    try {
      await client.collections.get("Document").config.get();
      console.log("Document collection already exists");
    } catch (error) {
      // Collection doesn't exist, create it
      await client.collections.create({
        name: "Document",
        properties: [
          {
            name: "fileName",
            dataType: "text",
            description: "Original file name",
          },
          {
            name: "content",
            dataType: "text",
            description: "Extracted text content from the document",
          },
          {
            name: "fileType",
            dataType: "text",
            description: "File type: pdf, doc, txt, etc.",
          },
          {
            name: "fileSize",
            dataType: "number",
            description: "File size in bytes",
          },
          {
            name: "uploadDate",
            dataType: "date",
            description: "Date when the document was uploaded",
          },
          {
            name: "chunks",
            dataType: "text[]",
            description: "Text chunks for better processing",
          },
        ],
        vectorizers: weaviate.configure.vectorizer.none(),
      });
      console.log("Document collection created successfully");
    }

    return { success: true, message: "Schema initialized successfully" };
  } catch (error) {
    console.error("Failed to initialize schema:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Add cultural knowledge to Weaviate
export async function addCulturalKnowledge(knowledge: {
  title: string;
  content: string;
  category: string;
  region?: string;
  language: string;
  tags: string[];
  source: string;
  vector?: number[];
}) {
  try {
    const client = await getWeaviateClient();
    const culturalKnowledge = client.collections.get("CulturalKnowledge");

    console.log("Inserting cultural knowledge:", knowledge.title);

    const result = await culturalKnowledge.data.insert({
      title: knowledge.title,
      content: knowledge.content,
      category: knowledge.category,
      region: knowledge.region || "Unknown",
      language: knowledge.language,
      tags: knowledge.tags,
      source: knowledge.source,
    });

    console.log("Insert result:", result);

    return {
      success: true,
      id: result,
    };
  } catch (error) {
    console.error("Failed to add cultural knowledge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Search cultural knowledge
export async function searchCulturalKnowledge(
  query: string,
  category?: string,
  limit: number = 5
) {
  try {
    const client = await getWeaviateClient();
    const culturalKnowledge = client.collections.get("CulturalKnowledge");

    console.log("Searching for:", query, "category:", category);

    // Use hybrid search which combines BM25 and vector search
    let searchBuilder = culturalKnowledge.query.hybrid(query, {
      limit: limit,
    });

    if (category) {
      searchBuilder = searchBuilder.where({
        path: "category",
        operator: "Equal",
        value: category,
      });
    }

    const result = await searchBuilder;
    console.log("Search result:", result);

    return {
      success: true,
      data:
        result.objects?.map((obj: any) => ({
          id: obj.uuid,
          title: obj.properties?.title,
          content: obj.properties?.content,
          category: obj.properties?.category,
          region: obj.properties?.region,
          language: obj.properties?.language,
          tags: obj.properties?.tags,
          source: obj.properties?.source,
        })) || [],
    };
  } catch (error) {
    console.error("Failed to search cultural knowledge:", error);
    // Fallback to simple BM25 search
    try {
      const client = await getWeaviateClient();
      const culturalKnowledge = client.collections.get("CulturalKnowledge");

      const result = await culturalKnowledge.query.bm25(query, {
        limit: limit,
      });

      return {
        success: true,
        data:
          result.objects?.map((obj: any) => ({
            id: obj.uuid,
            title: obj.properties?.title,
            content: obj.properties?.content,
            category: obj.properties?.category,
            region: obj.properties?.region,
            language: obj.properties?.language,
            tags: obj.properties?.tags,
            source: obj.properties?.source,
          })) || [],
      };
    } catch (fallbackError) {
      console.error("Fallback search also failed:", fallbackError);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Add document to Weaviate
export async function addDocument(document: {
  fileName: string;
  content: string;
  fileType: string;
  fileSize: number;
  chunks: string[];
  vector?: number[];
}) {
  try {
    const client = await getWeaviateClient();
    const documents = client.collections.get("Document");

    const result = await documents.data.insert({
      fileName: document.fileName,
      content: document.content,
      fileType: document.fileType,
      fileSize: document.fileSize,
      uploadDate: new Date(),
      chunks: document.chunks,
    });

    return {
      success: true,
      id: result,
    };
  } catch (error) {
    console.error("Failed to add document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Search documents
export async function searchDocuments(query: string, limit: number = 5) {
  try {
    const client = await getWeaviateClient();
    const documents = client.collections.get("Document");

    const result = await documents.query.bm25(query, {
      limit: limit,
    });

    return {
      success: true,
      data:
        result.objects?.map((obj: any) => ({
          id: obj.uuid,
          fileName: obj.properties?.fileName,
          content: obj.properties?.content,
          fileType: obj.properties?.fileType,
          fileSize: obj.properties?.fileSize,
          uploadDate: obj.properties?.uploadDate,
          chunks: obj.properties?.chunks,
        })) || [],
    };
  } catch (error) {
    console.error("Failed to search documents:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
