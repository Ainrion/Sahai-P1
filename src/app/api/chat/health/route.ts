import { NextResponse } from "next/server";
import {
  aiProviderService,
  PROVIDER_CONFIGS,
  AIProvider,
} from "../../../lib/aiProviders";

export async function GET() {
  try {
    const availableProviders = aiProviderService.getAvailableProviders();
    const allProviders = Object.keys(PROVIDER_CONFIGS) as AIProvider[];

    const healthStatus: Record<string, any> = {};
    let overallHealthy = false;

    // Test each available provider
    for (const provider of allProviders) {
      const isAvailable = aiProviderService.isProviderAvailable(provider);
      const config = PROVIDER_CONFIGS[provider];

      healthStatus[provider] = {
        name: config.name,
        model: config.model,
        available: isAvailable,
        status: isAvailable ? "configured" : "missing_api_key",
      };

      if (isAvailable) {
        overallHealthy = true;
        // Optionally test with a simple request (commented out to avoid unnecessary API calls)
        // try {
        //   const testStream = aiProviderService.streamChat(provider, [
        //     { role: "user", content: "Hi" }
        //   ]);
        //   const firstChunk = await testStream.next();
        //   healthStatus[provider].status = "working";
        //   healthStatus[provider].tested = true;
        // } catch (error) {
        //   healthStatus[provider].status = "error";
        //   healthStatus[provider].error = error instanceof Error ? error.message : "Unknown error";
        // }
      }
    }

    return NextResponse.json({
      status: overallHealthy ? "healthy" : "no_providers_available",
      providers: healthStatus,
      available_count: availableProviders.length,
      total_count: allProviders.length,
      available_providers: availableProviders,
      message: overallHealthy
        ? `${availableProviders.length} AI provider(s) available`
        : "No AI providers configured. Please set API keys.",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        error: "Health check failed",
        message: "Unable to perform health check",
        status: "error",
      },
      { status: 503 }
    );
  }
}
