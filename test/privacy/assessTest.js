const assert = require('assert');
const Env = require('../utils/config');
const config = Env.Config; const auth = Env.Auth; const context = Env.Context;
const Privacy = require('../../lib/privacy');
const debug = require('debug')('verify:assessTest');

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

  describe('#assess', () => {
    it('should not be approved', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.assess([
          {
            'purposeId': 'marketing',
            'attributeId': 'email',
            'accessTypeId': 'default',
          },
        ]);

        debug(`result =\n${JSON.stringify(result)}`);
        assert.strictEqual(result.status, 'consent',
            `Result status is not consent: ${result.status}`);
        assert.ok(result.assessment[0].purposeId == 'marketing',
            'Purpose ID in the response does not match');
        assert.ok(!result.assessment[0].result[0].approved,
            'Request is approved. This is unexpected');
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });

    it('should be denied', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.assess([
          {
            'purposeId': '98b56762-398b-4116-94b5-125b5ca0d831',
          },
        ]);
        debug(`result =\n${JSON.stringify(result)}`);
        const purposeId = '98b56762-398b-4116-94b5-125b5ca0d831';
        assert.strictEqual(result.status, 'denied',
            `Result status is not done: ${result.status}`);
        assert.ok(result.assessment[0].purposeId == purposeId,
            'Purpose ID in the response does not match');
        assert.ok(!result.assessment[0].result[0].approved,
            'Request is approved. This is unexpected');
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });

    it('should ask for consent though one result is denied', async () => {
      const client = new Privacy(config, auth, context);

      try {
        const result = await client.assess([
          {
            'purposeId': 'marketing',
            'attributeId': 'email',
            'accessTypeId': 'default',
          },
          {
            'purposeId': '98b56762-398b-4116-94b5-125b5ca0d831',
          },
        ]);

        debug(`result =\n${JSON.stringify(result)}`);
        assert.strictEqual(result.status, 'consent',
            `Result status is not done: ${result.status}`);
        assert.ok(result.assessment[0].purposeId == 'marketing',
            'Purpose ID in the response does not match');
        assert.ok(!result.assessment[0].result[0].approved,
            'Request is approved. This is unexpected');
      } catch (error) {
        assert.fail(`Error thrown:\n${error}`);
      }
    });

    it('badeula', async () => {
      const client = new Privacy(config, auth, context);

      const result = await client.assess([
        {
          'purposeId': 'badeula',
        },
      ]);

      debug(`result =\n${JSON.stringify(result)}`);
      assert.strictEqual(result.status, 'denied',
          `Result status is not error: ${JSON.stringify(result)}`);
    });
  });
});
