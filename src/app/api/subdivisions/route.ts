import { NextResponse, type NextRequest } from "next/server";
import { State } from "country-state-city";
import {
  SUBDIVISION_OVERRIDES,
  SUBDIVISION_NAMES,
} from "@/lib/subdivision-names";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  if (!country || country.length !== 2) {
    return NextResponse.json({ subdivisions: [] });
  }

  const code = country.toUpperCase();

  const subdivisions =
    SUBDIVISION_OVERRIDES[code] ??
    (() => {
      const nameOverrides = SUBDIVISION_NAMES[code] ?? {};
      return State.getStatesOfCountry(code).map((s) => ({
        code: `${code}-${s.isoCode}`,
        name: nameOverrides[s.isoCode] ?? s.name,
      }));
    })();

  return NextResponse.json({ subdivisions });
}
