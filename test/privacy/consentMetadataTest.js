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

    describe('#consentMetadata', () => {
        it('get some metadata', () => {
            let client = new Privacy(config, auth, context)
            client.getConsentMetadata([
                {
                    "purposeId": "marketing",
                    "attributeId": "11", // mobile_number
                    "accessTypeId": "default"
                }
            ]).then(result => {
                assert.strictEqual(result.status, "done", `Result status is not done: ${result.status}`)
            }).catch(err => {
                console.log("Error=" + err);
                assert.fail('getConsentMetadata failed')
            })
        });

        it('get error because of invalid purpose', () => {
            let client = new Privacy(config, auth, context)
            client.getConsentMetadata([
                {
                    "purposeId": "marketing",
                    "attributeId": "11", // mobile_number
                    "accessTypeId": "default"
                },
                {
                    "purposeId": "98b56762-398b-4116-94b5-125b5ca0d831",
                }
            ]).then(result => {
                assert.strictEqual(result.status, "error", `Result status is not done: ${result.status}`)
            }).catch(err => {
                console.log("Error=" + err);
                assert.fail('getConsentMetadata failed')
            })
        });
    })
})