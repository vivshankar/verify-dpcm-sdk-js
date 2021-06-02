# IBM Security Verify Data Privacy and Consent SDK for JavaScript

Fast, opinionated, simple privacy SDK for [Node](https://nodejs.org)
that leverages the data privacy & consent engine on IBM Security Verify.

---
**NOTE**

This is not an official SDK. However, issues may still be created
on this Github repository for feature requests and bugs.

---

```js
const Privacy = require('verify-dpcm-sdk-js');

// tenant information and other global config
const config = { tenantUrl: "https://abc.verify.ibm.com" };
// access token generated using any OAuth client library
const auth = { accessToken: getToken() };
// optional context
const context = { "ipAddress": "1.2.3.4" };

const privacy = new Privacy(config, auth, context);

// determine items that need assessment
let items = [
    {
        "purposeId": "marketing",
        "attributeId": "11", // mobile_number
        "accessTypeId": "default"
    }
];

doAssess = (req, res) => {
  // assess if the item can be used
  let decision = await privacy.assess(items);
  if (decision.status == "consent") {
    // metadata used to render a user consent page
    let metadata = await privacy.getConsentMetadata(items);
    res.render('consent', { metadata: metadata.response });
  }
  // handle other cases
}

```

## Prerequisites

* Sign up for your [IBM Security Verify Tenant](https://docs.verify.ibm.com/verify/docs/signing-up-for-a-free-trial).
* If you are not using an OAuth/OIDC application to get a user/delegated token, obtain a privileged access token by configuring an [API client](https://docs.verify.ibm.com/verify/docs/create-api-client) with the following entitlements.
  - Check for data usage approval _to assess the usage of requested data items_
  - Retrieve privacy purposes and associated user's consent _to present a complete user consent experience_
  - Create privacy consent records _to record consents_
  - Read privacy consents _to get the user's consents_
* Identify attributes you intend to use in your application that require assessment
* Identify purpose-of-use for those attributes

## Installation

Use [npm](https://github.com/npm/cli) to install the SDK:

```bash
$ npm install https://github.com/vivshankar/verify-dpcm-sdk-js
```

## Features

- Integrate with the Verify data privacy engine using APIs
- Insert privacy assessment and consent at any point in your application flow. Privacy & compliance regulations are configured centrally on the Verify tenant
- Build pleasing experiences for user consent and preferences using the simplified object returned by the `getConsentMetadata` function

## Documentation

* [Library documentation](https://vivshankar.github.io/verify-dpcm-sdk-js/)
* Usage examples

## Tests

1. Install dependencies
2. Copy `./test/dotenv` to `.env` in the same directory
3. Generate an OAuth token using one of the user grant flows supported by Verify
4. Run the test suite:

```bash
$ npm install
$ npm test
```

If you want to see debug logs, run:

```js
$ npm run testdebug
```