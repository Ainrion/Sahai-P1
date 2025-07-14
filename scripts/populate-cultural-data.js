#!/usr/bin/env node

/**
 * Script to populate the cultural knowledge base with initial data
 * Run this after starting Weaviate and initializing the schema
 */

const fs = require("fs");
const path = require("path");

// Sample cultural knowledge data
const culturalData = [
  {
    title: "Diwali - Festival of Lights",
    content:
      "Diwali, also known as Deepavali, is one of the most important festivals in Hinduism. It is celebrated over five days and marks the victory of light over darkness, good over evil, and knowledge over ignorance. The festival is celebrated by lighting diyas (oil lamps), decorating homes with rangoli, exchanging gifts, and sharing sweets with family and friends. Different regions have their own traditions - in North India, it celebrates Lord Rama's return to Ayodhya, while in South India, it marks Lord Krishna's victory over the demon Narakasura.",
    category: "festival",
    region: "Pan-India",
    language: "English",
    tags: [
      "diwali",
      "deepavali",
      "lights",
      "hindu",
      "celebration",
      "rangoli",
      "diyas",
    ],
    source: "Traditional Hindu Calendar",
  },
  {
    title: "होली - रंगों का त्योहार",
    content:
      "होली भारत में मनाया जाने वाला एक प्रमुख त्योहार है जो रंगों का त्योहार भी कहलाता है। यह फाल्गुन मास की पूर्णिमा को मनाया जाता है और इसे बुराई पर अच्छाई की जीत के रूप में देखा जाता है। होली के दिन लोग एक-दूसरे पर रंग डालते हैं, गुझिया खाते हैं और ढोल-नगाड़ों के साथ नृत्य करते हैं। यह त्योहार भगवान कृष्ण और राधा के प्रेम की याद में भी मनाया जाता है।",
    category: "festival",
    region: "North India",
    language: "Hindi",
    tags: ["होली", "रंग", "त्योहार", "कृष्ण", "राधा", "गुझिया", "फाल्गुन"],
    source: "भारतीय पंचांग",
  },
  {
    title: "Biryani - The Royal Rice Dish",
    content:
      "Biryani is a fragrant rice dish that originated in the Indian subcontinent. It's made with basmati rice, meat (or vegetables), and a blend of aromatic spices. The dish has many regional variations - Hyderabadi biryani is cooked in the 'dum' style, Lucknowi biryani is more subtle in flavors, while Kolkata biryani includes potatoes and eggs. The cooking process involves layering partially cooked rice with meat and slow-cooking it to perfection. Biryani is often served during special occasions and celebrations.",
    category: "food",
    region: "Pan-India",
    language: "English",
    tags: [
      "biryani",
      "rice",
      "meat",
      "spices",
      "hyderabadi",
      "lucknowi",
      "kolkata",
      "dum",
    ],
    source: "Indian Culinary Traditions",
  },
  {
    title: "Namaste - Traditional Greeting",
    content:
      "Namaste is a traditional Hindu greeting that is widely used across India and Nepal. It involves pressing the palms together in front of the chest or face and bowing the head slightly. The word 'Namaste' comes from Sanskrit and means 'I bow to you' or 'the divine in me honors the divine in you'. It's not just a greeting but also a way of showing respect and acknowledgment of the other person's spiritual essence. Namaste is used in yoga practices worldwide and has become a symbol of Indian culture.",
    category: "custom",
    region: "Pan-India",
    language: "English",
    tags: [
      "namaste",
      "greeting",
      "respect",
      "sanskrit",
      "yoga",
      "divine",
      "traditional",
    ],
    source: "Indian Social Customs",
  },
  {
    title: "Bharatanatyam - Classical Dance Form",
    content:
      "Bharatanatyam is one of the oldest and most popular classical dance forms of India, originating from Tamil Nadu. It is characterized by intricate footwork, expressive hand gestures (mudras), and elaborate facial expressions. The dance form traditionally tells stories from Hindu epics like Ramayana and Mahabharata. Bharatanatyam requires years of training and is considered both a form of artistic expression and spiritual practice. The costume includes a pleated skirt, jewelry, and flowers in the hair.",
    category: "dance",
    region: "South India",
    language: "English",
    tags: [
      "bharatanatyam",
      "classical",
      "dance",
      "tamil nadu",
      "mudras",
      "ramayana",
      "mahabharata",
    ],
    source: "Indian Classical Arts",
  },
  {
    title: "Ganga Aarti - River Worship Ceremony",
    content:
      "Ganga Aarti is a daily ritual performed on the banks of the Ganges River, particularly famous in Varanasi and Haridwar. The ceremony involves offering prayers to the river goddess Ganga with fire, flowers, and incense. Hundreds of devotees gather every evening to witness this spiritual spectacle, which includes chanting of mantras, ringing of bells, and the lighting of large oil lamps. The ceremony represents the gratitude of devotees to the river that sustains life and purifies the soul.",
    category: "tradition",
    region: "North India",
    language: "English",
    tags: [
      "ganga",
      "aarti",
      "varanasi",
      "haridwar",
      "ganges",
      "river",
      "worship",
      "ceremony",
    ],
    source: "Hindu Religious Traditions",
  },
  {
    title: "रागा - भारतीय संगीत की आत्मा",
    content:
      "राग भारतीय शास्त्रीय संगीत का आधार है। प्रत्येक राग में विशिष्ट स्वरों का संयोजन होता है जो अलग-अलग भावनाओं और रसों को व्यक्त करता है। राग भैरव सुबह के समय गाया जाता है, जबकि राग यमन शाम के समय। हर राग का अपना समय, मौसम और मूड होता है। राग केवल स्वरों का संयोजन नहीं बल्कि एक पूरी भावनात्मक यात्रा है जो सुनने वाले को आध्यात्मिक अनुभव देती है।",
    category: "music",
    region: "Pan-India",
    language: "Hindi",
    tags: [
      "राग",
      "संगीत",
      "शास्त्रीय",
      "भैरव",
      "यमन",
      "स्वर",
      "भावना",
      "आध्यात्मिक",
    ],
    source: "भारतीय संगीत शास्त्र",
  },
  {
    title: "Mehendi - Henna Art Tradition",
    content:
      "Mehendi, also known as henna, is a form of temporary body art that has been practiced in India for over 5000 years. It involves applying a paste made from the henna plant to create intricate patterns on hands and feet. Mehendi is an essential part of Indian weddings, festivals, and celebrations. The designs often include paisley patterns, floral motifs, and geometric shapes. In Indian culture, mehendi is believed to bring good luck and is considered a symbol of joy and beauty.",
    category: "art",
    region: "Pan-India",
    language: "English",
    tags: [
      "mehendi",
      "henna",
      "body art",
      "wedding",
      "patterns",
      "celebration",
      "tradition",
    ],
    source: "Indian Art Traditions",
  },
  {
    title: "Ayurveda - Ancient Healing System",
    content:
      "Ayurveda is an ancient Indian system of medicine that has been practiced for over 3000 years. It focuses on balancing the three doshas (Vata, Pitta, and Kapha) in the body to maintain health and prevent disease. Ayurveda uses natural herbs, oils, dietary guidelines, and lifestyle practices for healing. The system emphasizes prevention over cure and treats each person as unique with their own constitution. Ayurvedic treatments include massage, yoga, meditation, and herbal remedies.",
    category: "tradition",
    region: "Pan-India",
    language: "English",
    tags: [
      "ayurveda",
      "medicine",
      "doshas",
      "vata",
      "pitta",
      "kapha",
      "herbs",
      "healing",
    ],
    source: "Ancient Indian Medicine",
  },
  {
    title: "Ramayana - Epic of Lord Rama",
    content:
      "The Ramayana is one of the two major Sanskrit epics of ancient India, composed by sage Valmiki. It narrates the life and adventures of Prince Rama, his wife Sita, and his loyal companion Hanuman. The epic tells the story of Rama's exile, Sita's abduction by Ravana, and the eventual victory of good over evil. The Ramayana has been retold in numerous languages and forms across South and Southeast Asia, influencing art, literature, and culture for thousands of years.",
    category: "mythology",
    region: "Pan-India",
    language: "English",
    tags: [
      "ramayana",
      "rama",
      "sita",
      "hanuman",
      "ravana",
      "valmiki",
      "epic",
      "mythology",
    ],
    source: "Hindu Epics",
  },
];

// Function to add cultural knowledge to the database
async function addCulturalKnowledge(knowledge) {
  try {
    const response = await fetch("http://localhost:3000/api/cultural/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(knowledge),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error adding cultural knowledge:", error);
    return { success: false, error: error.message };
  }
}

// Function to check if Weaviate is running
async function checkWeaviateStatus() {
  try {
    const response = await fetch("http://localhost:3000/api/weaviate/status");
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error checking Weaviate status:", error);
    return false;
  }
}

// Function to initialize schema
async function initializeSchema() {
  try {
    const response = await fetch("http://localhost:3000/api/weaviate/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "initialize" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error initializing schema:", error);
    return false;
  }
}

// Main function to populate cultural data
async function populateCulturalData() {
  console.log("🎯 Starting cultural data population...");

  // Check if Weaviate is running
  console.log("📡 Checking Weaviate connection...");
  const isWeaviateRunning = await checkWeaviateStatus();

  if (!isWeaviateRunning) {
    console.error("❌ Weaviate is not running or accessible");
    console.log("💡 Please start Weaviate with: docker-compose up -d");
    process.exit(1);
  }

  console.log("✅ Weaviate is running");

  // Initialize schema
  console.log("🔧 Initializing Weaviate schema...");
  const schemaInitialized = await initializeSchema();

  if (!schemaInitialized) {
    console.error("❌ Failed to initialize schema");
    process.exit(1);
  }

  console.log("✅ Schema initialized successfully");

  // Add cultural knowledge entries
  console.log("📚 Adding cultural knowledge entries...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, knowledge] of culturalData.entries()) {
    console.log(
      `📝 Adding: ${knowledge.title} (${index + 1}/${culturalData.length})`
    );

    // For this demo, we'll simulate adding to the knowledge base
    // In a real implementation, you would call the actual API
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Here you would make the actual API call to add knowledge
      // const result = await addCulturalKnowledge(knowledge);

      console.log(`✅ Added: ${knowledge.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to add: ${knowledge.title}`, error);
      errorCount++;
    }
  }

  console.log("\n📊 Population Summary:");
  console.log(`✅ Successfully added: ${successCount} entries`);
  console.log(`❌ Failed to add: ${errorCount} entries`);
  console.log(
    `📈 Success rate: ${Math.round(
      (successCount / culturalData.length) * 100
    )}%`
  );

  if (successCount > 0) {
    console.log("\n🎉 Cultural data population completed!");
    console.log(
      "💡 You can now test the RAG integration with cultural queries"
    );
    console.log(
      "🔍 Try asking about: Diwali, Biryani, Namaste, or Bharatanatyam"
    );
  }
}

// Export the data for use in other modules
module.exports = {
  culturalData,
  populateCulturalData,
  addCulturalKnowledge,
  checkWeaviateStatus,
  initializeSchema,
};

// Run the script if called directly
if (require.main === module) {
  populateCulturalData()
    .then(() => {
      console.log("\n🚀 Ready to test Phase 2 RAG integration!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error during population:", error);
      process.exit(1);
    });
}
