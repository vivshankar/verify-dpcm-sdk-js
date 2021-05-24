# IBM Security Verify Data Privacy and Consent SDK for JavaScript

The DPCM SDK for server-side JavaScript ([Node](https://nodejs.org)).
The purpose of this library is to provide an interface to integrate
data privacy and consent management using IBM Security Verify.

---
**NOTE**

This is not an official SDK. However, issues may still be created
on this Github repository for feature requests and bugs.

---

## Prerequisites

* Sign up for your [IBM Security Verify Tenant](https://docs.verify.ibm.com/verify/docs/signing-up-for-a-free-trial).
* If you are not using an OAuth/OIDC application that is issued a user access token, configure an [API client](https://docs.verify.ibm.com/verify/docs/create-api-client) with the following entitlements.
    - Check for data usage approval _to assess the usage of requested data items_
    - Retrieve privacy purposes and associated user's consent _to present a complete user consent experience_
    - Create privacy consent records _to record consents_
    - Read privacy consents _to get the user's consents_

## Installation

Use [npm](https://github.com/npm/cli) to install the SDK:

```bash
npm install https://github.com/vivshankar/verify-dpcm-sdk-js
```

## Configuration Settings

To use the DPCM SDK, you will need to initialise a `DPCM` object with a
configuration object and an optional context. The configuration object should 
contain the following parameters:

| Parameter      | Type     | Description |
|----------------|----------|-------------|
| `tenantUrl`    | `string` | The base URL of your IBM Security Verify Tenant including `https://` without an ending slash |

See [Initialise a DPCM object](#initialise-a-dpcm-object) for an
example.

## Context Object

The `DPCM` object accepts a context object. The context object may
contain the following parameters and, depending on the type of auth
token, may require `subjectId` to be specified:

| Parameter      | Type     | Description |
|----------------|----------|-------------|
| `ipAddress` | `string` | The IP address of the user-agent. |
| `subjectId` | `string` | The user identifier that Verify should be aware of unless `isExternalSubject` is set to true. |
| `isExternalSubject` | `boolean` | Indicates if the subject is known to Verify. |

---
**IMPORTANT**

`subjectId` must be provided if the access token used to authorize requests
is not a user token, i.e. the client is acting as a super-user with entitlements
to perform activities for any user in the system.

If `isExternalSubject=true`, the `subjectId` may be any value that is identifiable
outside of Verify. Verify recognizes the `subjectId` value as an opaque string and
does not associate the user to any Cloud Directory account.

If the access token used to authorize requests to Verify is associated with a user
known to Verify, there is no need to pass in a context object or specify a `subjectId`.
In other words, if the client is acting on behalf of a user and is issued a token
authorized to perform these actions on behalf of the user, there is no need to 
explicitly specify the `subjectId`.

---

## Auth Object

All functions in the `DPCM` object requires an auth object. The auth object
contains the following parameters:

| Parameter      | Type     | Description |
|----------------|----------|-------------|
| `accessToken` | `string` | The OAuth 2.0 token that is authorized to perform requests |

If the client intends to use DPCM on behalf of a user, it is recommended that
the token be generated using a user grant flow, like authorization code, password,
JWT Bearer etc. In this case, the context object does not need to contain any subject
specific information. If the client has been granted delegated authorization to manage
a number of users, the context object must contain subject information and the token
must be granted specific entitlements as described in [Prerequisites](#prerequisites)

## Overview

### [`class DPCM(config, [context])`](#initialise-a-dpcm-object)
| Function                                                                                                    | Async | Return |
|-------------------------------------------------------------------------------------------------------------|-------|--------|
| [`requestApproval(auth, duaRequest)`](#request-data-usage-approval)                                                    | ✅    | `Promise<Object>`
| [`getConsentMetadata(auth, purposes)`](#get-consent-metadata) | ✅    | `Promise<Object>`
| [`getUserConsents(auth)`](#get-user-consents) | ✅    | `Promise<Object>`

## Usage

### Import the DPCM SDK

```javascript
const DPCM = require('verify-dpcm-sdk-js');
```

### Initialise a DPCM object

```javascript
const config = {
  tenantUrl: 'https://mytenant.verify.ibm.com',
};

const context = {
    ipAddress: '1.2.3.4',
}

const dpcmClient = new DPCM(config, context);
```

### Request data usage approval

Request the consent management system to approve the use of data items
for the specified purpose, access type and an optional value. If the 
access type is not specified, it is set to a system default. The consent
management system will respond for each requested item with approved or 
not approved. In the case of the latter, an error message is provided
to indicate why the request for that data item was not approved.

#### `requestApproval(auth, duaRequest)`

| Parameter   | Type     | Description |
|-------------|----------|-------------|
| `auth`   | `Object` | See [Auth Object](#auth-object).
| `duaRequest` | `Array` | The approval request. See request object.

#### Request

The `duaRequest` is an array of objects. Each object contains the following
properties:

| Parameter      | Type     | Description |
|----------------|----------|-------------|
| `purposeId` | `string` | The purpose ID representing the privacy purpose configured on Verify. |
| `accessTypeId` | `string` | The access type ID representing the available access types on Verify.<br>This must be one of the access types selected for the purpose. |
| `attributeId` | `string` | The attribute ID on Verify. This must be configured as one of the<br>attributes for the purpose. This may be optional if no attributes are configured for the purpose. |
| `attributeValue` | `string` | The attribute value for the attribute. This is typically used when<br>the user has more than one value for the attribute. This is optional. |

#### Responses

* A `deny` response is received when the assessment fails.
  ```javascript
  {
    "status": "deny"
  }
  ```

* A `done` response will contain the completed assessment. Note that this does not imply all attributes are approved for use.
  ```javascript
  {
    "status": "done",
    "response": [
      {
        "purposeId": "marketing",
        "attributeId": "3",
        "accessTypeId": "default",
        "result": {
          "approved": false,
          "reason": {
            "messageId": "CSIBT0033I",
            "messageDescription":"No consent records that match the request criteria were found."
          }
        }
      }
    ]
  }
  ```

#### Example Usage

```javascript
let duaRequest = [
  {
    "purposeId": "marketing",
    "attributeId": "11", // mobile_number
    "accessTypeId": "default"
  }
]

dpcmClient.requestApproval(auth, duaRequest)
    .then((result) => {
      if (result.status == 'done') {
        // process success or partial success case
      } else {
        // process error
      }
    }).catch((error) => {
      console.log(error);
      // process error
    });
```

### Get consent metadata

Get consent metadata that can be used to build the consent page presented to 
the data subject/user. This includes exhaustive information of the purposes, 
attributes and access types and any other pertinent information needed to present 
a complete consent page. Details such as current consents are also listed here and 
may be compared with the current version of the purpose to determine if the
consent may perhaps be for an older purpose.

#### `getConsentMetadata(auth, purposes)`

| Parameter   | Type     | Description |
|-------------|----------|-------------|
| `auth`   | `Object` | See [Auth Object](#auth-object).
| `purposes` | `Array` | List of purpose IDs

#### Responses

* A `deny` response is received when the request fails.
  ```javascript
  {
    "status": "deny"
  }
  ```

* A `done` response will contain the complete metadata required to build a consent/preferences experience.
  ```javascript
  {
    "status": "done",
    "response": {
      "purposes": {
        "marketing": {
          "id": "marketing",
          "name": "Marketing",
          "version": 2,
          "description": "",
          "state": 1,
          "defaultConsentDuration": 90,
          "previousConsentApply": false,
          "similarToVersion": 2,
          "tags": [
            "verify"
          ],
          "category": "default",
          "dataCount": 3,
          "accessTypes": [
            {
              "id": "default"
            }
          ],
          "attributes": [
            {
              "id": "3",
              "mandatory": false,
              "retentionPeriod": 7,
              "accessTypes": [
                {
                  "id": "default",
                  "legalCategory": 4,
                  "assentUIDefault": false
                }
              ]
            },
            {
              "id": "11",
              "mandatory": false,
              "retentionPeriod": 7,
              "accessTypes": [
                {
                  "id": "default",
                  "legalCategory": 4,
                  "assentUIDefault": false
                }
              ]
            }
          ]
        }
      },
      "consents": {
        "86126e94-ad8d-4756-9233-5e241d2284c9": {
          "purposeId": "marketing",
          "purposeVersion": 2,
          "isGlobal": false,
          "applicationId": "1045301010528768009",
          "attributeId": "3",
          "accessTypeId": "default",
          "geoIP": "103.252.202.125",
          "state": 1,
          "createdTime": 1621778112,
          "lastModifiedTime": 1621778112,
          "startTime": 1621778112,
          "endTime": 1629554112,
          "version": 1,
          "status": 1
        }
      },
      "accessTypes": {
        "default": {
          "name": "default"
        }
      },
      "attributes": {
        "3": {
          "name": "email",
          "description": "The user's work email.",
          "scope": "global",
          "sourceType": "schema",
          "datatype": "string",
          "tags": [
            "sso",
            "prov"
          ],
          "credName": "email",
          "schemaAttribute": {
            "name": "mail",
            "attributeName": "email",
            "scimName": "emails",
            "customAttribute": false
          },
          "constraints": {
            "readAccessForEndUser": true,
            "writeAccessForEndUser": true,
            "mandatory": false,
            "unique": false
          }
        },
        "11": {
          "name": "mobile_number",
          "description": "The user's mobile phone number.",
          "scope": "global",
          "sourceType": "schema",
          "datatype": "string",
          "tags": [
            "sso",
            "prov"
          ],
          "credName": "mobile_number",
          "schemaAttribute": {
            "name": "mobile",
            "attributeName": "mobile_number",
            "scimName": "phoneNumbers",
            "customAttribute": false
          },
          "constraints": {
            "readAccessForEndUser": true,
            "writeAccessForEndUser": true,
            "mandatory": false,
            "unique": false
          }
        }
      }
    }
  }
  ```

#### Example Usage

```javascript
let purposes = [ 'marketing' ]
dpcmClient.getConsentMetadata(auth, purposes)
    .then((result) => {
      if (result.status == 'done') {
        // process success
      } else {
        // process error
      }
    }).catch((error) => {
      console.log(error);
      // process error
    });
```

### Get user consents

Get all user consents. If the access token used to authorize requests
is not associated to a specific user, a `context.subjectId` must be
provided when initializing the DPCM object.

#### `getUserConsents(auth)`

| Parameter   | Type     | Description |
|-------------|----------|-------------|
| `auth`   | `Object` | See [Auth Object](#auth-object).

#### Responses

* A `deny` response is received when the request fails.
  ```javascript
  {
    "status": "deny"
  }
  ```

* A `done` response will contain the complete metadata required to build a consent/preferences experience.
  ```javascript
  {
    "status": "done",
    "response": {
      consents: {
        limit: 50,
        page: 1,
        total: 6,
        consents: [
          {
            id: 'ae39a8a4-4ca8-45f0-ad2a-579ba3e31d50',
            version: 1,
            isExternalSubject: false,
            subjectId: '673000CVHF',
            applicationId: '1045301010528768009',
            purposeId: 'ibm-oauth-scope',
            purposeVersion: 1,
            purposeName: 'ibm-oauth-scope',
            accessTypeId: 'default',
            accessTypeName: 'default',
            state: 1,
            isGlobal: false,
            createdTime: 1621778112,
            lastModifiedTime: 1621778112,
            startTime: 1621778112,
            geoIP: '103.252.202.125',
            attributeId: 'openid',
            attributeValue: null,
            attributeName: 'openid',
            applicationName: 'Verify OIDC Demo',
            customAttributes: []
          },
          {
            id: '374c5f2f-84f3-4421-98b4-28d3b2af2b3d',
            version: 1,
            isExternalSubject: false,
            subjectId: '673000CVHF',
            applicationId: '1045301010528768009',
            purposeId: 'ibm-oauth-scope',
            purposeVersion: 1,
            purposeName: 'ibm-oauth-scope',
            accessTypeId: 'default',
            accessTypeName: 'default',
            state: 1,
            isGlobal: false,
            createdTime: 1621778112,
            lastModifiedTime: 1621778112,
            startTime: 1621778112,
            geoIP: '103.252.202.125',
            attributeId: 'profile',
            attributeValue: null,
            attributeName: 'profile',
            applicationName: 'Verify OIDC Demo',
            customAttributes: []
          },
          {
            id: '86126e94-ad8d-4756-9233-5e241d2284c9',
            version: 1,
            isExternalSubject: false,
            subjectId: '673000CVHF',
            applicationId: '1045301010528768009',
            purposeId: 'marketing',
            purposeVersion: 2,
            purposeName: 'Marketing',
            accessTypeId: 'default',
            accessTypeName: 'default',
            state: 1,
            isGlobal: false,
            createdTime: 1621778112,
            lastModifiedTime: 1621778112,
            startTime: 1621778112,
            endTime: 1629554112,
            geoIP: '103.252.202.125',
            attributeId: '3',
            attributeValue: null,
            attributeName: 'email',
            applicationName: 'Verify OIDC Demo',
            customAttributes: []
          }
        ]
      }
    }
  }
  ```

___
**NOTE**

`ibm-oauth-scope` is a special purpose shown in the above example. This represents
a standard OAuth or OIDC scope to which the user has consented as part of a standard
federation flow.
___

#### Example Usage

```javascript
dpcmClient.getUserConsents(auth)
    .then((result) => {
      if (result.status == 'done') {
        // process success
      } else {
        // process error
      }
    }).catch((error) => {
      console.log(error);
      // process error
    });
```
