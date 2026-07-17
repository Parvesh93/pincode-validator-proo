import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";

import { authenticate } from "../shopify.server";

type ReverseGeocodeAddress = {
  postcode?: unknown;
  city?: unknown;
  town?: unknown;
  village?: unknown;
  municipality?: unknown;
  county?: unknown;
  state_district?: unknown;
  state?: unknown;
  country?: unknown;
  country_code?: unknown;
};

type ReverseGeocodeResponse = {
  error?: unknown;
  display_name?: unknown;
  address?: ReverseGeocodeAddress;
};

type LocationRequestBody = {
  latitude?: unknown;
  longitude?: unknown;
};

type LocationSuccessResponse = {
  success: true;
  pincode: string;
  city: string | null;
  state: string | null;
  country: string | null;
  displayName: string | null;
  attribution: string;
};

type LocationErrorResponse = {
  success: false;
  pincode: null;
  message: string;
};

const REVERSE_GEOCODING_URL =
  "https://nominatim.openstreetmap.org/reverse";

const REQUEST_TIMEOUT_MS = 10_000;

const OPENSTREETMAP_ATTRIBUTION =
  "© OpenStreetMap contributors";

function normalizeString(
  value: unknown,
  fallback = "",
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();

  return normalized || fallback;
}

function normalizeCoordinate(
  value: unknown,
): number | null {
  const coordinate =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(coordinate)) {
    return null;
  }

  return coordinate;
}

function normalizeIndianPincode(
  value: unknown,
): string | null {
  const rawValue = normalizeString(value);

  if (!rawValue) {
    return null;
  }

  /*
   * Some providers may return a postcode with spaces or
   * additional text. Keep digits only and then validate it.
   */
  const digits = rawValue.replace(/\D/g, "");

  if (!/^[1-9][0-9]{5}$/.test(digits)) {
    return null;
  }

  return digits;
}

function isValidLatitude(
  latitude: number,
): boolean {
  return latitude >= -90 && latitude <= 90;
}

function isValidLongitude(
  longitude: number,
): boolean {
  return longitude >= -180 && longitude <= 180;
}

function isLocationInIndia(
  address: ReverseGeocodeAddress,
): boolean {
  const countryCode = normalizeString(
    address.country_code,
  ).toLowerCase();

  const country = normalizeString(
    address.country,
  ).toLowerCase();

  return (
    countryCode === "in" ||
    country === "india"
  );
}

function getCity(
  address: ReverseGeocodeAddress,
): string | null {
  const city =
    normalizeString(address.city) ||
    normalizeString(address.town) ||
    normalizeString(address.village) ||
    normalizeString(address.municipality) ||
    normalizeString(address.county) ||
    normalizeString(address.state_district);

  return city || null;
}

function getState(
  address: ReverseGeocodeAddress,
): string | null {
  return (
    normalizeString(address.state) ||
    normalizeString(address.state_district) ||
    null
  );
}

function getApplicationUserAgent(): string {
  const configuredUserAgent = normalizeString(
    process.env.GEOCODING_USER_AGENT,
  );

  if (configuredUserAgent) {
    return configuredUserAgent;
  }

  return "PincodeValidatorPro/1.0";
}

function getApplicationContactEmail(): string | null {
  const email = normalizeString(
    process.env.GEOCODING_CONTACT_EMAIL,
  );

  return email || null;
}

async function parseRequestBody(
  request: Request,
): Promise<LocationRequestBody | null> {
  try {
    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return null;
    }

    return body as LocationRequestBody;
  } catch {
    return null;
  }
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResponse> {
  const url = new URL(
    REVERSE_GEOCODING_URL,
  );

  url.searchParams.set(
    "lat",
    String(latitude),
  );

  url.searchParams.set(
    "lon",
    String(longitude),
  );

  url.searchParams.set(
    "format",
    "jsonv2",
  );

  url.searchParams.set(
    "addressdetails",
    "1",
  );

  url.searchParams.set(
    "zoom",
    "18",
  );

  url.searchParams.set(
    "accept-language",
    "en",
  );

  /*
   * Restrict the result to India because this app currently
   * validates six-digit Indian pincodes.
   */
  url.searchParams.set(
    "countrycodes",
    "in",
  );

  const contactEmail =
    getApplicationContactEmail();

  if (contactEmail) {
    url.searchParams.set(
      "email",
      contactEmail,
    );
  }

  const controller =
    new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Accept: "application/json",

          "User-Agent":
            getApplicationUserAgent(),
        },

        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Reverse-geocoding request failed with status ${response.status}`,
      );
    }

    const body: unknown =
      await response.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new Error(
        "Reverse-geocoding service returned an invalid response",
      );
    }

    return body as ReverseGeocodeResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function action({
  request,
}: ActionFunctionArgs) {
  try {
    const { session } =
      await authenticate.public.appProxy(
        request,
      );

    const shopDomain = normalizeString(
      session?.shop,
    );

    if (!shopDomain) {
      return data<LocationErrorResponse>(
        {
          success: false,
          pincode: null,
          message: "Shop not found",
        },
        {
          status: 400,
        },
      );
    }

    const body =
      await parseRequestBody(request);

    if (!body) {
      return data<LocationErrorResponse>(
        {
          success: false,
          pincode: null,
          message:
            "Invalid request body",
        },
        {
          status: 400,
        },
      );
    }

    const latitude =
      normalizeCoordinate(
        body.latitude,
      );

    const longitude =
      normalizeCoordinate(
        body.longitude,
      );

    if (
      latitude === null ||
      longitude === null ||
      !isValidLatitude(latitude) ||
      !isValidLongitude(longitude)
    ) {
      return data<LocationErrorResponse>(
        {
          success: false,
          pincode: null,
          message:
            "Valid latitude and longitude are required",
        },
        {
          status: 400,
        },
      );
    }

    const geocodingResult =
      await reverseGeocode(
        latitude,
        longitude,
      );

    if (
      typeof geocodingResult.error ===
        "string" &&
      geocodingResult.error.trim()
    ) {
      return data<LocationErrorResponse>(
        {
          success: false,
          pincode: null,
          message:
            "An address could not be found for your location",
        },
        {
          status: 404,
        },
      );
    }

    const address =
      geocodingResult.address;

    if (
      !address ||
      typeof address !== "object"
    ) {
      return data<LocationErrorResponse>(
        {
          success: false,
          pincode: null,
          message:
            "An address could not be found for your location",
        },
        {
          status: 404,
        },
      );
    }

    if (!isLocationInIndia(address)) {
      return data<LocationErrorResponse>(
        {
          success: false,
          pincode: null,
          message:
            "Pincode detection is currently available only in India",
        },
        {
          status: 422,
        },
      );
    }

    const pincode =
      normalizeIndianPincode(
        address.postcode,
      );

    if (!pincode) {
      return data<LocationErrorResponse>(
        {
          success: false,
          pincode: null,
          message:
            "A valid six-digit pincode could not be found for this location",
        },
        {
          status: 404,
        },
      );
    }

    const response: LocationSuccessResponse =
      {
        success: true,
        pincode,
        city: getCity(address),
        state: getState(address),

        country:
          normalizeString(
            address.country,
          ) || "India",

        displayName:
          normalizeString(
            geocodingResult.display_name,
          ) || null,

        attribution:
          OPENSTREETMAP_ATTRIBUTION,
      };

    return data(response);
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      console.error(
        "[Pincode Validator] Reverse geocoding timed out",
      );

      return data<LocationErrorResponse>(
        {
          success: false,
          pincode: null,
          message:
            "Location lookup timed out. Please enter your pincode manually.",
        },
        {
          status: 504,
        },
      );
    }

    console.error(
      "[Pincode Validator] Reverse geocoding failed:",
      error,
    );

    return data<LocationErrorResponse>(
      {
        success: false,
        pincode: null,
        message:
          "Your pincode could not be detected. Please enter it manually.",
      },
      {
        status: 500,
      },
    );
  }
}