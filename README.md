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

# Usage example
1. Get a JSON Web Key (JWK, a cryptographic key or keypair expressed in JSON format), e.g. on https://mkjwk.org/.
Random generation, output will be Public and Private Keypair, Public and Private Keypair Set, Public Key. 
{
    "kty": "RSA",
    "e": "AQAB",
    "use": "sig",
    "kid": "yIy6nT8hzJUKAtIuO6o7rVn_UmWfgR6OwyJZECuBkzk",
    "alg": "RS256",
    "n": "milTqNZzeFTpT1b8aDT8P1GJfs-C4jANt89y3zDt-F3lwQFcHpeYskLp0FJBJIhqeIUOnjG-kCImkEcpaO26IGKDZ51mdNsXX4PwUp1zSZwu9cYG72T2owLR-1pq8PNPcE1tV0f7-oj_XDNcyuZ32ytVIXy657zqEmMXY3K2s1TOffiD6Tq7waAeYVfnRq5PPJjpQin3cv9FAyuJk4vbjKCJaOrkwwTa-dNmHTkwT4SmX5KhU7JaefamvPLEaR0vq7YODFDxV0K9FvcxE6g4zluE-3RIFRqdRka6z2JefwjHvIlccqPGsxf1KmRGZGF0E2plF5vWSpwAdmGmYwQHDw"
}
Copy Private Key (X.509 PEM Format) to later use for signing the token.

2. Generate Encoded JWT, e.g. on https://www.jwt.io/.

- inputs: 
    - Header:
    ```Algorithm & Token Type
    {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "yIy6nT8hzJUKAtIuO6o7rVn_UmWfgR6OwyJZECuBkzk"
    }
    ```
    - Payload
    ```Data
    {
        "sub": "user-123",
        "name": "Test User",
        "iss": "https://auth.example.com",
        "aud": "my-app-client-id",
        "iat": 1700000000,
        "exp": 9999999999
    }
    ```
    - Sign JWT
    ```
    -----BEGIN PRIVATE KEY-----
    MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCaKVOo1nN4VOlP
    VvxoNPw/UYl+z4LiMA23z3LfMO34XeXBAVwel5iyQunQUkEkiGp4hQ6eMb6QIiaQ
    Rylo7bogYoNnnWZ02xdfg/BSnXNJnC71xgbvZPajAtH7Wmrw809wTW1XR/v6iP9c
    M1zK5nfbK1UhfLrnvOoSYxdjcrazVM59+IPpOrvBoB5hV+dGrk88mOlCKfdy/0UD
    K4mTi9uMoIlo6uTDBNr502YdOTBPhKZfkqFTslp59qa88sRpHS+rtg4MUPFXQr0W
    9zETqDjOW4T7dEgVGp1GRrrPYl5/CMe8iVxyo8azF/UqZEZkYXQTamUXm9ZKnAB2
    YaZjBAcPAgMBAAECggEAAgtMPa/iRhUyJsgrfqI9OgW1wgW0YZVriSVqC4WVkjaE
    hmOjOhCeiLaUbRu6G2bnqoNxJy3XrgeV5VHcPbTxQ96qiWQv6JrDG5QfSqklzzMP
    +FhQ3TnEf3LZH/EZ++nuAro0GfUtZSwN3sYbk+Esc66GaXRC8jGyFN5VgA8UVxpi
    f6dt/Q8twIkieH8X9nwmWwylZe9SCAPeiZpwOg08FTv2iB05LF01mqxQ1a6Yk1IK
    LXnzfZA9tzjhjNyycIb1GLMegdkzx82plEMISolm7xlJJGUf4e9VWYJiVpR8uEVO
    jZL/SMZeTSxJHg1lRubKBICBRJtCvcnnpCCF14uT8QKBgQC7ovdRqH5gM5ccgNp6
    X7kjwx5fCjIg8buLnWQRrZqpaqfjqCTLNt+/Tmc8H0hYWWyD3K9RXwhMQ6Sp/pTu
    0A+63EbJpspLlF4XtMWCaPZIHxWvDxhMyNUwnxeOYpIGynul4Qj6XSBf55DdJHBx
    GB+B4lFLxv/uUi2k6hkxevJuyQKBgQDSVBpXhZ70PMLkhsSUy9J0eXpodsyK/ZyH
    LYTw1LhMzWj0rklnJYOuaSm7OekbvfDOsfwRWcnKBmuvDBDbbHPKV8RX2WLREIjq
    Vx0xTDi5ctEbPw+ZxUjgLeQY/hlQHgHXp8kwXX71zphjojq7lLUnuMAzNML7/PRF
    Jk5bjTX7FwKBgBBT+x+hAPZQJvs0/04c3FiPVypAEeKqBn78wEOFjurlPBzkeecx
    LEFSiktCEaKWjYnf/2WeVnOEg2TDoaQyeNvy5ToRCJORIqr/cRyLE7ts8Q8dyiiM
    ZXjorz0VuM1ce2wQ7B4VUobl+MY1sI824S8FSbvFYmoTvqMWOAEFSOl5AoGAWhkg
    96ELyIBG1HJOv5bYXoCzSRCq6ldduCJtsmTNVkkfzsDiPMc7M3llIQjbrMCe6Uwh
    OKWH5Xz+oAvBJN2+dE1IlIFQ7VHx9MDAhp+qJPbkUJGg8zQp1a6S6Ynf+gwAqgr8
    CjXi7xVC/ls+YaCAQbXIz6aoaB2h3gVcx6ckGp0CgYANpS3xQJEvcTWg5K0+G7go
    W3Hqy5wjEMT63FAtz1KQ4XqHMHV5dfGmndpLhQCs3+v+MHs6mRDBzyqNUaE5uYUb
    3RFmd3PQWUYo9jKQTcNQOwZAgbRTgA9YvFvqnp8yPxAabPN0toIkiy7yXhoCblFJ
    EruEosyf4QhTasHEG4j9WQ==
    -----END PRIVATE KEY-----
    ```
    - Generate example `RS256`


- output: 

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InlJeTZuVDhoekpVS0F0SXVPNm83clZuX1VtV2ZnUjZPd3lKWkVDdUJremsifQ.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJhdWQiOiJteS1hcHAtY2xpZW50LWlkIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.NiPHg13MkbAWfD6D9bPF4LXjPv56mroRth8_Yuba9mOtKHQ682wbN6u3tSZmPmKJo_Rw6mwvEReXI_vRM4p8YyDxmFzJO9cW0QNPP9elCItb0BjDkgU9iHE0pR88xSrnF3Bhr2CCaOt_N-JA1duTUGpP7h6FfXRqB_Cf6RnFe3RMSj0BW0vQYNLB1JtWOX63mRivHtXxYmlDuwq69X_394hibPc2j8yRhlVrkVhn0yXsLTNYONVWE-zP4G18ZIkb5Rx3OfnJ-ayrpfSwSXoxuVLbSM9XqyEjItnMg7PQc_nPanrAQASIhLnPtMqOAvhUXzuNrrM-UDkjDAbszsVJew
```

To test the extension, copy test data to Context: 
```
cc.token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InlJeTZuVDhoekpVS0F0SXVPNm83clZuX1VtV2ZnUjZPd3lKWkVDdUJremsifQ.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJhdWQiOiJteS1hcHAtY2xpZW50LWlkIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.NiPHg13MkbAWfD6D9bPF4LXjPv56mroRth8_Yuba9mOtKHQ682wbN6u3tSZmPmKJo_Rw6mwvEReXI_vRM4p8YyDxmFzJO9cW0QNPP9elCItb0BjDkgU9iHE0pR88xSrnF3Bhr2CCaOt_N-JA1duTUGpP7h6FfXRqB_Cf6RnFe3RMSj0BW0vQYNLB1JtWOX63mRivHtXxYmlDuwq69X_394hibPc2j8yRhlVrkVhn0yXsLTNYONVWE-zP4G18ZIkb5Rx3OfnJ-ayrpfSwSXoxuVLbSM9XqyEjItnMg7PQc_nPanrAQASIhLnPtMqOAvhUXzuNrrM-UDkjDAbszsVJew" // https://www.jwt.io/
cc.auth = {}
cc.auth.jwks = {
  "keys": [
    {
      "kty": "RSA",
      "e": "AQAB",
      "use": "sig",
      "kid": "yIy6nT8hzJUKAtIuO6o7rVn_UmWfgR6OwyJZECuBkzk",
      "alg": "RS256",
      "n": "milTqNZzeFTpT1b8aDT8P1GJfs-C4jANt89y3zDt-F3lwQFcHpeYskLp0FJBJIhqeIUOnjG-kCImkEcpaO26IGKDZ51mdNsXX4PwUp1zSZwu9cYG72T2owLR-1pq8PNPcE1tV0f7-oj_XDNcyuZ32ytVIXy657zqEmMXY3K2s1TOffiD6Tq7waAeYVfnRq5PPJjpQin3cv9FAyuJk4vbjKCJaOrkwwTa-dNmHTkwT4SmX5KhU7JaefamvPLEaR0vq7YODFDxV0K9FvcxE6g4zluE-3RIFRqdRka6z2JefwjHvIlccqPGsxf1KmRGZGF0E2plF5vWSpwAdmGmYwQHDw"
    }
  ]
} // https://mkjwk.org/
```
Specify `my-app-client-id` as Expected Audience, `https://auth.example.com` as Expected Issuer and `RS256` as Algorithm. 
For the valid data, the result will be 
```
"oidc": {
      "valid": true,
      "payload": {
        "sub": "user-123",
        "name": "Test User",
        "iss": "https://auth.example.com",
        "aud": "my-app-client-id",
        "iat": 1700000000,
        "exp": 9999999999
      },
      "protectedHeader": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "yIy6nT8hzJUKAtIuO6o7rVn_UmWfgR6OwyJZECuBkzk"
      }
    }
```

Otherwise an error will be stored in the Context field instead. 