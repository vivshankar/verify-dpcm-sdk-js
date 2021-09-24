const assert = require('assert');
const Env = require('../utils/config');
const config = Env.Config; const auth = Env.Auth; const context = Env.Context;
const checkConfig = Env.checkConfig;
const Privacy = require('../../lib/privacy');

describe('Privacy', () => {
  before(async () => {
    await checkConfig();
  });

  describe('#userConsents', () => {
    it('create user consents', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.storeConsents([
          {
            'purposeId': 'marketing',
            'attributeId': 'mobile_number',
            'state': 3,
          },
        ]);
        assert.strictEqual(result.status, 'success',
            `Result status is unexpected: ${result.status}`);
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });

    it('get user consents', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.getUserConsents();
        assert(result.status == 'done',
            `Result status is unexpected: ${result.status}`);
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });

    it('get user consents for the current application', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.getUserConsents(
            {filterByCurrentApplication: true},
        );
        assert.notEqual(result.consents.length, 0);
        for (const consent of result.consents) {
          assert.strictEqual(!!consent.applicationId, true);
        }
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
            'attributeId': '11', // mobile_number
            'accessTypeId': 'default',
          },
          {
            'purposeId': '98b56762-398b-4116-94b5-125b5ca0d831',
          },
        ]);

        assert.strictEqual(result.status, 'error',
            `Result status is not unexpected: ${result.status}`);
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });
  });
});
