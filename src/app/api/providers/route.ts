import { NextResponse } from "next/server";
import { aiProviderService, PROVIDER_CONFIGS } from "../../lib/aiProviders";

export async function GET() {
  try {
    const availableProviders = aiProviderService.getAvailableProviders();

    const providers = availableProviders.map((provider) => ({
      id: provider,
      ...PROVIDER_CONFIGS[provider],
      available: true,
    }));

    const unavailableProviders = (
      Object.keys(PROVIDER_CONFIGS) as Array<keyof typeof PROVIDER_CONFIGS>
    )
      .filter((provider) => !availableProviders.includes(provider))
      .map((provider) => ({
        id: provider as string,
        ...PROVIDER_CONFIGS[provider],
        available: false,
      }));

    return NextResponse.json({
      available: providers,
      unavailable: unavailableProviders,
      total: providers.length,
      defaultProvider: process.env.DEFAULT_PROVIDER || "groq",
    });
  } catch (error) {
    console.error("Error getting providers:", error);
    return NextResponse.json(
      { error: "Failed to get provider information" },
      { status: 500 }
    );
  }
}
