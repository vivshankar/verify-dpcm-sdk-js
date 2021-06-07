const assert = require('assert');
const Env = require('../utils/config');
const config = Env.Config; const auth = Env.Auth; const context = Env.Context;
const Privacy = require('../../lib/privacy');

describe('Privacy', () => {
  before((done) => {
    if (!config.tenantUrl || config.tenantUrl == '') {
      return done('TENANT_URL is missing from the env');
    }

    if (!auth.accessToken || auth.accessToken == '') {
      return done('ACCESS_TOKEN is missing from the env');
    }

    return done();
  });

  describe('#consentMetadata', () => {
    it('get some metadata', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.getConsentMetadata([
          {
            'purposeId': 'marketing',
            'attributeId': 'mobile_number', // mobile_number
            'accessTypeId': 'default',
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
            'attributeId': 'mobile_number', // mobile_number
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
  });
});
