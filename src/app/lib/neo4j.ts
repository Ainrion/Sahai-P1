import neo4j, {
  Driver,
  Session,
  ManagedTransaction,
  Result,
  Node,
  Relationship,
  Path,
} from "neo4j-driver";
import {
  Neo4jConfig,
  GraphNode,
  GraphRelationship,
  GraphPath,
  GraphQuery,
  GraphQueryResult,
  GraphSchema,
  GraphMetrics,
  CulturalEntity,
  CulturalRelationship,
} from "../types/graph";

// Global driver instance
let driver: Driver | null = null;

// Default configuration
const DEFAULT_CONFIG: Neo4jConfig = {
  uri: "bolt://localhost:7687",
  username: "neo4j",
  password: "password123",
  database: "neo4j",
  maxConnectionPoolSize: 50,
  connectionAcquisitionTimeout: 30000,
  connectionTimeout: 10000,
  maxTransactionRetryTime: 30000,
};

/**
 * Initialize Neo4j driver with configuration
 */
export async function initializeNeo4jDriver(
  config: Partial<Neo4jConfig> = {}
): Promise<Driver> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    if (driver) {
      await driver.close();
    }

    driver = neo4j.driver(
      finalConfig.uri,
      neo4j.auth.basic(finalConfig.username, finalConfig.password),
      {
        maxConnectionPoolSize: finalConfig.maxConnectionPoolSize,
        connectionAcquisitionTimeout: finalConfig.connectionAcquisitionTimeout,
        connectionTimeout: finalConfig.connectionTimeout,
        maxTransactionRetryTime: finalConfig.maxTransactionRetryTime,
        encrypted: false, // Disable encryption for local development
        trust: "TRUST_ALL_CERTIFICATES", // Trust all certificates for local development
      }
    );

    // Test connection
    const session = driver.session({ database: finalConfig.database });
    try {
      await session.run("RETURN 1");
      console.log("Neo4j connection established successfully");
    } finally {
      await session.close();
    }

    return driver;
  } catch (error) {
    console.error("Failed to initialize Neo4j driver:", error);
    throw error;
  }
}

/**
 * Get the current Neo4j driver instance
 */
export async function getNeo4jDriver(): Promise<Driver> {
  if (!driver) {
    driver = await initializeNeo4jDriver();
  }
  return driver;
}

/**
 * Close Neo4j driver connection
 */
export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    console.log("Neo4j driver closed");
  }
}

/**
 * Check Neo4j connection status
 */
export async function checkNeo4jConnection(): Promise<{
  connected: boolean;
  error?: string;
  version?: string;
}> {
  try {
    const currentDriver = await getNeo4jDriver();
    const session = currentDriver.session();

    try {
      const result = await session.run(
        "CALL dbms.components() YIELD name, versions RETURN name, versions[0] as version"
      );
      const record = result.records[0];
      const version = record?.get("version") || "unknown";

      return {
        connected: true,
        version: version,
      };
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Neo4j connection check failed:", error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute a Cypher query
 */
export async function executeQuery(
  query: string,
  parameters: Record<string, any> = {},
  database?: string
): Promise<GraphQueryResult> {
  const startTime = Date.now();

  try {
    const currentDriver = await getNeo4jDriver();
    const session = currentDriver.session({ database: database || "neo4j" });

    try {
      const result = await session.run(query, parameters);
      const data = result.records.map((record) => {
        const obj: any = {};
        record.keys.forEach((key) => {
          const value = record.get(key);
          obj[key] = convertNeo4jValue(value);
        });
        return obj;
      });

      return {
        success: true,
        data,
        totalResults: data.length,
        executionTime: Date.now() - startTime,
        metadata: {
          query,
          parameters,
          resultType: "mixed",
        },
      };
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Query execution failed:", error);
    return {
      success: false,
      data: [],
      totalResults: 0,
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute query in a transaction
 */
export async function executeTransaction(
  queries: { query: string; parameters?: Record<string, any> }[],
  database?: string
): Promise<GraphQueryResult[]> {
  try {
    const currentDriver = await getNeo4jDriver();
    const session = currentDriver.session({ database: database || "neo4j" });

    try {
      const results = await session.executeWrite(
        async (tx: ManagedTransaction) => {
          const queryResults: GraphQueryResult[] = [];

          for (const { query, parameters = {} } of queries) {
            const startTime = Date.now();
            try {
              const result = await tx.run(query, parameters);
              const data = result.records.map((record) => {
                const obj: any = {};
                record.keys.forEach((key) => {
                  obj[key] = convertNeo4jValue(record.get(key));
                });
                return obj;
              });

              queryResults.push({
                success: true,
                data,
                totalResults: data.length,
                executionTime: Date.now() - startTime,
                metadata: { query, parameters, resultType: "mixed" },
              });
            } catch (error) {
              queryResults.push({
                success: false,
                data: [],
                totalResults: 0,
                executionTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }

          return queryResults;
        }
      );

      return results;
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Transaction execution failed:", error);
    return [
      {
        success: false,
        data: [],
        totalResults: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    ];
  }
}

/**
 * Convert Neo4j values to JavaScript values
 */
function convertNeo4jValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    value.constructor?.name === "Node"
  ) {
    const node = value as Node;
    return {
      id: node.identity.toString(),
      elementId: node.elementId,
      labels: node.labels,
      properties: node.properties,
    } as GraphNode;
  }

  if (
    value &&
    typeof value === "object" &&
    value.constructor?.name === "Relationship"
  ) {
    const rel = value as Relationship;
    return {
      id: rel.identity.toString(),
      elementId: rel.elementId,
      type: rel.type,
      properties: rel.properties,
      startNodeId: rel.start.toString(),
      endNodeId: rel.end.toString(),
    } as GraphRelationship;
  }

  if (
    value &&
    typeof value === "object" &&
    value.constructor?.name === "Path"
  ) {
    const path = value as Path;
    return {
      nodes: path.segments
        .flatMap((segment) => [
          convertNeo4jValue(segment.start),
          convertNeo4jValue(segment.end),
        ])
        .filter(
          (node, index, array) => index === 0 || node.id !== array[index - 1].id
        ),
      relationships: path.segments.map((segment) =>
        convertNeo4jValue(segment.relationship)
      ),
      length: path.length,
    } as GraphPath;
  }

  if (
    value &&
    typeof value === "object" &&
    value.constructor?.name === "Integer"
  ) {
    return typeof value.toNumber === "function"
      ? value.toNumber()
      : Number(value);
  }

  if (
    value &&
    typeof value === "object" &&
    (value.constructor?.name === "DateTime" ||
      value.constructor?.name === "Date" ||
      value.constructor?.name === "Time")
  ) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(convertNeo4jValue);
  }

  if (typeof value === "object") {
    const converted: any = {};
    for (const [key, val] of Object.entries(value)) {
      converted[key] = convertNeo4jValue(val);
    }
    return converted;
  }

  return value;
}

/**
 * Get graph schema information
 */
export async function getGraphSchema(): Promise<GraphSchema> {
  try {
    // Get node labels and their properties
    const labelsResult = await executeQuery(`
      CALL db.labels() YIELD label
      RETURN label
    `);

    // Get relationship types
    const relTypesResult = await executeQuery(`
      CALL db.relationshipTypes() YIELD relationshipType
      RETURN relationshipType
    `);

    // Get constraints
    const constraintsResult = await executeQuery(`
      SHOW CONSTRAINTS
    `);

    // Get indexes
    const indexesResult = await executeQuery(`
      SHOW INDEXES
    `);

    return {
      nodeTypes: labelsResult.data.map((record: any) => ({
        label: record.label,
        properties: {}, // Would need additional queries to get property info
      })),
      relationshipTypes: relTypesResult.data.map((record: any) => ({
        type: record.relationshipType,
        properties: {},
        allowedStartLabels: [],
        allowedEndLabels: [],
      })),
      constraints: constraintsResult.data.map((record: any) => ({
        type: record.type || "UNIQUE",
        target: record.entityType || record.labelsOrTypes?.[0] || "",
        property: record.properties?.[0],
      })),
      indexes: indexesResult.data.map((record: any) => ({
        type: record.type || "BTREE",
        target: record.entityType || record.labelsOrTypes?.[0] || "",
        property: record.properties?.[0] || "",
      })),
    };
  } catch (error) {
    console.error("Failed to get graph schema:", error);
    return {
      nodeTypes: [],
      relationshipTypes: [],
      constraints: [],
      indexes: [],
    };
  }
}

/**
 * Get graph metrics and statistics
 */
export async function getGraphMetrics(): Promise<GraphMetrics> {
  try {
    const queries = [
      "MATCH (n) RETURN count(n) as nodeCount",
      "MATCH ()-[r]->() RETURN count(r) as relCount",
      "MATCH (n) RETURN labels(n) as labels",
      "MATCH ()-[r]->() RETURN type(r) as relType",
    ];

    const [nodeCountResult, relCountResult, labelsResult, relTypesResult] =
      await Promise.all(queries.map((query) => executeQuery(query)));

    const totalNodes = nodeCountResult.data[0]?.nodeCount || 0;
    const totalRelationships = relCountResult.data[0]?.relCount || 0;

    // Count node types
    const nodeTypes: Record<string, number> = {};
    labelsResult.data.forEach((record: any) => {
      const labels = record.labels || [];
      labels.forEach((label: string) => {
        nodeTypes[label] = (nodeTypes[label] || 0) + 1;
      });
    });

    // Count relationship types
    const relationshipTypes: Record<string, number> = {};
    relTypesResult.data.forEach((record: any) => {
      const relType = record.relType;
      if (relType) {
        relationshipTypes[relType] = (relationshipTypes[relType] || 0) + 1;
      }
    });

    return {
      totalNodes,
      totalRelationships,
      nodeTypes,
      relationshipTypes,
      density:
        totalNodes > 0
          ? totalRelationships / (totalNodes * (totalNodes - 1))
          : 0,
      averageDegree: totalNodes > 0 ? (2 * totalRelationships) / totalNodes : 0,
      components: 1, // Would need additional query for accurate component count
    };
  } catch (error) {
    console.error("Failed to get graph metrics:", error);
    return {
      totalNodes: 0,
      totalRelationships: 0,
      nodeTypes: {},
      relationshipTypes: {},
      density: 0,
      averageDegree: 0,
      components: 0,
    };
  }
}

/**
 * Initialize graph schema and constraints
 */
export async function initializeGraphSchema(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const schemaQueries = [
      // Create constraints for unique entities
      "CREATE CONSTRAINT cultural_entity_name IF NOT EXISTS FOR (c:CulturalEntity) REQUIRE c.name IS UNIQUE",
      "CREATE CONSTRAINT festival_name IF NOT EXISTS FOR (f:Festival) REQUIRE f.name IS UNIQUE",
      "CREATE CONSTRAINT place_name IF NOT EXISTS FOR (p:Place) REQUIRE p.name IS UNIQUE",
      "CREATE CONSTRAINT person_name IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE",
      "CREATE CONSTRAINT deity_name IF NOT EXISTS FOR (d:Deity) REQUIRE d.name IS UNIQUE",

      // Create indexes for better query performance
      "CREATE INDEX cultural_entity_type IF NOT EXISTS FOR (c:CulturalEntity) ON (c.type)",
      "CREATE INDEX cultural_entity_region IF NOT EXISTS FOR (c:CulturalEntity) ON (c.region)",
      "CREATE INDEX cultural_entity_language IF NOT EXISTS FOR (c:CulturalEntity) ON (c.language)",
      "CREATE TEXT INDEX cultural_entity_description IF NOT EXISTS FOR (c:CulturalEntity) ON (c.description)",

      // Create full-text search indexes
      "CREATE FULLTEXT INDEX cultural_search IF NOT EXISTS FOR (c:CulturalEntity) ON EACH [c.name, c.description, c.significance]",
    ];

    const results = await executeTransaction(
      schemaQueries.map((query) => ({ query }))
    );

    const failedQueries = results.filter((result) => !result.success);
    if (failedQueries.length > 0) {
      console.warn("Some schema queries failed:", failedQueries);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to initialize graph schema:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clear all data from the graph (use with caution!)
 */
export async function clearGraphData(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await executeQuery("MATCH (n) DETACH DELETE n");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear graph data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
