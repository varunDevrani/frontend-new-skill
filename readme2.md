You're right. I dumped a wall of jargon without building the foundation. Let me start over properly.

---

# What Even IS OAuth?

## Chapter 0: Categories of Security Concerns

Before touching OAuth, you need to understand the landscape it lives in. When two parties interact over a network, three distinct questions arise:

**Question 1 — Authentication: "Who are you?"**

Proving identity. When you show your government ID at a bank, that's authentication. When you type your username + password into Gmail, you're authenticating — proving to Google that you are who you claim to be.

The output of authentication is **identity** — the system now knows you are Varun.

**Question 2 — Authorization: "What are you allowed to do?"**

Granting permissions. After the bank knows who you are (authentication), they check what you're allowed to do — can you access vault #42? Can you withdraw from this account? That's authorization.

The output of authorization is **permissions/access** — the system now knows what Varun can and cannot do.

**Question 3 — Federation: "Can I trust someone else's verification?"**

Can Bank B accept an ID card issued by Bank A? Can a third-party app trust that Google already verified who you are? This is federated identity — systems trusting each other's authentication.

These three are deeply related but fundamentally different:

```
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY CONCERNS                         │
│                                                             │
│  AUTHENTICATION          AUTHORIZATION         FEDERATION   │
│  "Who are you?"          "What can you do?"    "Can I trust │
│                                                someone      │
│  Proves identity.        Grants permissions.   else's       │
│                                                proof?"      │
│  Examples:               Examples:                          │
│  - Password login        - File permissions    Examples:    │
│  - Fingerprint scan      - API scopes          - SSO        │
│  - Certificate           - ACLs                - SAML       │
│                                                - OpenID     │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ORDER MATTERS: You MUST authenticate before you can        │
│  authorize. You can't decide what someone is allowed to     │
│  do until you know who they are.                            │
└─────────────────────────────────────────────────────────────┘
```

Now here's the critical thing:

**OAuth is an AUTHORIZATION framework.** Not an authentication protocol. It answers "what is this third-party app allowed to do on behalf of the user?" It does NOT answer "who is the user?"

I'll come back to why this distinction matters enormously. But now you know what shelf OAuth sits on.

---

## Chapter 1: The World Before OAuth — Why It Was Needed

### The Year is 2005-2006

The web is exploding with services. Flickr hosts your photos. Google has your contacts. Delicious has your bookmarks. Twitter has your posts.

Now a new kind of app appears: apps that want to **combine** data from different services. A photo printing service wants your Flickr photos. A "find friends" feature on a new social network wants your Gmail contacts.

The only mechanism available: **give the third-party app your password.**

```
SCENARIO: You want PrintApp to print your Flickr photos.

    YOU ──── "My Flickr login is varun / hunter42" ────> PRINT APP
                                                             │
                                                             │ logs into Flickr
                                                             │ pretending to be you
                                                             v
                                                          FLICKR
                                                    "Oh hi Varun, welcome"
```

PrintApp now literally impersonates you. It has your username and password. As far as Flickr knows, PrintApp IS you.

Think about what this means in practice:

**Problem 1 — Total access.** You wanted PrintApp to read your photos. But with your password, it can also delete photos, change your email, reset your password, read your private messages. There's no way to say "read photos only." Credentials are all-or-nothing.

**Problem 2 — You can't revoke one app without nuking everything.** Say you gave your password to PrintApp, CalendarSync, and ContactMerge. Now you don't trust PrintApp anymore. Your only option: change your Flickr password. But that also breaks CalendarSync and ContactMerge. And you need to update your own login everywhere.

**Problem 3 — If PrintApp gets hacked, your password leaks.** And since most people reuse passwords, now your email, bank, and everything else is compromised too.

**Problem 4 — Flickr can't tell the difference.** Every request looks like it's from you. There's no audit trail showing "PrintApp accessed photos at 3am" vs "Varun browsed photos at 3am."

### What Was Actually Needed

A mechanism where:
- You can grant PrintApp **specific, limited** access (only read photos)
- Without giving PrintApp your password
- Where you can **revoke** PrintApp's access without affecting other apps
- Where Flickr **knows** it's PrintApp acting on your behalf, not you directly

This concept has a name: **delegated authorization.** You (the resource owner) delegate a limited subset of your authority to a third party.

---

## Chapter 2: The Proprietary Mess (2005-2007)

Different companies each invented their own solution:

```
COMPANY       PROPRIETARY PROTOCOL     YEAR
──────────    ────────────────────     ────
Flickr        FlickrAuth               2005
Google        AuthSub                  2006
Yahoo         BBAuth (Browser-Based)   2006
AOL           OpenAuth                 2006
Amazon        Custom signing           2005
```

Each one solved the delegated authorization problem, but each was completely different. If you built an app that wanted Flickr photos AND Google contacts, you had to implement two entirely different authorization protocols. For every new service you added, another custom implementation.

This was unsustainable. The web needed a single, open, standard protocol for delegated authorization.

---

## Chapter 3: OAuth 1.0 — The First Standard (2007-2010)

### How It Started

In November 2006, Blaine Cook (lead developer at Twitter) was implementing Twitter's API and realized there was no standard for delegated access. Larry Halff from Ma.gnolia (a social bookmarking service) had the same problem. In April 2007, they formed a small working group and started writing a spec.

Twitter was the first major deployment. OAuth 1.0 was finalized as RFC 5849 (published April 2010, but the community spec existed since 2007).

### Before the Flow: Understanding the Players

OAuth 1.0 defines three parties. Let me explain each with the PrintApp-Flickr scenario:

**The User (Resource Owner)** — You. The human who owns data on some service and wants to let a third-party app access some of it.

**The Service Provider** — Flickr. The service that holds your data. In OAuth 1.0, this is ONE entity that does everything: it stores your data, it authenticates you, and it handles the authorization process. (This single-entity design will later become a problem.)

**The Consumer** — PrintApp. The third-party application that wants to access your data on the Service Provider. It "consumes" the Service Provider's API on your behalf.

```
     ┌──────────┐          ┌──────────────────────────┐
     │          │          │    SERVICE PROVIDER       │
     │  USER    │          │       (Flickr)            │
     │  (You)   │          │                           │
     │          │          │  ┌─────────────────────┐  │
     └────┬─────┘          │  │  Your photos        │  │
          │                │  │  Your profile        │  │
          │ "Let PrintApp  │  │  Your messages       │  │
          │  see my        │  │  Your settings       │  │
          │  photos"       │  └─────────────────────┘  │
          │                │                           │
          │                │  Auth logic + API + Data  │
     ┌────v─────┐          │  ALL in one place         │
     │          │          └──────────────────────────┘
     │ CONSUMER │                     ^
     │(PrintApp)│─── wants access ────┘
     │          │
     └──────────┘
```

### Before the Flow: Credentials and Registration

Before any OAuth dance happens, the Consumer (PrintApp) must **register** with the Service Provider (Flickr). This is a one-time manual setup — the developer goes to Flickr's developer portal and creates an "application." Flickr gives them two things:

**Consumer Key** — A public identifier for the application. Like a username for the app itself (not for any user). Every request from PrintApp includes this so Flickr knows "this request is coming from PrintApp." It's not secret — it appears in URLs and headers.

**Consumer Secret** — A secret known only to PrintApp and Flickr. Like a password for the app itself. PrintApp uses this to prove it really is PrintApp (not some impersonator pretending to be PrintApp). This must never be exposed publicly.

```
REGISTRATION (one-time, before any user interaction):

    PrintApp Developer ──── "I want to build an app" ────> Flickr Developer Portal
                                                                    │
                       <── consumer_key = "pk_printapp_abc"  ───────┘
                           consumer_secret = "sk_29f8a3b1c..."
                           
    These are like a username+password FOR THE APP ITSELF.
    Not for any user. For the app.
```

Why does this exist? Because Flickr needs to know which app is making requests. If PrintApp is abusive (spamming APIs, scraping data), Flickr can revoke PrintApp's Consumer Key and shut down that specific app without affecting other apps.

### The OAuth 1.0 Flow — Step by Extremely Detailed Step

Now let me walk through what happens when you (the User) use PrintApp and it needs your Flickr photos. I'll explain every request and response.

---

**STEP 1: Consumer Obtains a Request Token**

PrintApp needs to start the authorization process, but before it can send you to Flickr, it needs a **temporary placeholder** — something that ties this specific authorization attempt together. That placeholder is the **Request Token.**

Think of it like taking a numbered ticket at a deli counter. The ticket doesn't entitle you to anything yet — it just says "you're in line, and your number is 47."

```
PrintApp (Consumer)                            Flickr (Service Provider)
       │                                              │
       │  POST /oauth/request_token                   │
       │  ─────────────────────────────────────────>  │
       │                                              │
       │  This request includes:                      │
       │    oauth_consumer_key = "pk_printapp_abc"    │
       │    oauth_signature_method = "HMAC-SHA1"      │
       │    oauth_timestamp = "1234567890"            │
       │    oauth_nonce = "a1b2c3"                    │
       │    oauth_callback = "https://printapp.com/done"
       │    oauth_signature = "F4a7b2..." (computed)  │
       │                                              │
       │  <─────────────────────────────────────────  │
       │  Response:                                   │
       │    oauth_token = "temp_token_xyz"            │
       │    oauth_token_secret = "temp_secret_789"    │
       │    oauth_callback_confirmed = true           │
```

Let me explain every parameter:

- `oauth_consumer_key` — "I am PrintApp. Here's my public ID."
- `oauth_callback` — "When the user approves, send them back to this URL on my site."
- `oauth_timestamp` — The current Unix time (seconds since Jan 1, 1970). Used for replay protection — if someone captures this request and resends it hours later, the timestamp is stale and the Service Provider rejects it.
- `oauth_nonce` — "Number used once." A random string that's unique per request. Combined with the timestamp, it prevents replay attacks. If the Service Provider sees the same nonce+timestamp twice, it rejects the second one.
- `oauth_signature_method` — Which algorithm was used to sign this request (almost always `HMAC-SHA1`).
- `oauth_signature` — A cryptographic proof that PrintApp actually possesses the Consumer Secret. I'll explain how this is computed in detail shortly.

Flickr validates the signature, and if everything checks out, responds with:

- `oauth_token` (the Request Token) — A temporary identifier for this authorization attempt. Think "ticket number 47."
- `oauth_token_secret` — A temporary secret paired with this specific Request Token. PrintApp will need this later for computing signatures during the token exchange. The Service Provider stores this too.

At this point, no user is involved yet. This is a behind-the-scenes handshake between PrintApp and Flickr.

---

**STEP 2: Consumer Redirects the User to the Service Provider**

Now PrintApp sends you (via your browser) to Flickr's authorization page:

```
PrintApp                        Your Browser                    Flickr
    │                               │                              │
    │ HTTP 302 Redirect             │                              │
    │ Location:                     │                              │
    │  https://flickr.com/oauth/    │                              │
    │  authorize?                   │                              │
    │  oauth_token=temp_token_xyz   │                              │
    │──────────────────────────────>│                              │
    │                               │                              │
    │                               │ GET /oauth/authorize?        │
    │                               │  oauth_token=temp_token_xyz  │
    │                               │─────────────────────────────>│
    │                               │                              │
    │                               │  Flickr shows login page     │
    │                               │  (if not already logged in)  │
    │                               │  then shows consent screen:  │
    │                               │                              │
    │                               │  ┌────────────────────────┐  │
    │                               │  │ "PrintApp wants to:    │  │
    │                               │  │  - Read your photos    │  │
    │                               │  │  - Read your albums    │  │
    │                               │  │                        │  │
    │                               │  │  [ALLOW]    [DENY]"    │  │
    │                               │  └────────────────────────┘  │
    │                               │<─────────────────────────────│
```

This is the crucial moment. The User is on **Flickr's website** — not PrintApp's. The URL bar shows `flickr.com`. PrintApp never sees the login page, never touches the password. Flickr is directly asking the User: "do you trust this app?"

The `oauth_token=temp_token_xyz` in the URL tells Flickr which authorization attempt this is (the "deli ticket number"). Flickr looks it up and knows "ah, this is PrintApp requesting photo access."

---

**STEP 3: User Approves, Service Provider Redirects Back**

You click "Allow." Flickr now redirects your browser back to PrintApp's callback URL (the one PrintApp specified in Step 1):

```
Flickr                          Your Browser                   PrintApp
  │                                 │                              │
  │ HTTP 302 Redirect               │                              │
  │ Location:                       │                              │
  │  https://printapp.com/done?     │                              │
  │  oauth_token=temp_token_xyz     │                              │
  │  &oauth_verifier=verif_999      │                              │
  │────────────────────────────────>│                              │
  │                                 │                              │
  │                                 │ GET /done?                   │
  │                                 │  oauth_token=temp_token_xyz  │
  │                                 │  &oauth_verifier=verif_999   │
  │                                 │─────────────────────────────>│
```

Two things come back:

- `oauth_token` — The same Request Token, so PrintApp knows which authorization attempt just completed.
- `oauth_verifier` — A one-time code proving that the User actually approved. This is critical because without it, an attacker could craft a fake redirect to PrintApp's callback with a token. The verifier is generated by Flickr and only sent to the User's browser after they click "Allow."

---

**STEP 4: Consumer Exchanges Request Token for Access Token**

PrintApp now has proof that the User approved (the verifier). It goes back to Flickr server-to-server (no browser involved) to trade the temporary Request Token for a permanent **Access Token:**

```
PrintApp (Consumer)                            Flickr (Service Provider)
       │                                              │
       │  POST /oauth/access_token                    │
       │  ─────────────────────────────────────────>  │
       │                                              │
       │  This request includes:                      │
       │    oauth_consumer_key = "pk_printapp_abc"    │
       │    oauth_token = "temp_token_xyz"            │
       │    oauth_verifier = "verif_999"              │
       │    oauth_signature_method = "HMAC-SHA1"      │
       │    oauth_timestamp = "1234567899"            │
       │    oauth_nonce = "d4e5f6"                    │
       │    oauth_signature = "B8c3d1..."             │
       │                                              │
       │  NOTE: Signature is now computed using        │
       │  BOTH consumer_secret AND temp_secret_789     │
       │  (the Request Token Secret from Step 1)       │
       │                                              │
       │  <─────────────────────────────────────────  │
       │  Response:                                   │
       │    oauth_token = "access_token_FINAL"        │
       │    oauth_token_secret = "access_secret_FINAL"│
```

Flickr verifies:
- The signature is valid (proving PrintApp has the Consumer Secret + Token Secret)
- The Request Token is valid and hasn't been used before
- The verifier matches the one Flickr generated in Step 3

If all checks pass, Flickr invalidates the Request Token (it's one-time-use) and issues:

- **Access Token** — The long-lived credential that represents "User Varun has granted PrintApp read access to photos." This is the prize. The whole dance was to get here.
- **Access Token Secret** — A secret paired with the Access Token, used for signing future API requests.

---

**STEP 5: Consumer Accesses Protected Resources**

Now PrintApp can actually fetch your photos:

```
PrintApp (Consumer)                            Flickr (Service Provider)
       │                                              │
       │  GET /api/v1/photos?user=varun               │
       │  Authorization: OAuth                        │
       │    oauth_consumer_key="pk_printapp_abc",     │
       │    oauth_token="access_token_FINAL",         │
       │    oauth_signature_method="HMAC-SHA1",       │
       │    oauth_timestamp="1234567999",             │
       │    oauth_nonce="g7h8i9",                     │
       │    oauth_signature="X2y3z4..."               │
       │  ─────────────────────────────────────────>  │
       │                                              │
       │  NOTE: Signature is now computed using        │
       │  consumer_secret AND access_secret_FINAL      │
       │                                              │
       │  <─────────────────────────────────────────  │
       │  { photos: [ ... your photos ... ] }         │
```

Every single API call must include all those `oauth_*` parameters and a fresh signature. Every. Single. One.

---

### The Complete Endpoint Map

Here are all the API endpoints involved, with context on when and why each is called:

```
ENDPOINT                  │ WHEN CALLED         │ WHO CALLS IT        │ PURPOSE
──────────────────────────┼─────────────────────┼─────────────────────┼────────────────────────
POST /oauth/request_token │ Start of flow       │ Consumer -> SP      │ Get temporary token
                          │ (once per auth      │ (server-to-server)  │ to identify this
                          │  attempt)           │                     │ auth attempt
                          │                     │                     │
GET /oauth/authorize      │ After request token │ User's browser      │ User logs in and
                          │ is obtained         │ -> SP               │ sees consent screen
                          │                     │ (browser redirect)  │
                          │                     │                     │
POST /oauth/access_token  │ After user approves │ Consumer -> SP      │ Trade temp token +
                          │                     │ (server-to-server)  │ verifier for real
                          │                     │                     │ access token
                          │                     │                     │
GET /api/v1/photos (etc)  │ Any time after      │ Consumer -> SP      │ Actually access the
                          │ access granted      │ (server-to-server)  │ protected resource
```

### The Signature — Why It Exists and How It Works

I mentioned `oauth_signature` in every request. Let me explain why it exists and exactly how it's computed, because this is the most important (and most painful) part of OAuth 1.0.

**Why sign at all?**

In 2007, HTTPS was expensive and rare. Most API calls went over plain HTTP. That means anyone on the network (a Wi-Fi sniffer, a malicious ISP, a compromised router) can see and modify your requests in transit. Without signatures:

```
WITHOUT SIGNATURES (plain HTTP):

PrintApp ──── GET /api/photos ────> [ ATTACKER ] ────> Flickr
                                         │
                                    Can read the token.
                                    Can modify the request.
                                    Can replay the request later.
```

The signature provides three guarantees even without HTTPS:

1. **Authentication** — Proves the request came from someone who knows the Consumer Secret (i.e., the real PrintApp, not an impersonator)
2. **Integrity** — Proves the request wasn't modified in transit (the URL, parameters, method are all baked into the signature)
3. **Replay protection** — Timestamp + nonce ensure a captured request can't be reused

**How it's computed — step by step:**

Suppose PrintApp wants to fetch photos with this request:

```
GET /api/v1/photos?user=varun&count=10
Host: flickr.com
```

**Step A — Collect all parameters:**

Gather OAuth parameters + query string parameters + POST body parameters (if any) into one pool:

```
oauth_consumer_key     = pk_printapp_abc
oauth_token            = access_token_FINAL
oauth_signature_method = HMAC-SHA1
oauth_timestamp        = 1234567999
oauth_nonce            = g7h8i9
oauth_version          = 1.0
user                   = varun          <-- from the query string
count                  = 10             <-- from the query string
```

**Step B — Sort lexicographically by key name:**

```
count                  = 10
oauth_consumer_key     = pk_printapp_abc
oauth_nonce            = g7h8i9
oauth_signature_method = HMAC-SHA1
oauth_timestamp        = 1234567999
oauth_token            = access_token_FINAL
oauth_version          = 1.0
user                   = varun
```

**Step C — Concatenate as key=value pairs with & between them:**

```
count=10&oauth_consumer_key=pk_printapp_abc&oauth_nonce=g7h8i9&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1234567999&oauth_token=access_token_FINAL&oauth_version=1.0&user=varun
```

**Step D — Build the Signature Base String:**

```
GET&https%3A%2F%2Fflickr.com%2Fapi%2Fv1%2Fphotos&count%3D10%26oauth_consumer_key%3Dpk_printapp_abc%26oauth_nonce%3Dg7h8i9%26...

Format: HTTP_METHOD + "&" + percent_encode(BASE_URL) + "&" + percent_encode(PARAM_STRING)
```

Everything is percent-encoded (also called URL-encoded). `%3A` is `:`, `%2F` is `/`, `%3D` is `=`, `%26` is `&`.

**Step E — Build the Signing Key:**

```
signing_key = percent_encode(consumer_secret) + "&" + percent_encode(access_token_secret)

            = sk_29f8a3b1c...&access_secret_FINAL
```

This is why you need BOTH secrets — the Consumer Secret (proves app identity) and the Token Secret (proves the token is genuine).

**Step F — Compute HMAC-SHA1:**

```
signature_bytes = HMAC-SHA1(key=signing_key, message=signature_base_string)
oauth_signature = Base64Encode(signature_bytes)
```

The result is something like `tR3%2BTy81lMeYAr%2FnhGK...`.

**Why this was a nightmare:**

The sorting, the encoding, the concatenation — every single step must be exactly right. If your percent-encoding uses lowercase hex (`%3a` instead of `%3A`), the signature breaks. If you sort parameters differently than the spec says, the signature breaks. If you include the wrong parameters, it breaks. And the error you get is always just `401 Unauthorized` — no indication of what went wrong.

---

## Chapter 4: Why OAuth 1.0 Had to Be Replaced

### Problem 1: The Signature Complexity Was a Developer Barrier

Every API call required computing that signature. Not just the authorization flow — every single data request. Libraries existed, but they were buggy and hard to debug. This directly hurt adoption: developers would abandon integrations because they couldn't get signatures to work.

### Problem 2: The "Service Provider" Monolith

In OAuth 1.0, one entity (the Service Provider) does everything — authenticates users, manages authorization, and serves the API. But real companies grew beyond this:

```
What OAuth 1.0 assumed:

    ┌──────────────────────────────────┐
    │        SERVICE PROVIDER          │
    │                                  │
    │  [Auth Logic] + [API] + [Data]   │
    │  All in one place                │
    └──────────────────────────────────┘


What Google/Facebook/Microsoft actually looked like:

    One company, many services:

    accounts.google.com  ──── handles login and authorization
    gmail.googleapis.com ──── serves email data
    drive.googleapis.com ──── serves file data
    calendar.googleapis.com ─ serves calendar data
```

OAuth 1.0 had no way to express "one server handles authorization, different servers handle the actual APIs." And because the signature requires the token secret, every Resource Server needs to know the secret — you can't decouple them cleanly.

### Problem 3: Mobile Apps and Browser Apps Can't Hold Secrets

OAuth 1.0 assumes the Consumer can securely store its `consumer_secret`. This is true for a server-side app (the secret lives on the server, users never see it). But by 2010-2011:

- **Mobile apps** — The app binary is on the user's phone. Anyone can decompile it and extract embedded strings. The `consumer_secret` is exposed.
- **Single-page browser apps (SPAs)** — All code runs in the browser. View Source reveals everything. The `consumer_secret` is exposed.

These are called **public clients** — clients that structurally cannot keep a secret. OAuth 1.0 had no concept of this distinction and no flow designed for them.

### Problem 4: No Refresh Mechanism

In OAuth 1.0, Access Tokens either live forever (if stolen, permanent access) or expire and the user must redo the entire authorization dance. There's no "get me a new token quietly in the background" mechanism.

### Problem 5: No Standardized Scope

OAuth 1.0 had no built-in way to express "I want read-only photo access." Permissions were entirely up to the Service Provider's custom implementation. One service might use URL patterns, another might use custom parameters. No interoperability.

---

## Chapter 5: OAuth 2.0 — The Redesign (RFC 6749, October 2012)

### The Fundamental Philosophy Change

```
OAuth 1.0 (2007):
  "HTTPS is expensive. We'll build security INTO the protocol
   with signatures, nonces, and timestamps."

OAuth 2.0 (2012):
  "HTTPS is now cheap and ubiquitous. We'll REQUIRE HTTPS and
   make the protocol itself much simpler."
```

What happened between 2007 and 2012: SNI (Server Name Indication) eliminated the need for dedicated IP addresses per HTTPS site. CPU costs for TLS dropped dramatically. Let's Encrypt was on the horizon. HTTPS went from "luxury for banks" to "default for everyone."

So OAuth 2.0 makes a trade: **HTTPS is mandatory, signatures are eliminated.** The transport layer provides authentication, integrity, and replay protection. The protocol layer doesn't need to duplicate that work.

### New Roles — Splitting the Service Provider

OAuth 2.0 formally separates the old "Service Provider" into two roles, and renames "Consumer" to something less ambiguous:

```
OAuth 1.0 Term       │  OAuth 2.0 Term             │ What It Is
─────────────────────┼─────────────────────────────┼───────────────────────
User                 │  Resource Owner              │ You. The human.
Service Provider     │  Authorization Server (AS)   │ Handles login + consent
  (was one thing)    │  Resource Server (RS)        │ Hosts the API / data
Consumer             │  Client                      │ The third-party app
```

The split between AS and RS is fundamental:

```
OAuth 2.0 architecture:

   ┌──────────────────────┐       ┌───────────────────────┐
   │  AUTHORIZATION       │       │  RESOURCE SERVER(S)   │
   │  SERVER              │       │                       │
   │  accounts.google.com │       │  gmail.googleapis.com │
   │                      │       │  drive.googleapis.com │
   │  - authenticates     │       │  calendar.google...   │
   │    users             │       │                       │
   │  - shows consent     │       │  - serves API data    │
   │    screen            │       │  - accepts tokens     │
   │  - issues tokens     │       │  - enforces scopes    │
   └──────────────────────┘       └───────────────────────┘
           │                                 │
           │   RS validates tokens by:       │
           │   - calling AS (introspection)  │
           │     OR                          │
           │   - verifying JWT signature     │
           │     locally (no AS call needed) │
           └─────────────────────────────────┘
```

This is possible now because tokens are **bearer tokens** — the RS just needs to verify the token is valid. It doesn't need to know the client secret or the token secret to check a signature (because there is no signature).

### Bearer Tokens — The Core Change

This is the biggest conceptual shift from 1.0 to 2.0.

**OAuth 1.0 token:** A reference paired with a secret. To prove you hold the token, you sign your request using the secret. The token alone is useless — you need the secret to produce valid signatures.

**OAuth 2.0 bearer token:** Whoever possesses ("bears") the token gets access. No signature required. Like cash — if you have it, you can spend it. The token itself IS the credential.

```
OAuth 1.0 API call:
  GET /api/photos
  Authorization: OAuth
    oauth_consumer_key="...",
    oauth_token="...",
    oauth_nonce="...",
    oauth_timestamp="...",
    oauth_signature_method="HMAC-SHA1",
    oauth_signature="..."          <-- cryptographic proof

OAuth 2.0 API call:
  GET /api/photos
  Authorization: Bearer eyJhbGciOiJS...     <-- just the token, nothing else
```

The simplicity is dramatic. But the security implication is also dramatic: if someone steals a bearer token, they can use it. There's no "but they don't have the secret." This is why HTTPS is mandatory — it prevents theft in transit.

### Client Types — Acknowledging Reality

OAuth 2.0 formally recognizes two kinds of clients:

**Confidential Client** — Can securely store a secret. Has a backend server. Examples: a traditional web app where server-side code talks to the API.

```
User's Browser ────> Your Web Server (has client_secret safely stored) ────> API
```

**Public Client** — Cannot keep a secret. Everything runs on the user's device. Examples: JavaScript SPAs, mobile apps, desktop apps.

```
User's Browser ────> (SPA running in browser, source code visible) ────> API
     OR
Mobile App on phone ────> (binary can be decompiled) ────> API
```

Why this matters: different flows are designed for different client types. A confidential client can prove its identity with a `client_secret`. A public client can't — so it needs a different mechanism (PKCE, which I'll cover).

### Scopes — Granular Permissions

Built into the protocol:

```
https://as.com/authorize?
  ...
  &scope=read:photos write:comments profile:email
```

The Client requests specific permissions. The Authorization Server shows them to the User on the consent screen. The issued token is limited to exactly those scopes. The Resource Server checks scopes when serving requests.

```
Consent screen:

  ┌──────────────────────────────────┐
  │  PrintApp wants to:              │
  │                                  │
  │    [x] Read your photos          │
  │    [x] Read your albums          │
  │    [ ] Delete your photos        │  <-- NOT requested
  │    [ ] Change your profile       │  <-- NOT requested
  │                                  │
  │    [ALLOW]        [DENY]         │
  └──────────────────────────────────┘
```

### Refresh Tokens — Silent Renewal

OAuth 2.0 introduces a two-token system:

```
ACCESS TOKEN                         REFRESH TOKEN
────────────                         ─────────────
Short-lived (minutes to hours).      Long-lived (days to months).
Sent to Resource Server.             Sent ONLY to Authorization Server.
Used for every API call.             Used ONLY to get new access tokens.
If leaked, damage is time-bounded.   If leaked, can generate new access tokens.
                                     (That's why it's higher-value and
                                      sent only to the AS over HTTPS.)
```

When the access token expires:

```
Client                             Authorization Server
  │                                        │
  │ POST /oauth/token                      │
  │   grant_type=refresh_token             │
  │   refresh_token=RT_abc                 │
  │   client_id=printapp                   │
  │   client_secret=SECRET (if confid.)    │
  │───────────────────────────────────────>│
  │                                        │
  │ { access_token: "NEW_AT",              │
  │   refresh_token: "NEW_RT",  <── old RT │
  │   expires_in: 3600 }         invalidated
  │<───────────────────────────────────────│
```

The **refresh token rotation** shown here (issuing a new RT and invalidating the old one) is a security mechanism: if an attacker steals and uses a refresh token, the legitimate client's next refresh fails because the old RT is dead. This signals a breach.

### The State Parameter — Preventing CSRF

The `state` parameter is a random, unguessable string the Client generates and includes in the authorization request. The AS returns it unchanged in the callback. The Client verifies it matches.

Why this matters — without it, an attacker can perform a CSRF (Cross-Site Request Forgery) attack:

```
WITHOUT state parameter:

  1. Attacker starts OAuth flow, gets an authorization code
     for THEIR account.
  2. Attacker crafts a link:
     https://printapp.com/callback?code=ATTACKERS_CODE
  3. Tricks victim into clicking it.
  4. PrintApp exchanges the code and links the ATTACKER's
     Flickr account to the VICTIM's PrintApp account.
  5. Attacker now sees victim's PrintApp data through their Flickr.

WITH state parameter:

  1. PrintApp generates state=random_xyz, stores it in the
     user's session.
  2. Attacker's crafted link doesn't have the right state value
     (or has no state).
  3. PrintApp checks: does the returned state match what I stored
     in this user's session? No. Reject.
```

---

### Grant Types (Flows) — Different Situations Need Different Dances

OAuth 2.0 defines four grant types. Each solves a different problem.

---

#### Grant Type 1: Authorization Code Grant

**For:** Confidential clients (server-side apps with a backend).

This is the most secure, most common flow. It's the closest to OAuth 1.0's three-legged flow but dramatically simpler (no signatures).

```
USER             CLIENT              AUTHORIZATION         RESOURCE
(Browser)        (Backend)             SERVER                SERVER
   │                │                     │                    │
   │ (1) "Login     │                     │                    │
   │  with Flickr"  │                     │                    │
   │───────────────>│                     │                    │
   │                │                     │                    │
   │ (2) 302 Redirect                     │                    │
   │<───────────────│                     │                    │
   │ Location:                            │                    │
   │  https://as.com/authorize?           │                    │
   │    response_type=code                │                    │
   │    &client_id=printapp               │                    │
   │    &redirect_uri=https://            │                    │
   │     printapp.com/callback            │                    │
   │    &scope=read:photos                │                    │
   │    &state=random_xyz                 │                    │
   │                                      │                    │
   │ (3) Browser goes to AS               │                    │
   │─────────────────────────────────────>│                    │
   │                                      │                    │
   │ (4) User logs in + sees consent      │                    │
   │     screen + clicks Allow            │                    │
   │─────────────────────────────────────>│                    │
   │                                      │                    │
   │ (5) 302 Redirect back               │                    │
   │<─────────────────────────────────────│                    │
   │ Location:                            │                    │
   │  https://printapp.com/callback?      │                    │
   │    code=AUTH_CODE_abc                │                    │
   │    &state=random_xyz                 │                    │
   │                                      │                    │
   │ (6) Browser hits Client callback     │                    │
   │───────────────>│                     │                    │
   │                │                     │                    │
   │                │ (7) POST /oauth/token (server-to-server) │
   │                │   grant_type=authorization_code          │
   │                │   code=AUTH_CODE_abc                     │
   │                │   redirect_uri=https://printapp.com/cb   │
   │                │   client_id=printapp                     │
   │                │   client_secret=SECRET                   │
   │                │────────────────────>│                    │
   │                │                     │                    │
   │                │ (8) Response:       │                    │
   │                │  { access_token,    │                    │
   │                │    refresh_token,   │                    │
   │                │    expires_in,      │                    │
   │                │    token_type }     │                    │
   │                │<────────────────────│                    │
   │                │                     │                    │
   │                │ (9) GET /api/photos │                    │
   │                │   Authorization: Bearer AT              │
   │                │─────────────────────────────────────────>│
   │                │                     │                    │
   │                │(10) { photos: [...] }                    │
   │ (11) Here are  │<─────────────────────────────────────────│
   │  your photos   │                     │                    │
   │<───────────────│                     │                    │
```

The security property to notice: the **authorization code** is the only secret that passes through the browser (in the redirect URL). But the code alone is useless — it can only be exchanged for a token by someone who also has the `client_secret`, which only the Client backend knows. The access token goes directly from AS to Client backend in step 8 — the browser never sees it.

The code is also:
- **One-time use** — once exchanged, it's invalidated
- **Short-lived** — typically expires in 30-60 seconds
- **Bound to the redirect URI** — the AS checks that the redirect_uri in step 7 matches the one from step 2

---

#### Grant Type 2: Implicit Grant (now deprecated)

**For:** Public clients (SPAs) circa 2012, when CORS wasn't universally supported.

The problem: a JavaScript SPA running in the browser has no backend. It can't make a server-to-server POST to exchange a code for a token (step 7 above) because it has no `client_secret` to authenticate with. In 2012, making cross-origin POST requests from browsers was unreliable (CORS support was patchy).

The solution at the time: skip the code exchange. Return the access token directly in the URL.

```
USER             SPA (Browser)           AUTHORIZATION SERVER
   │                │                           │
   │ Click Login    │                           │
   │───────────────>│                           │
   │                │                           │
   │ Redirect to AS with                        │
   │   response_type=token   (NOT "code"!)      │
   │<───────────────│                           │
   │                                            │
   │ Login + consent                            │
   │───────────────────────────────────────────>│
   │                                            │
   │ Redirect back with token IN THE FRAGMENT   │
   │<───────────────────────────────────────────│
   │                                            │
   │ https://myapp.com/cb#access_token=AT       │
   │                      &token_type=Bearer    │
   │                      &expires_in=3600      │
```

The `#` (fragment) part of the URL is significant. Fragments are NOT sent to the server — they stay in the browser. So when the browser follows the redirect to `myapp.com/cb`, the server at `myapp.com` never sees `access_token=AT`. Only the JavaScript running in the browser can read it via `window.location.hash`.

**Why this is deprecated (serious security flaws):**

1. The access token is in the URL. Browser history logs it. If the user bookmarks the page, the token is in the bookmark. The Referer header might leak it to other sites.
2. No refresh tokens are issued (the AS can't authenticate the client, so it can't trust it with a long-lived refresh token).
3. Token injection attack: an attacker can substitute their own stolen token in the redirect URL, and the SPA has no way to verify it's the right token for this authorization.

The replacement: Authorization Code + PKCE (next section).

---

#### Grant Type 3: Resource Owner Password Credentials (ROPC) (deprecated)

**For:** Legacy migration only. First-party apps that already collected passwords.

```
USER              CLIENT                  AUTHORIZATION SERVER
  │                  │                            │
  │ Types username   │                            │
  │ and password     │                            │
  │ into CLIENT's    │                            │
  │ login form       │                            │
  │─────────────────>│                            │
  │                  │                            │
  │                  │ POST /oauth/token           │
  │                  │   grant_type=password       │
  │                  │   username=varun            │
  │                  │   password=hunter42         │
  │                  │   client_id=first_party_app │
  │                  │   scope=read:photos         │
  │                  │───────────────────────────>│
  │                  │                            │
  │                  │ { access_token, ... }       │
  │                  │<───────────────────────────│
```

The user gives their actual password to the Client. This directly contradicts OAuth's purpose. It existed as a bridge: "if you already have an app collecting passwords, at least use this to get tokens so you can eventually stop collecting passwords."

**Deprecated in OAuth 2.1.** Don't use it.

---

#### Grant Type 4: Client Credentials

**For:** Machine-to-machine. No user involved at all.

```
SERVICE A (Client)                 AUTHORIZATION SERVER
       │                                   │
       │ POST /oauth/token                 │
       │   grant_type=client_credentials   │
       │   client_id=service_a             │
       │   client_secret=SECRET_A          │
       │   scope=read:inventory            │
       │──────────────────────────────────>│
       │                                   │
       │ { access_token: "AT",             │
       │   token_type: "Bearer",           │
       │   expires_in: 3600 }              │
       │<──────────────────────────────────│
       │                                   │
       │ GET /api/inventory                │
       │ Authorization: Bearer AT          │
       │──────────────────────────────────────> SERVICE B (Resource Server)
```

No redirects, no browser, no user. Service A authenticates as itself and gets a token representing Service A's own identity. Common in backend microservice architectures: "the inventory service needs to call the pricing service."

---

### The Complete Endpoint Map for OAuth 2.0

```
ENDPOINT              │ CALLED BY      │ CALLED WHEN           │ PURPOSE
──────────────────────┼────────────────┼───────────────────────┼──────────────────────
GET /authorize        │ User's browser │ Start of auth code    │ Show login + consent
                      │ (via redirect) │ or implicit flow      │ screen to user
                      │                │                       │
POST /oauth/token     │ Client backend │ After getting auth    │ Exchange code/refresh
                      │ (server-to-    │ code, or refreshing,  │ token/credentials for
                      │  server)       │ or client_credentials │ access token
                      │                │                       │
GET /api/resource     │ Client         │ Any time after token  │ Access protected data
                      │                │ obtained              │ (Bearer token in header)
                      │                │                       │
POST /oauth/revoke    │ Client         │ User logs out or      │ Invalidate a token
(RFC 7009)            │                │ disconnects app       │
                      │                │                       │
POST /oauth/introspect│ Resource Server│ When RS gets a token  │ Check if token is valid
(RFC 7662)            │                │ it can't verify       │ + get metadata (scope,
                      │                │ locally               │ expiry, user)
```

---

## Chapter 6: PKCE — Filling the Public Client Gap (RFC 7636, 2015)

Pronounced "pixy." Proof Key for Code Exchange.

The Implicit Grant is dead, but public clients (SPAs, mobile apps) still need OAuth. They should use the Authorization Code flow, but there's a problem: without a `client_secret`, anyone who intercepts the authorization code can exchange it.

### The Specific Attack

On mobile, apps register "custom URL schemes" to receive redirects (like `myapp://callback`). But multiple apps can register the same scheme, and the OS might deliver the redirect to the wrong one:

```
LEGITIMATE APP          EVIL APP            AUTH SERVER
      │                    │                     │
      │ ── (1) Start ─────────────────────────> │
      │    redirect_uri=                         │
      │    myapp://callback                      │
      │                                          │
      │                    │ (also registered     │
      │                    │  myapp://callback)   │
      │                                          │
      │ <── (2) redirect ───────────────────────│
      │    code=AUTH_CODE  │                     │
      │                    │                     │
      │    OS delivers     │                     │
      │    to evil app! ──>│                     │
      │                    │                     │
      │                    │── (3) POST /token ─>│
      │                    │   code=AUTH_CODE     │
      │                    │   (no client_secret  │
      │                    │    needed!)          │
      │                    │<── access_token ────│
      │                    │                     │
      │         ATTACKER HAS THE TOKEN           │
```

Since there's no `client_secret` (public client), the authorization code alone is sufficient to get an access token. The interception is the vulnerability.

### How PKCE Solves It

PKCE adds a per-request dynamic secret — no long-lived secret needed.

```
CLIENT (e.g., mobile app)               AUTHORIZATION SERVER
  │                                              │
  │ (1) Generate a random string:                │
  │     code_verifier = "dBjftJeZ4CVP-mB92K..."  │
  │     (43-128 characters, random)              │
  │                                              │
  │ (2) Hash it:                                 │
  │     code_challenge = BASE64URL(              │
  │       SHA256(code_verifier)                  │
  │     )                                        │
  │     = "E9Melhoa2OwvFrEMTJguCH..."            │
  │                                              │
  │ (3) Start auth flow — send the HASH only:    │
  │     GET /authorize?                          │
  │       response_type=code                     │
  │       &client_id=myapp                       │
  │       &code_challenge=E9Melhoa2Ow...         │
  │       &code_challenge_method=S256            │
  │       &redirect_uri=myapp://callback         │
  │       &scope=read:photos                     │
  │       &state=xyz                             │
  │──────────────────────────────────────────────>│
  │                                              │
  │         AS stores the code_challenge         │
  │         alongside the authorization code     │
  │                                              │
  │ (4) User logs in, approves                   │
  │                                              │
  │ (5) Redirect back with authorization code    │
  │<──────────────────────────────────────────────│
  │     code=AUTH_CODE_xyz                       │
  │                                              │
  │ (6) Exchange code — send the ORIGINAL VALUE: │
  │     POST /oauth/token                        │
  │       grant_type=authorization_code          │
  │       &code=AUTH_CODE_xyz                    │
  │       &code_verifier=dBjftJeZ4CVP-mB92K...  │
  │       &client_id=myapp                       │
  │       &redirect_uri=myapp://callback         │
  │──────────────────────────────────────────────>│
  │                                              │
  │         AS computes:                         │
  │           BASE64URL(SHA256("dBjftJeZ4CVP-mB92K..."))
  │           == stored code_challenge?          │
  │                                              │
  │         YES -> issue token                   │
  │         NO  -> reject                        │
  │                                              │
  │ (7) { access_token, refresh_token }          │
  │<──────────────────────────────────────────────│
```

**Why the attacker is blocked:**

In step 3, the `code_challenge` (a SHA-256 hash) goes through the browser. The attacker could potentially see it. In step 5, the `code` also goes through the browser — the attacker intercepts it. But in step 6, the attacker needs the `code_verifier` (the original random string BEFORE hashing). SHA-256 is a one-way function — knowing the hash tells you nothing about the input. Only the legitimate app that generated the verifier in step 1 has it (it stayed in the app's memory, never sent through the browser).

```
What the attacker has:        What the attacker needs:
  code = AUTH_CODE_xyz          code = AUTH_CODE_xyz      [has it]
  code_challenge = E9Mel...     code_verifier = dBjft...  [CANNOT derive]
                                  ^
                                  SHA-256 is one-way.
                                  Hash -> original is
                                  computationally impossible.
```

---

## Chapter 7: Where We Are Now

### OAuth 2.1 (Draft, expected to finalize soon)

Not a new protocol. A cleanup and consolidation. It takes OAuth 2.0 (RFC 6749) and bakes in a decade of security lessons:

```
REMOVED in 2.1:
  - Implicit Grant                    (use Auth Code + PKCE instead)
  - Password Grant (ROPC)            (use Auth Code + PKCE instead)
  - Tokens in URL query strings      (use Authorization header only)

MANDATORY in 2.1:
  - PKCE for ALL auth code flows     (even confidential clients)
  - Exact redirect URI matching      (no wildcards, no partial matches)
  - Refresh token rotation           (or sender-constraining via DPoP)
```

### Token Formats: Opaque vs JWT

OAuth 2.0 doesn't dictate what a token looks like. Two approaches exist:

```
OPAQUE TOKEN:
  access_token = "a3f8b2c1d4e5f6..."
  Just a random string. Meaningless on its own.
  Resource Server must call AS to validate:

    RS ── POST /oauth/introspect ──> AS
          { token: "a3f8b2c1..." }
    RS <── { active: true,       ── AS
             scope: "read:photos",
             sub: "varun",
             exp: 1720000000 }

  Pro: AS has full control. Can revoke instantly.
  Con: Every API call requires an introspection round-trip.


JWT (JSON Web Token) ACCESS TOKEN (RFC 9068):
  access_token = "eyJhbGciOiJSUzI1NiIs..."
  
  Decodes to:
    Header:  { alg: "RS256", typ: "JWT" }
    Payload: { sub: "varun", scope: "read:photos",
               iss: "https://as.com", exp: 1720000000 }
    Signature: RS256(header + payload, AS_private_key)

  RS validates LOCALLY:
    - Fetches AS's public key (once, cached)
    - Verifies signature
    - Checks exp, iss, scope
    - No call to AS needed

  Pro: No introspection round-trip. RS is independent.
  Con: Can't revoke instantly. Token is valid until it expires
       (unless you maintain a revocation list, adding complexity).
```

### DPoP: Fixing Bearer Token Weakness (RFC 9449)

Bearer tokens are like cash — if stolen, the thief can use them. DPoP (Demonstrating Proof of Possession) adds proof that you're the legitimate holder:

```
WITHOUT DPoP (bearer token):
  Attacker steals token ──> uses it directly ──> gets access

WITH DPoP:
  Client generates a key pair (public + private).
  Every request includes a DPoP proof (signed with private key).
  
  Attacker steals token ──> can't produce valid DPoP proof
                            (doesn't have private key)
                        ──> access denied
```

This is conceptually similar to what OAuth 1.0's signatures achieved (proving possession of a secret), but layered on top of HTTPS rather than replacing it.

### OAuth vs OpenID Connect — The Authentication Layer

Remember Chapter 0? OAuth is authorization ("what can this app do?"), not authentication ("who is the user?"). Getting an access token with `scope=read:photos` tells the app it can read photos. It does NOT reliably tell the app who authorized it.

**OpenID Connect (OIDC)**, published in 2014, is an identity layer built on top of OAuth 2.0. It adds:

```
PLAIN OAuth 2.0:
  Client gets: access_token (for API access)
  Client knows: "I can read photos"
  Client does NOT reliably know: "who authorized me"

OAuth 2.0 + OpenID Connect:
  Client gets: access_token (for API access)
             + id_token (a JWT containing user identity)
  Client knows: "I can read photos"
             + "The user is varun@example.com"
```

The `id_token` is a JWT containing identity claims: `sub` (unique user ID), `email`, `name`, `iss` (who issued it), `aud` (who it's for), `exp` (expiry).

When someone says "Login with Google" — that's OIDC. The app gets an ID Token (to know who you are) and optionally an access token (to access Google APIs on your behalf).

---

That's the full arc. The password anti-pattern created the need. OAuth 1.0 solved it with signatures (complex but worked without HTTPS). OAuth 2.0 dropped signatures in favor of mandatory HTTPS, split the Service Provider into AS/RS, added client types, scopes, refresh tokens, and multiple flows for different situations. PKCE solved the public client problem. OAuth 2.1 is cleaning up the deprecated flows and hardening the defaults. OIDC added identity on top of all of it.
