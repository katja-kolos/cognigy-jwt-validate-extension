# Cognigy Extension to validate JWKs

Finds `jwks_uri` in `...well-known/openid-configuration`;
fetches keys of format 
```
const jwk = {
  kty: 'RSA',
  n: 'very-long-string',
  e: 'AQAB',
}
```
as described here: https://github.com/panva/jose/blob/main/docs/jwt/verify/functions/jwtVerify.md
and applies a public library (`jose`) to validate encoded RSA key with a public JWK.
Saves result to context:
```
    {
        payload,
        protectedHeader
    }
```