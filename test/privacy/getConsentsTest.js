const assert = require('assert');
const Env = require('../utils/config')
const config = Env.Config, auth = Env.Auth, context = Env.Context
const Privacy = require('../../lib/privacy')

describe('Privacy', () => {

    before((done) => {
        if (!config.tenantUrl || config.tenantUrl == '') {
            return done('TENANT_URL is missing from the env')
        }

        if (!auth.accessToken || auth.accessToken == '') {
            return done('ACCESS_TOKEN is missing from the env')
        }

        return done();
    });

    describe('#getUserConsents', () => {
        it('get user consents', async () => {
            let client = new Privacy(config, auth, context)

            try {
                let result = await client.getUserConsents();
                
                assert.strictEqual(result.status, "done", `Result status is not done: ${result.status}`)
            } catch (error) {
                assert.fail(`Error thrown:\n${error}`);
            }
        });

        it('get error because of invalid purpose', async () => {
            let client = new Privacy(config, auth, context)

            try {
                let result = await client.getConsentMetadata([
                    {
                        "purposeId": "marketing",
                        "attributeId": "11", // mobile_number
                        "accessTypeId": "default"
                    },
                    {
                        "purposeId": "98b56762-398b-4116-94b5-125b5ca0d831",
                    }
                ])
                
                assert.strictEqual(result.status, "error", `Result status is not done: ${result.status}`)
            } catch (error) {
                assert.fail(`Error thrown:\n${error}`);
            }
        });
    })
})