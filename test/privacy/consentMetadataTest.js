const assert = require('assert');
const Env = require('../utils/config');
const config = Env.Config; const auth = Env.Auth; const context = Env.Context;
const Privacy = require('../../lib/privacy');

describe('Privacy', () => {
  before( async () => {
    if (!config.tenantUrl || config.tenantUrl == '') {
      throw new Error('TENANT_URL is missing from the env');
    }

    if (!auth.accessToken || auth.accessToken == '') {
      throw new Error('ACCESS_TOKEN is missing from the env');
    }

    // precreate some consents
    const client = new Privacy(config, auth, context);
    await client.storeConsents([
      {
        // Consent with attribute value
        'purposeId': 'profilemgmt',
        'attributeId': 'mobile_number',
        'attributeValue': '+651234567',
        'accessTypeId': 'read',
        'state': 3,
      },
      {
        // Consent without attribute value
        'purposeId': 'profilemgmt',
        'attributeId': 'given_name',
        'accessTypeId': 'read',
        'state': 3,
      },
      {
        // Consent that is in the future
        'purposeId': 'profilemgmt',
        'attributeId': 'display_name',
        'accessTypeId': 'read',
        'state': 3,
        'startTime': 1749508768,
      },
      {
        // Opt out
        'purposeId': 'profilemgmt',
        'attributeId': 'family_name',
        'accessTypeId': 'read',
        'state': 4,
      },
    ]);
  });

  describe('#consentMetadata', () => {
    it('get some metadata', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.getConsentMetadata([
          {
            'purposeId': 'profilemgmt',
            'attributeId': 'given_name',
            'accessTypeId': 'read',
          },
        ]);

        assert.strictEqual(result.status, 'done',
            `Result status is not done: ${result.status}`);
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });

    it('get error because of invalid purpose', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.getConsentMetadata([
          {
            'purposeId': 'marketing',
            'attributeId': 'given_name',
            'accessTypeId': 'default',
          },
          {
            'purposeId': '98b56762-398b-4116-94b5-125b5ca0d831',
          },
        ]);

        assert.strictEqual(result.status, 'error',
            `Result status is not done: ${result.status}`);
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });

    it('deep test', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.getConsentMetadata([
          {
            'purposeId': 'profilemgmt',
            'attributeId': 'given_name',
            'accessTypeId': 'read',
          },
          {
            'purposeId': 'profilemgmt',
            'attributeId': 'mobile_number',
            'attributeValue': '+6598786',
            'accessTypeId': 'read',
          },
          {
            'purposeId': 'profilemgmt',
            'attributeId': 'mobile_number',
            'attributeValue': '+651234567',
            'accessTypeId': 'read',
          },
          {
            'purposeId': 'profilemgmt',
            'attributeId': 'display_name',
            'accessTypeId': 'read',
          },
        ]);

        assert.strictEqual(result.status, 'done',
            `Result status is not done: ${result.status}`);
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });
  });
});
