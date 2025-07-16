import { executeTransaction, executeQuery } from "./neo4j";
import { CulturalEntity, CulturalRelationship } from "../types/graph";

// Sample cultural entities data
const CULTURAL_ENTITIES = [
  // Festivals
  {
    name: "Diwali",
    type: "festival",
    description:
      "Festival of lights celebrated across India, symbolizing the victory of light over darkness and good over evil.",
    region: "All India",
    language: "Sanskrit",
    significance:
      "Celebrates return of Lord Rama to Ayodhya, worship of Goddess Lakshmi",
    category: "Hindu Festival",
    popularity: 10,
    verified: true,
  },
  {
    name: "Holi",
    type: "festival",
    description:
      "Festival of colors marking the arrival of spring and celebrating the victory of good over evil.",
    region: "North India",
    language: "Hindi",
    significance: "Celebrates love of Radha-Krishna, burning of Holika",
    category: "Hindu Festival",
    popularity: 9,
    verified: true,
  },
  {
    name: "Eid ul-Fitr",
    type: "festival",
    description: "Islamic festival marking the end of Ramadan fasting month.",
    region: "All India",
    language: "Arabic",
    significance:
      "Celebration of completion of fasting and spiritual cleansing",
    category: "Islamic Festival",
    popularity: 8,
    verified: true,
  },
  {
    name: "Durga Puja",
    type: "festival",
    description:
      "Hindu festival celebrating Goddess Durga's victory over demon Mahishasura.",
    region: "West Bengal",
    language: "Bengali",
    significance: "Worship of Divine Mother, victory of good over evil",
    category: "Hindu Festival",
    popularity: 8,
    verified: true,
  },
  {
    name: "Onam",
    type: "festival",
    description:
      "Harvest festival of Kerala celebrating the return of King Mahabali.",
    region: "Kerala",
    language: "Malayalam",
    significance:
      "Harvest celebration, remembrance of golden age under King Mahabali",
    category: "Hindu Festival",
    popularity: 7,
    verified: true,
  },

  // Deities
  {
    name: "Lakshmi",
    type: "deity",
    description:
      "Hindu goddess of wealth, fortune, prosperity, beauty and abundance.",
    region: "All India",
    language: "Sanskrit",
    significance: "Patron goddess of wealth and prosperity",
    category: "Hindu Deity",
    popularity: 9,
    verified: true,
  },
  {
    name: "Ganesha",
    type: "deity",
    description:
      "Hindu deity with elephant head, remover of obstacles and patron of arts and sciences.",
    region: "All India",
    language: "Sanskrit",
    significance: "Remover of obstacles, patron of beginnings",
    category: "Hindu Deity",
    popularity: 10,
    verified: true,
  },
  {
    name: "Durga",
    type: "deity",
    description:
      "Hindu goddess, divine mother, warrior goddess who protects devotees from evil.",
    region: "All India",
    language: "Sanskrit",
    significance: "Divine mother, protector, destroyer of evil",
    category: "Hindu Deity",
    popularity: 8,
    verified: true,
  },
  {
    name: "Krishna",
    type: "deity",
    description:
      "Hindu deity, eighth avatar of Vishnu, known for teachings in Bhagavad Gita.",
    region: "All India",
    language: "Sanskrit",
    significance: "Avatar of Vishnu, teacher of dharma",
    category: "Hindu Deity",
    popularity: 10,
    verified: true,
  },

  // Places
  {
    name: "Varanasi",
    type: "place",
    description:
      "Holy city on banks of Ganges, one of oldest continuously inhabited cities.",
    region: "Uttar Pradesh",
    language: "Hindi",
    significance: "Sacred city, place of liberation, city of Shiva",
    category: "Sacred City",
    popularity: 9,
    verified: true,
  },
  {
    name: "Ayodhya",
    type: "place",
    description:
      "Sacred city, birthplace of Lord Rama according to Hindu tradition.",
    region: "Uttar Pradesh",
    language: "Hindi",
    significance: "Birthplace of Rama, capital of ancient Kosala kingdom",
    category: "Sacred City",
    popularity: 8,
    verified: true,
  },
  {
    name: "Mathura",
    type: "place",
    description: "Birthplace of Lord Krishna, important pilgrimage site.",
    region: "Uttar Pradesh",
    language: "Hindi",
    significance: "Birthplace of Krishna, sacred pilgrimage site",
    category: "Sacred City",
    popularity: 8,
    verified: true,
  },
  {
    name: "Kolkata",
    type: "place",
    description:
      "Cultural capital of India, known for Durga Puja celebrations.",
    region: "West Bengal",
    language: "Bengali",
    significance: "Cultural center, literary hub, Durga Puja center",
    category: "Cultural City",
    popularity: 7,
    verified: true,
  },

  // Foods
  {
    name: "Laddu",
    type: "food",
    description: "Sweet ball-shaped dessert made from flour, ghee and sugar.",
    region: "All India",
    language: "Sanskrit",
    significance: "Offered to deities, festival sweet",
    category: "Sweet",
    popularity: 9,
    verified: true,
  },
  {
    name: "Modak",
    type: "food",
    description: "Sweet dumpling, favorite food of Lord Ganesha.",
    region: "Maharashtra",
    language: "Marathi",
    significance: "Ganesha's favorite sweet, offered during Ganesh Chaturthi",
    category: "Sweet",
    popularity: 7,
    verified: true,
  },
  {
    name: "Kheer",
    type: "food",
    description: "Rice pudding made with milk, sugar and cardamom.",
    region: "All India",
    language: "Hindi",
    significance: "Festival dessert, offered in prayers",
    category: "Sweet",
    popularity: 8,
    verified: true,
  },
  {
    name: "Gujiya",
    type: "food",
    description:
      "Sweet dumpling stuffed with khoya and dry fruits, popular during Holi.",
    region: "North India",
    language: "Hindi",
    significance: "Holi special sweet, symbol of celebration",
    category: "Sweet",
    popularity: 6,
    verified: true,
  },

  // Traditions
  {
    name: "Aarti",
    type: "tradition",
    description:
      "Hindu religious ritual of worship with light, usually oil lamps.",
    region: "All India",
    language: "Sanskrit",
    significance: "Form of prayer, removes negative energy",
    category: "Ritual",
    popularity: 9,
    verified: true,
  },
  {
    name: "Rangoli",
    type: "tradition",
    description:
      "Art form where patterns are created on floor using colored powders.",
    region: "All India",
    language: "Sanskrit",
    significance: "Welcomes prosperity, decorative art for festivals",
    category: "Art",
    popularity: 8,
    verified: true,
  },
  {
    name: "Sindoor",
    type: "tradition",
    description: "Red powder worn by married Hindu women in hair parting.",
    region: "North India",
    language: "Sanskrit",
    significance: "Symbol of married status, protection of husband",
    category: "Custom",
    popularity: 7,
    verified: true,
  },
];

// Relationships between entities
const CULTURAL_RELATIONSHIPS = [
  // Festival-Deity relationships
  { from: "Diwali", to: "Lakshmi", type: "WORSHIPS", strength: 0.9 },
  { from: "Diwali", to: "Ganesha", type: "WORSHIPS", strength: 0.7 },
  { from: "Holi", to: "Krishna", type: "WORSHIPS", strength: 0.9 },
  { from: "Durga Puja", to: "Durga", type: "WORSHIPS", strength: 1.0 },

  // Festival-Place relationships
  { from: "Diwali", to: "Ayodhya", type: "ORIGINATED_FROM", strength: 0.8 },
  { from: "Holi", to: "Mathura", type: "CELEBRATED_IN", strength: 0.9 },
  { from: "Durga Puja", to: "Kolkata", type: "CELEBRATED_IN", strength: 0.9 },

  // Festival-Food relationships
  { from: "Diwali", to: "Laddu", type: "ASSOCIATED_WITH", strength: 0.8 },
  { from: "Diwali", to: "Kheer", type: "ASSOCIATED_WITH", strength: 0.7 },
  { from: "Holi", to: "Gujiya", type: "ASSOCIATED_WITH", strength: 0.9 },

  // Festival-Tradition relationships
  { from: "Diwali", to: "Aarti", type: "PART_OF", strength: 0.8 },
  { from: "Diwali", to: "Rangoli", type: "PART_OF", strength: 0.9 },

  // Deity-Food relationships
  { from: "Ganesha", to: "Modak", type: "ASSOCIATED_WITH", strength: 1.0 },
  { from: "Lakshmi", to: "Kheer", type: "ASSOCIATED_WITH", strength: 0.6 },

  // Deity-Place relationships
  { from: "Krishna", to: "Mathura", type: "ORIGINATED_FROM", strength: 1.0 },
  { from: "Durga", to: "Kolkata", type: "CELEBRATED_IN", strength: 0.8 },

  // Cross-cultural influences
  { from: "Diwali", to: "Holi", type: "RELATED_TO", strength: 0.6 },
  { from: "Durga Puja", to: "Diwali", type: "RELATED_TO", strength: 0.5 },
  { from: "Onam", to: "Diwali", type: "RELATED_TO", strength: 0.4 },

  // Regional variations
  { from: "Durga Puja", to: "Diwali", type: "VARIANT_OF", strength: 0.3 },
  { from: "Onam", to: "Diwali", type: "VARIANT_OF", strength: 0.2 },
];

/**
 * Create cultural entities in Neo4j
 */
export async function createCulturalEntities(): Promise<{
  success: boolean;
  created: number;
  error?: string;
}> {
  try {
    console.log(
      `Attempting to create ${CULTURAL_ENTITIES.length} cultural entities...`
    );

    let successCount = 0;
    const errors: string[] = [];

    // Create entities one by one for better error handling
    for (const entity of CULTURAL_ENTITIES) {
      try {
        const query = `
          MERGE (c:CulturalEntity {name: $name})
          SET c.type = $type,
              c.description = $description,
              c.region = $region,
              c.language = $language,
              c.significance = $significance,
              c.category = $category,
              c.dateAdded = $dateAdded,
              c.lastUpdated = $lastUpdated,
              c.popularity = $popularity,
              c.verified = $verified
          RETURN c.name as name
        `;

        const result = await executeQuery(query, {
          name: entity.name,
          type: entity.type,
          description: entity.description,
          region: entity.region || "",
          language: entity.language || "",
          significance: entity.significance || "",
          category: entity.category || "",
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          popularity: entity.popularity || 5,
          verified: entity.verified || false,
        });

        if (result.success && result.data.length > 0) {
          successCount++;
          console.log(`✓ Created entity: ${entity.name}`);
        } else {
          errors.push(
            `Failed to create ${entity.name}: ${
              result.error || "Unknown error"
            }`
          );
          console.error(
            `✗ Failed to create entity: ${entity.name}`,
            result.error
          );
        }
      } catch (entityError) {
        const errorMsg = `Error creating ${entity.name}: ${
          entityError instanceof Error ? entityError.message : "Unknown error"
        }`;
        errors.push(errorMsg);
        console.error(errorMsg, entityError);
      }
    }

    if (successCount === 0) {
      return {
        success: false,
        created: 0,
        error: `Failed to create any entities. Errors: ${errors.join("; ")}`,
      };
    }

    console.log(
      `Successfully created ${successCount}/${CULTURAL_ENTITIES.length} cultural entities`
    );

    if (errors.length > 0) {
      console.warn(`Some entities failed to create:`, errors);
    }

    return {
      success: true,
      created: successCount,
      error:
        errors.length > 0
          ? `Partial success. Errors: ${errors.join("; ")}`
          : undefined,
    };
  } catch (error) {
    console.error("Failed to create cultural entities:", error);
    return {
      success: false,
      created: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create relationships between cultural entities
 */
export async function createCulturalRelationships(): Promise<{
  success: boolean;
  created: number;
  error?: string;
}> {
  try {
    const queries = CULTURAL_RELATIONSHIPS.map((rel) => ({
      query: `
        MATCH (a:CulturalEntity {name: $fromName})
        MATCH (b:CulturalEntity {name: $toName})
        CALL apoc.create.relationship(a, $relType, {
          strength: $strength,
          since: $since,
          context: $context,
          verified: $verified
        }, b) YIELD rel
        RETURN type(rel) as relType
      `,
      parameters: {
        fromName: rel.from,
        toName: rel.to,
        relType: rel.type,
        strength: rel.strength,
        since: new Date().toISOString(),
        context: `Cultural relationship between ${rel.from} and ${rel.to}`,
        verified: true,
      },
    }));

    const results = await executeTransaction(queries);
    const successCount = results.filter((r) => r.success).length;

    if (successCount === 0) {
      return {
        success: false,
        created: 0,
        error: "Failed to create any relationships",
      };
    }

    console.log(`Successfully created ${successCount} cultural relationships`);
    return {
      success: true,
      created: successCount,
    };
  } catch (error) {
    console.error("Failed to create cultural relationships:", error);
    return {
      success: false,
      created: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Initialize the complete cultural knowledge graph
 */
export async function initializeCulturalGraph(): Promise<{
  success: boolean;
  entities: number;
  relationships: number;
  error?: string;
}> {
  try {
    console.log("Initializing cultural knowledge graph...");

    // Create entities first
    const entitiesResult = await createCulturalEntities();
    if (!entitiesResult.success) {
      return {
        success: false,
        entities: 0,
        relationships: 0,
        error: `Failed to create entities: ${entitiesResult.error}`,
      };
    }

    // Create relationships
    const relationshipsResult = await createCulturalRelationships();
    if (!relationshipsResult.success) {
      return {
        success: false,
        entities: entitiesResult.created,
        relationships: 0,
        error: `Failed to create relationships: ${relationshipsResult.error}`,
      };
    }

    console.log("Cultural knowledge graph initialized successfully");
    return {
      success: true,
      entities: entitiesResult.created,
      relationships: relationshipsResult.created,
    };
  } catch (error) {
    console.error("Failed to initialize cultural graph:", error);
    return {
      success: false,
      entities: 0,
      relationships: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add additional cultural entities dynamically
 */
export async function addCulturalEntity(entity: {
  name: string;
  type: string;
  description: string;
  region?: string;
  language?: string;
  significance?: string;
  category?: string;
  popularity?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const query = `
      CREATE (c:CulturalEntity {
        name: $name,
        type: $type,
        description: $description,
        region: $region,
        language: $language,
        significance: $significance,
        category: $category,
        dateAdded: $dateAdded,
        lastUpdated: $lastUpdated,
        popularity: $popularity,
        verified: $verified
      })
      RETURN c.name as name
    `;

    const results = await executeTransaction([
      {
        query,
        parameters: {
          name: entity.name,
          type: entity.type,
          description: entity.description,
          region: entity.region || "",
          language: entity.language || "",
          significance: entity.significance || "",
          category: entity.category || "",
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          popularity: entity.popularity || 5,
          verified: false, // User-added entities are not verified by default
        },
      },
    ]);

    if (results[0].success) {
      console.log(`Successfully added cultural entity: ${entity.name}`);
      return { success: true };
    } else {
      return {
        success: false,
        error: results[0].error || "Failed to add entity",
      };
    }
  } catch (error) {
    console.error("Failed to add cultural entity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
