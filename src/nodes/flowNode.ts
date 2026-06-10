import { createNodeDescriptor, INodeFunctionBaseParams } from "@cognigy/extension-tools";

interface IJwk {
  kid?: string;
  alg?: string;
  kty?: string;
  use?: string;
  key_ops?: string[];
  [key: string]: unknown;
}

interface IJwks {
  keys: IJwk[];
  [key: string]: unknown;
}

export interface IValidateOidcTokenParams extends INodeFunctionBaseParams {
  config: {
    token: string;
    jwksContextKey: string;
    validateAudience: boolean;
    expectedAudience: string;
    expectedIssuer: string;
    alg: string;
    resultContextKey: string;
  };
}

type LogLevel = "debug" | "info" | "warn" | "error";

export const validateToken = createNodeDescriptor({
  type: "validateToken",
  defaultLabel: "Validate OIDC Token",
  preview: { key: "expectedAudience", type: "text" },
  fields: [
    {
      key: "token",
      label: "Token",
      type: "cognigyText",
      defaultValue: "{{cc.env.tokens.tokenC}}",
      params: {
        required: true
      }
    },
    {
      key: "jwksContextKey",
      label: "JWKS Context Key",
      type: "text",
      defaultValue: "auth.jwks",
      params: {
        required: true
      }
    },
    {
      key: "validateAudience",
      label: "Validate Audience",
      type: "toggle",
      defaultValue: true
    },
    {
      key: "expectedAudience",
      label: "Expected Audience",
      type: "cognigyText",
      defaultValue: "placeholder",
      params: {
        required: true
      },
      condition: {
        key: "validateAudience",
        value: true
      }
    },
    {
      key: "expectedIssuer",
      label: "Expected Issuer",
      type: "cognigyText",
      defaultValue: "placeholder",
      params: {
        required: true
      }
    },
    {
      key: "alg",
      label: "Algorithm",
      type: "cognigyText",
      defaultValue: "RS256",
      params: {
        required: true
      }
    },
    {
      key: "resultContextKey",
      label: "Result Context Key",
      type: "text",
      defaultValue: "auth.oidc",
      params: {
        required: true
      }
    }
  ],
  sections: [],
  form: [
    { type: "field", key: "token" },
    { type: "field", key: "jwksContextKey" },
    { type: "field", key: "validateAudience" },
    { type: "field", key: "expectedAudience" },
    { type: "field", key: "expectedIssuer" },
    { type: "field", key: "alg" },
    { type: "field", key: "resultContextKey" }
  ],

  function: async ({ cognigy, config }: INodeFunctionBaseParams) => {
    if (!cognigy) {
      throw new Error("Cognigy object is not available.");
    }

    const { api } = cognigy;

    const {
      token,
      jwksContextKey,
      validateAudience,
      expectedAudience,
      expectedIssuer,
      alg,
      resultContextKey
    } = config as IValidateOidcTokenParams["config"];

    const logMsg = (
      message: string,
      details?: unknown,
      level: LogLevel = "info"
    ) => {
      const serialize = (value: unknown): string => {
        if (!value) return "";

        if (value instanceof Error) {
          return JSON.stringify({
            name: value.name,
            message: value.message,
            stack: value.stack
          });
        }

        if (typeof value === "string") {
          return value;
        }

        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const detailsMessage = serialize(details);
      const fullMessage = detailsMessage
        ? `${message} ${detailsMessage}`
        : message;

      if (api.log) {
        api.log(level, fullMessage);
      } else if (level === "error") {
        console.error(fullMessage);
      } else if (level === "warn") {
        console.warn(fullMessage);
      } else {
        console.log(fullMessage);
      }
    };

    const normalizeJwks = (value: unknown): IJwks => {
      if (Array.isArray(value)) {
        return { keys: value as IJwk[] };
      }

      if (value && typeof value === "object" && Array.isArray((value as IJwks).keys)) {
        return value as IJwks;
      }

      if (value && typeof value === "object" && (value as IJwk).kty) {
        return { keys: [value as IJwk] };
      }

      throw new Error(
        "JWKS must be stored in context as a JWKS object with a keys array, an array of JWKs, or a single JWK object."
      );
    };

    try {
      logMsg("Extension execution started.", {
        hasToken: Boolean(token),
        tokenLength: token?.length,
        jwksContextKey,
        validateAudience,
        expectedAudience: validateAudience ? expectedAudience : "(skipped)",
        expectedIssuer,
        alg,
        resultContextKey
      }, "info");

      if (!token) {
        throw new Error("Token is missing.");
      }

      if (!jwksContextKey) {
        throw new Error("JWKS Context Key is missing.");
      }

      if (validateAudience && !expectedAudience) {
        throw new Error("Expected Audience is missing.");
      }

      if (!expectedIssuer) {
        throw new Error("Expected Issuer is missing.");
      }

      if (!alg) {
        throw new Error("Algorithm is missing.");
      }

      if (!api.getContext) {
        throw new Error("api.getContext is not available.");
      }

      const jwks = api.getContext(jwksContextKey);

      if (!jwks) {
        throw new Error(`No JWKS value found in context at key: ${jwksContextKey}`);
      }

      const { importJWK, jwtVerify, decodeProtectedHeader } = await import("jose");

      const normalizedJwks = normalizeJwks(jwks);

      logMsg("JWKS received from context.", {
        jwksContextKey,
        keyCount: normalizedJwks.keys.length
      }, "info");

      const protectedHeader = decodeProtectedHeader(token);

      logMsg("Decoded token protected header.", {
        kid: protectedHeader.kid,
        alg: protectedHeader.alg,
        typ: protectedHeader.typ
      }, "info");

      if (!protectedHeader.alg) {
        throw new Error("Token header does not contain alg.");
      }

      if (protectedHeader.alg !== alg) {
        throw new Error(`Unexpected token alg. Expected ${alg}, got ${protectedHeader.alg}.`);
      }

      if (!protectedHeader.kid) {
        throw new Error("Token header does not contain kid. Cannot select matching JWK.");
      }

      const matchingJwk = normalizedJwks.keys.find((key) => {
        return key.kid === protectedHeader.kid;
      });

      if (!matchingJwk) {
        throw new Error(`No matching JWK found for token kid: ${protectedHeader.kid}`);
      }

      if (matchingJwk.alg && matchingJwk.alg !== alg) {
        throw new Error(`Matching JWK has unexpected alg. Expected ${alg}, got ${matchingJwk.alg}.`);
      }

      logMsg("Matching JWK found.", {
        kid: matchingJwk.kid,
        kty: matchingJwk.kty,
        alg: matchingJwk.alg,
        use: matchingJwk.use
      }, "info");

      const publicKey = await importJWK(matchingJwk, alg);

      const verificationResult = await jwtVerify(token, publicKey, {
        issuer: expectedIssuer,
        ...(validateAudience ? { audience: expectedAudience } : {}),
        algorithms: [alg]
      });

      logMsg("Token is valid.", {
        kid: verificationResult.protectedHeader.kid,
        alg: verificationResult.protectedHeader.alg,
        issuer: verificationResult.payload.iss,
        audience: verificationResult.payload.aud,
        subject: verificationResult.payload.sub,
        expiresAt: verificationResult.payload.exp
      }, "info");

      if (!api.addToContext) {
        throw new Error("api.addToContext is not available.");
      }

      api.addToContext(
        resultContextKey,
        {
          valid: true,
          payload: verificationResult.payload,
          protectedHeader: verificationResult.protectedHeader
        },
        "simple"
      );
    } catch (error) {
      logMsg("Token validation failed.", error, "error");

      if (api.addToContext && resultContextKey) {
        api.addToContext(
          resultContextKey,
          {
            valid: false,
            error: error instanceof Error ? error.message : String(error)
          },
          "simple"
        );
      }

      // throw error; // we don't want to throw validation errors: we save the validation result and react accordingly
    }
  }
});