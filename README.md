# OAuth: From First Principles

## Part 1: The World Before OAuth — The Problem

It's 2005-2006. Web services are exploding. Flickr has your photos, Google has your contacts, Twitter has your tweets. Now a new app comes along — say, a photo printing service — and it wants to access your Flickr photos.

The only mechanism available:

```
YOU  ──── "Here's my Flickr username and password" ────>  PRINTING APP
                                                              │
                                                              │ (logs in AS you)
                                                              v
                                                           FLICKR
```

This is called the **password anti-pattern** (or credential sharing). The third-party app impersonates you. Think about what this implies:

**Problem 1 — All-or-nothing access.** The printing app now has your full Flickr credentials. It can delete photos, change your profile, read your private messages. You wanted "read my public photos." You gave "do anything as me."

**Problem 2 — Revocation is impossible without collateral damage.** The only way to cut off the printing app is to change your password. But now every other app you gave your password to also breaks. And you're locked out of your own account until you update everything.

**Problem 3 — Trust amplification.** If the printing app's database is breached, your Flickr password is exposed. If you reused that password (most people do), your email, bank, everything is compromised.

**Problem 4 — No audit trail.** Flickr can't distinguish between "you logged in" and "the printing app logged in." There's no way to see which third-party apps have access.

The core need: **delegated authorization** — letting a third-party app do specific things on your behalf, without giving it your credentials, with the ability to revoke access independently.

---

## Part 2: OAuth 1.0 — The First Attempt (2007–2010)

### Origin

In late 2006, Blaine Cook (Twitter) was implementing OpenID for Twitter, and Larry Halff (Ma.gnolia) needed to delegate access with OpenID. No open standard existed. Google had AuthSub, Yahoo had BBAuth, Flickr had FlickrAuth — all proprietary, all incompatible. In April 2007, a small group (Cook, Chris Messina, David Recordon, others) formed a mailing list and created the OAuth spec. Twitter deployed it first.

OAuth 1.0 was published as an informational RFC 5849 in April 2010.

### Terminology (OAuth 1.0)

```
OAuth 1.0 Term         │  What It Means
────────────────────────┼──────────────────────────────────────────
User                    │  The human who owns the data
Service Provider        │  The server holding the data (e.g., Flickr)
Consumer                │  The third-party app wanting access
Consumer Key            │  Public identifier for the Consumer (like a username)
Consumer Secret         │  Secret known only to Consumer + Service Provider
Request Token           │  Temporary token used during the authorization dance
Token Secret            │  Secret paired with each token (used for signing)
Access Token            │  Long-lived token representing granted access
Verifier                │  One-time code proving the User authorized access
```

### The Flow (Three-Legged OAuth 1.0)

"Three-legged" because three parties are involved: User, Consumer, Service Provider.

```
  CONSUMER (App)                    SERVICE PROVIDER (e.g., Twitter)
       │                                        │
       │ ──── (1) POST /request_token ────────> │
       │       signed with Consumer Secret      │
       │ <──── Request Token + Token Secret ─── │
       │                                        │
       │                                        │
       │ ──── (2) Redirect User ──────────────> │
       │      to /authorize?oauth_token=RT      │
       │                                        │
       │         USER sees: "PrintApp wants     │
       │          read access to your photos.   │
       │          Allow / Deny?"                │
       │                                        │
       │ <──── (3) User approves ────────────── │
       │       Redirect back to Consumer        │
       │       with oauth_verifier=XYZ          │
       │                                        │
       │ ──── (4) POST /access_token ─────────> │
       │       Request Token + Verifier         │
       │       signed with Consumer Secret      │
       │             + Token Secret             │
       │ <──── Access Token + new Token Secret ─│
       │                                        │
       │                                        │
       │ ──── (5) GET /api/photos ────────────> │
       │       signed with Consumer Secret      │
       │             + Access Token Secret      │
       │ <──── Protected Resource ────────────  │
```

### Step-by-step breakdown

**(1) Obtaining a Request Token** — The Consumer makes a signed POST to the Service Provider. The request includes `oauth_consumer_key`, `oauth_signature_method`, `oauth_timestamp`, `oauth_nonce`, and `oauth_signature`. The Service Provider responds with a temporary Request Token and a Token Secret.

**(2) User Authorization** — The Consumer redirects the User's browser to the Service Provider's authorization page. The User sees what the Consumer is asking for and clicks "Allow."

**(3) Callback with Verifier** — The Service Provider redirects the User back to the Consumer's callback URL with an `oauth_verifier` — a one-time code proving the User actually approved.

**(4) Exchanging for Access Token** — The Consumer sends the Request Token + Verifier (signed) to get a long-lived Access Token + new Token Secret.

**(5) Accessing Resources** — Every API request is signed using both the Consumer Secret and the Access Token Secret.

### The Signature — The Heart and the Achilles' Heel

This is where things get painful. Every single API request in OAuth 1.0 must be **cryptographically signed**. Here's how:

**Step A — Build the Signature Base String:**

```
Signature Base String = HTTP_METHOD + "&" +
                        percent_encode(URL) + "&" +
                        percent_encode(sorted_params)
```

All OAuth parameters, query parameters, and POST body parameters get collected, sorted lexicographically by key, and concatenated. Then the whole thing is percent-encoded.

Example:

```
POST&https%3A%2F%2Fapi.twitter.com%2F1%2Fstatuses%2Fupdate.json&oauth_consumer_key%3Ddpf43f...%26oauth_nonce%3Dkllo9940pd9333jh%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1191242096%26oauth_token%3Dnnch734d...%26oauth_version%3D1.0%26status%3DHello%2520Ladies
```

**Step B — Compute HMAC-SHA1:**

```
signing_key = percent_encode(consumer_secret) + "&" + percent_encode(token_secret)

signature = HMAC-SHA1(signing_key, signature_base_string)

oauth_signature = Base64(signature)
```

**Step C — Send in Authorization header:**

```
Authorization: OAuth oauth_consumer_key="dpf43f...",
                     oauth_nonce="kllo9940pd9333jh",
                     oauth_signature="tR3%2BTy81lMeYAr...",
                     oauth_signature_method="HMAC-SHA1",
                     oauth_timestamp="1191242096",
                     oauth_token="nnch734d...",
                     oauth_version="1.0"
```

### Why Signatures Existed

The reason for all this: **OAuth 1.0 was designed to work without HTTPS.** In 2007, TLS was expensive (dedicated IPs, CPU-heavy, costly certificates). The signature proved the request wasn't tampered with in transit, even over plain HTTP. It provided:

- **Authentication** — proof the Consumer possesses the secret
- **Integrity** — proof the request hasn't been modified
- **Replay protection** — timestamps + nonces prevent reusing captured requests

---

## Part 3: Why OAuth 1.0 Couldn't Keep Up

### Problem 1 — Signature Complexity Was Catastrophic

The signature base string construction was the single biggest source of implementation bugs. Getting sorting, encoding, concatenation exactly right across languages was a nightmare. A single character wrong and the signature fails silently with a `401 Unauthorized`. Debugging was agony because you couldn't tell which part of the base string was wrong.

For library authors, this was manageable. For individual developers integrating with an API? It was a barrier to adoption.

### Problem 2 — No Separation Between Authorization and Resource Serving

OAuth 1.0 has one entity: the "Service Provider." It both authorizes the user and serves the resources. In reality, as systems grew, organizations wanted to separate these:

```
OAuth 1.0 Architecture:
┌─────────────────────────────┐
│     SERVICE PROVIDER        │
│  ┌───────────┬────────────┐ │
│  │ Auth Logic│ API / Data │ │
│  └───────────┴────────────┘ │
└─────────────────────────────┘

What large orgs actually needed:
┌──────────────────┐      ┌──────────────────┐
│  AUTHORIZATION   │      │    RESOURCE      │
│     SERVER       │      │     SERVER       │
│  (issues tokens) │      │  (serves data)   │
└──────────────────┘      └──────────────────┘
         │                         │
         └── shared token store ───┘
```

With OAuth 1.0, this separation was structurally impossible because the Resource Server needed the Consumer Secret and Token Secret to verify signatures. That means the Resource Server must know the same secrets the Authorization Server knows. You can't decouple them cleanly.

### Problem 3 — Useless for Browser-Based and Mobile Apps

OAuth 1.0 requires the Consumer to hold a `consumer_secret`. But:

- In a JavaScript single-page app, everything is visible in the browser. You can't hide a secret in client-side code.
- In a mobile app, decompiling the binary reveals embedded secrets.

OAuth 1.0 had no answer for "public clients" — apps that can't keep a secret.

### Problem 4 — No Refresh Mechanism

Access Tokens in OAuth 1.0 either:
- Live forever (security risk — if leaked, permanent access)
- Expire, and you redo the entire authorization dance (terrible UX)

There was no concept of "give me a new token without bothering the user again."

### Problem 5 — No Standardized Scope

OAuth 1.0 had no built-in mechanism for saying "I want read-only access to photos, not full account access." Permissions were left entirely to the Service Provider's implementation. No interoperability.

---

## Part 4: OAuth 2.0 — The Redesign (RFC 6749, October 2012)

### The Core Philosophy Shift

OAuth 2.0 is **not** backward-compatible with 1.0. It's a complete redesign with a fundamentally different philosophy:

```
OAuth 1.0 philosophy:
  "Security at the protocol layer — sign every request, HTTPS optional"

OAuth 2.0 philosophy:
  "Security at the transport layer — rely on HTTPS, simplify the protocol"
```

By 2012, HTTPS was cheap (SNI solved the IP problem, Let's Encrypt was coming, CPU cost was trivial). The cryptographic signature machinery became unnecessary overhead. OAuth 2.0 drops it entirely.

### New Terminology (OAuth 2.0 Roles)

OAuth 2.0 formally defines four roles:

```
OAuth 2.0 Role            │  What It Is
───────────────────────────┼──────────────────────────────────────────
Resource Owner             │  The user who owns the data
Client                     │  The third-party app (was "Consumer")
Authorization Server (AS)  │  Issues tokens after authenticating the user
Resource Server (RS)       │  Hosts the protected API / data
```

The key separation: the Authorization Server and Resource Server are now distinct roles. Google can have one AS (accounts.google.com) and many RSs (Gmail API, Drive API, Calendar API).

### Core Concepts

**Bearer Token** — Unlike OAuth 1.0 where you prove you hold a secret by signing, in OAuth 2.0 the token itself is the credential. Whoever "bears" (holds) the token gets access. Like cash vs. a signed check. This is defined in RFC 6750.

```
GET /api/photos HTTP/1.1
Host: api.flickr.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

No signature, no nonce, no timestamp. Just the token. HTTPS protects it in transit.

**Scopes** — Granular permissions baked into the protocol.

```
scope=read:photos write:comments profile:email
```

The Client requests specific scopes. The AS shows them to the user. The issued token is limited to those scopes. The RS enforces them.

**Refresh Token** — A long-lived token used to get new Access Tokens without user interaction.

```
ACCESS TOKEN:   short-lived (minutes to hours)
                sent to Resource Server on every API call
                if leaked, limited damage window

REFRESH TOKEN:  long-lived (days to months)
                sent ONLY to Authorization Server
                never sent to Resource Server
                used to get new Access Tokens when old ones expire
```

**State Parameter** — A random string the Client generates and passes in the authorization request. The AS returns it unchanged in the callback. The Client verifies it matches. This prevents **CSRF attacks** — an attacker can't trick you into authorizing their account on the Client.

**Redirect URI** — The URL the AS sends the user back to after authorization. Must be pre-registered with the AS. Prevents an attacker from redirecting the authorization code to their own server.

### Client Types

OAuth 2.0 formally distinguishes:

```
CONFIDENTIAL CLIENT                  PUBLIC CLIENT
─────────────────────                ──────────────────
Can securely store secrets           Cannot keep secrets
Server-side web apps                 Browser SPAs, mobile apps
Has a backend                        Runs entirely on user's device
Gets a client_secret                 No client_secret (or it's not trusted)
```

This distinction was entirely missing from OAuth 1.0 and is essential because the flows differ based on it.

### Grant Types (Authorization Flows)

OAuth 2.0 defines four grant types, each for a different situation. Let me walk through each.

---

#### Grant Type 1: Authorization Code Grant

**For:** Confidential clients (server-side apps with a backend).
**Why:** The most secure standard flow. The Access Token never touches the user's browser.

```
USER          CLIENT (Backend)           AUTHORIZATION          RESOURCE
(Browser)     (e.g., myapp.com)            SERVER                SERVER
   │                │                        │                     │
   │ (1) Click      │                        │                     │
   │ "Login with    │                        │                     │
   │  Google"       │                        │                     │
   │───────────────>│                        │                     │
   │                │                        │                     │
   │ (2) 302 Redirect to AS                  │                     │
   │<───────────────│                        │                     │
   │  Location: https://as.com/authorize?    │                     │
   │    response_type=code                   │                     │
   │    &client_id=abc                       │                     │
   │    &redirect_uri=https://myapp.com/cb   │                     │
   │    &scope=read:photos                   │                     │
   │    &state=xyz123                        │                     │
   │                                         │                     │
   │ (3) User logs in + consents             │                     │
   │────────────────────────────────────────>│                     │
   │                                         │                     │
   │ (4) 302 Redirect back to Client         │                     │
   │<────────────────────────────────────────│                     │
   │  Location: https://myapp.com/cb?        │                     │
   │    code=AUTH_CODE_XYZ                    │                     │
   │    &state=xyz123                        │                     │
   │                                         │                     │
   │ (5) Browser follows redirect            │                     │
   │───────────────>│                        │                     │
   │                │                        │                     │
   │                │ (6) Server-to-server    │                     │
   │                │     POST /token         │                     │
   │                │  grant_type=             │                     │
   │                │   authorization_code    │                     │
   │                │  code=AUTH_CODE_XYZ     │                     │
   │                │  client_id=abc          │                     │
   │                │  client_secret=SECRET   │                     │
   │                │  redirect_uri=...       │                     │
   │                │───────────────────────>│                     │
   │                │                        │                     │
   │                │ (7) AS responds         │                     │
   │                │<───────────────────────│                     │
   │                │  { access_token: "AT",  │                     │
   │                │    refresh_token: "RT",  │                     │
   │                │    expires_in: 3600,     │                     │
   │                │    token_type: "Bearer"} │                     │
   │                │                        │                     │
   │                │ (8) GET /api/photos     │                     │
   │                │   Authorization:        │                     │
   │                │    Bearer AT            │                     │
   │                │────────────────────────────────────────────>│
   │                │                        │                     │
   │                │ (9) Protected data      │                     │
   │ (10) Rendered  │<────────────────────────────────────────────│
   │<───────────────│                        │                     │
```

The critical security property: the **authorization code** is the only thing that passes through the browser, and it's **one-time use, short-lived (typically 30-60 seconds), and useless without the `client_secret`**. The Access Token goes directly from AS to Client backend — the browser never sees it.

---

#### Grant Type 2: Implicit Grant (Now Deprecated)

**For:** Public clients (browser SPAs) that have no backend.
**Why it existed:** SPAs in 2012 couldn't make cross-origin POST requests easily (CORS was new). So the Access Token was returned directly in the URL fragment.

```
USER           SPA (Browser)              AUTHORIZATION SERVER
  │                │                            │
  │ Click Login    │                            │
  │───────────────>│                            │
  │                │ Redirect to AS             │
  │<───────────────│                            │
  │   response_type=token  (not "code"!)        │
  │                                             │
  │ Login + Consent                             │
  │────────────────────────────────────────────>│
  │                                             │
  │ Redirect back with token IN THE FRAGMENT    │
  │<────────────────────────────────────────────│
  │  https://myapp.com/cb#access_token=AT       │
  │                       &token_type=Bearer    │
  │                       &expires_in=3600      │
  │                                             │
  │ (Fragment stays in browser, not sent to     │
  │  server, but JS can read it)                │
  │───────────────>│                            │
  │                │ Extract token from         │
  │                │ window.location.hash       │
```

**Why it's deprecated:**

- The Access Token is in the URL. Browser history, referrer headers, and shoulder-surfing can leak it.
- No refresh tokens (the AS can't authenticate the client, so it doesn't issue them).
- Vulnerable to token injection attacks — an attacker substitutes their own token in the redirect.
- URL fragments have length limits and can be logged by intermediaries.

The replacement is **Authorization Code + PKCE** (covered below).

---

#### Grant Type 3: Resource Owner Password Credentials (ROPC) (Now Deprecated)

**For:** Highly trusted first-party apps only.

```
USER            CLIENT                  AUTHORIZATION SERVER
  │                │                            │
  │ Enter user/pw  │                            │
  │───────────────>│                            │
  │                │ POST /token                │
  │                │  grant_type=password        │
  │                │  username=varun             │
  │                │  password=hunter42          │
  │                │  client_id=abc              │
  │                │  scope=read:photos          │
  │                │───────────────────────────>│
  │                │                            │
  │                │ { access_token, ... }       │
  │                │<───────────────────────────│
```

The user gives their password directly to the Client. The Client exchanges it for a token. This defeats the entire purpose of OAuth (not sharing passwords), but existed as a migration path for legacy apps that already collected passwords.

**Why it's deprecated:** It reintroduces the password anti-pattern OAuth was designed to eliminate.

---

#### Grant Type 4: Client Credentials Grant

**For:** Machine-to-machine communication. No user involved.

```
CLIENT (Service A)                AUTHORIZATION SERVER
       │                                  │
       │ POST /token                      │
       │  grant_type=client_credentials   │
       │  client_id=service_a             │
       │  client_secret=SECRET            │
       │  scope=read:inventory            │
       │─────────────────────────────────>│
       │                                  │
       │ { access_token: "AT",            │
       │   token_type: "Bearer",          │
       │   expires_in: 3600 }             │
       │<─────────────────────────────────│
       │                                  │
       │ GET /api/inventory               │
       │  Authorization: Bearer AT        │
       │──────────────────────────────────────> RESOURCE SERVER
```

No redirect, no browser, no user. The Client authenticates itself (via `client_id` + `client_secret`) and gets a token representing its own identity, not a user's. Common in microservice architectures.

---

### The Refresh Token Flow

```
CLIENT                       AUTHORIZATION SERVER
  │                                  │
  │ Access Token expired.            │
  │ POST /token                      │
  │  grant_type=refresh_token        │
  │  refresh_token=RT                │
  │  client_id=abc                   │
  │  client_secret=SECRET            │
  │─────────────────────────────────>│
  │                                  │
  │ { access_token: "NEW_AT",        │
  │   refresh_token: "NEW_RT",  <── Rotation: old RT is invalidated
  │   expires_in: 3600 }            │
  │<─────────────────────────────────│
```

**Refresh token rotation**: modern best practice (and mandatory in OAuth 2.1) is to issue a new refresh token every time one is used and invalidate the old one. If an attacker steals and uses a refresh token, the legitimate client's next refresh attempt will fail (because the old RT is invalidated), which signals a breach. This is called **rotation-based leak detection**.

---

## Part 5: The Missing Piece — PKCE (RFC 7636, 2015)

Pronounced "pixy." **Proof Key for Code Exchange.**

The Implicit Grant is dead. But public clients (SPAs, mobile apps) still exist. How do they use the Authorization Code Grant without a `client_secret`?

The answer: PKCE adds a dynamic, per-request secret.

### The Attack PKCE Prevents

Without PKCE, a public client using the Authorization Code flow is vulnerable to **authorization code interception**:

```
LEGITIMATE APP              MALICIOUS APP            AUTH SERVER
      │                          │                       │
      │ ─── (1) Start auth ─────────────────────────────>│
      │      redirect_uri=                               │
      │       myapp://callback                           │
      │                                                  │
      │         (2) Malicious app registers              │
      │         same custom URL scheme                   │
      │         myapp://callback                         │
      │                          │                       │
      │ <── (3) Redirect ────────────────────────────────│
      │      code=AUTH_CODE      │                       │
      │                          │                       │
      │    (4) OS delivers to    │                       │
      │    MALICIOUS app instead │                       │
      │                          │                       │
      │                          │── (5) Exchange code ─>│
      │                          │   (no client_secret   │
      │                          │    needed — public!)  │
      │                          │<── access_token ──────│
```

On mobile, multiple apps can register the same URL scheme. The OS might deliver the redirect to the wrong app. The malicious app gets the authorization code and exchanges it for a token.

### How PKCE Works

```
CLIENT                              AUTHORIZATION SERVER
  │                                          │
  │ (1) Generate random string:              │
  │     code_verifier = "dBjftJeZ4CVP..."    │
  │     (43-128 chars, [A-Z][a-z][0-9]-._~)  │
  │                                          │
  │ (2) Hash it:                             │
  │     code_challenge =                     │
  │       BASE64URL(SHA256(code_verifier))   │
  │                                          │
  │ (3) Send challenge in auth request:      │
  │     GET /authorize?                      │
  │       response_type=code                 │
  │       &client_id=abc                     │
  │       &code_challenge=E9Melhoa2OW...     │
  │       &code_challenge_method=S256        │
  │       &redirect_uri=...                  │
  │──────────────────────────────────────────>│
  │                                          │
  │     (AS stores code_challenge             │
  │      alongside the auth code)            │
  │                                          │
  │ (4) User authorizes, code returned       │
  │<──────────────────────────────────────────│
  │     code=AUTH_CODE                       │
  │                                          │
  │ (5) Exchange code, proving knowledge:    │
  │     POST /token                          │
  │       grant_type=authorization_code      │
  │       &code=AUTH_CODE                    │
  │       &code_verifier=dBjftJeZ4CVP...    │
  │──────────────────────────────────────────>│
  │                                          │
  │     AS computes:                         │
  │       SHA256(code_verifier) == stored     │
  │       code_challenge?                    │
  │                                          │
  │     Match? Issue token.                  │
  │     No match? Reject.                    │
  │                                          │
  │ (6) { access_token, refresh_token }      │
  │<──────────────────────────────────────────│
```

**Why this works:** The `code_challenge` (a hash) is sent in step 3 through the browser, which the attacker might intercept. But they never see the `code_verifier` (the preimage) — only the legitimate client that generated it has it. SHA-256 is a one-way function: knowing the hash doesn't reveal the input. So even if the attacker intercepts the authorization code, they can't exchange it without the verifier.

The elegance: no long-lived secret needed. Each authorization request generates a fresh verifier/challenge pair.

---

## Part 6: The Current State

### OAuth 2.1 (Draft, in progress)

OAuth 2.1 is not a new protocol. It's a **consolidation** of OAuth 2.0 (RFC 6749) plus all the best current practices and security recommendations that accumulated over the past decade. It folds in:

```
What OAuth 2.1 does:

  REMOVED:
  ├── Implicit Grant                    (use Auth Code + PKCE)
  ├── Resource Owner Password Grant     (use Auth Code + PKCE)
  └── Bearer tokens in query strings    (use Authorization header)

  MANDATED:
  ├── PKCE for ALL authorization code flows (even confidential clients)
  ├── Exact redirect URI matching       (no partial/wildcard matching)
  ├── Refresh token rotation or sender-constraining
  └── Access tokens must not be sent in URI query parameters

  INCORPORATED RFCs:
  ├── RFC 7636 — PKCE
  ├── RFC 7009 — Token Revocation
  ├── RFC 8252 — OAuth for Native Apps
  └── Security BCP (draft-ietf-oauth-security-topics)
```

### Related Specifications Worth Knowing

**Token Introspection (RFC 7662)** — The Resource Server can ask the Authorization Server "is this token valid? what scopes does it have? who does it belong to?" This is how the RS validates opaque tokens (tokens that are just random strings with no embedded information).

```
RS ──── POST /introspect { token: "AT" } ────> AS
RS <─── { active: true, scope: "read",   ───── AS
          sub: "user123", exp: 1720000000 }
```

**Token Revocation (RFC 7009)** — Lets a Client tell the AS "invalidate this token." Used when a user logs out or disconnects an app.

**JWT Access Tokens (RFC 9068)** — Instead of opaque tokens, the AS can issue JWTs (JSON Web Tokens) as access tokens. The RS can verify them locally using the AS's public key (no introspection call needed). Tradeoff: you gain self-contained validation but lose instant revocation (the RS won't know the token was revoked until it expires unless you add a revocation list).

```
Opaque Token:     "a3f8b2c1d4e5..."
                   Meaningless without calling AS to introspect.

JWT Access Token:  header.payload.signature
                   RS decodes it, verifies signature with AS's
                   public key, reads claims (sub, scope, exp).
                   No AS call needed.
```

**DPoP — Demonstrating Proof of Possession (RFC 9449)** — Bearer tokens have a fundamental weakness: if stolen, anyone can use them (they're like cash). DPoP adds proof-of-possession semantics — the client generates a key pair, and proves it holds the private key on every request. A stolen token is useless without the private key. This is conceptually similar to what OAuth 1.0's signatures provided, but done at the application layer on top of TLS rather than replacing TLS.

### OAuth 2.0 vs 1.0 — Summary of Tradeoffs

```
Dimension              │  OAuth 1.0              │  OAuth 2.0
───────────────────────┼─────────────────────────┼──────────────────────────
Transport Security     │  Optional (signatures)  │  HTTPS mandatory
Request Signing        │  Every request signed   │  No signing (bearer token)
Token Types            │  Access Token only      │  Access + Refresh
Client Types           │  One (assumes secret)   │  Confidential + Public
Grant Types            │  One (3-legged)         │  4 (now 2 in 2.1)
Scope                  │  Not standardized       │  Built-in
AS/RS Separation       │  Not possible           │  First-class concept
Mobile/SPA Support     │  Poor                   │  PKCE solves it
Complexity             │  Signature = nightmare  │  Simpler, but more specs
Spec Coherence         │  Single RFC             │  Framework + many RFCs
Interoperability       │  Higher (one flow)      │  Lower (many options)
```

### One Important Distinction: OAuth is NOT Authentication

OAuth 2.0 is an **authorization** framework — it answers "what is this app allowed to do?" It does not answer "who is this user?" Getting an access token with `scope=read:photos` tells you the app can read photos. It doesn't reliably tell you which user authorized it (the access token might not contain user identity).

**OpenID Connect (OIDC)**, built on top of OAuth 2.0, adds an **identity layer**. It introduces:

- **ID Token** — a JWT containing user identity claims (`sub`, `email`, `name`)
- **UserInfo Endpoint** — an API to fetch user profile data
- **Standard Scopes** — `openid`, `profile`, `email`, `address`, `phone`

```
OAuth 2.0 alone:
  "This app can read photos"     (authorization)

OAuth 2.0 + OpenID Connect:
  "This app can read photos"     (authorization)
  + "The user is varun@x.com"    (authentication / identity)
```

When someone says "Login with Google," that's OIDC on top of OAuth 2.0. The app gets both an access token (for API access) and an ID token (to know who logged in).

---

This should give you the complete arc — from the password anti-pattern, through OAuth 1.0's signature-heavy approach, to 2.0's bearer-token simplification, PKCE filling the public-client gap, and the current consolidation in 2.1. Each step was a response to real limitations exposed by how the web and its clients evolved.
