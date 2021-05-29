const assert = require('assert');
const Env = require('../utils/config')
const config = Env.Config, auth = Env.Auth, context = Env.Context
const DPCM = require('../../lib/dpcm')

describe('DPCM', () => {

   before((done) => {
        if (!config.tenantUrl || config.tenantUrl == '') {
            return done('TENANT_URL is missing from the env')
        }

        if (!auth.accessToken || auth.accessToken == '') {
            return done('ACCESS_TOKEN is missing from the env')
        }

        return done();
    });

    describe('#getConsents', () => {
        it('should return successfully', () => {
            let dpcmClient = new DPCM(config, context)
            dpcmClient.getUserConsents(auth).then(result => {
                assert.strictEqual(result.status, "done", `Result status is not done: ${result.status}`)
            }).catch(err => {
                console.log("Error=" + err);
                assert.fail('getConsents failed')
            })
        });
    })

    describe('#requestApproval', () => {
        it('should not be approved', () => {
            let dpcmClient = new DPCM(config, context)
            dpcmClient.requestApproval(auth, [
                {
                    "purposeId": "marketing",
                    "attributeId": "11", // mobile_number
                    "accessTypeId": "default"
                }
            ]).then(result => {
                assert.strictEqual(result.status, "done", `Result status is not done: ${result.status}`)
                assert.ok(result.response[0].purposeId == "marketing", "Purpose ID in the response does not match")
                assert.ok(!result.response[0].result.approved, "Request is approved. This is unexpected")
            }).catch(err => {
                console.log("Error=" + err);
                assert.fail('requestApproval failed')
            })
        });
    })

    describe('#getConsentMetadata', () => {
        it('get some metadata', () => {
            let dpcmClient = new DPCM(config, context)
            dpcmClient.getConsentMetadata(auth, [ 
                'marketing'
            ]).then(result => {
                assert.strictEqual(result.status, "done", `Result status is not done: ${result.status}`)
            }).catch(err => {
                console.log("Error=" + err);
                assert.fail('getConsentMetadata failed')
            })
        });
    })

    describe('#storeConsents', () => {
        it('store bad consents', () => {
            let dpcmClient = new DPCM(config, context)
            dpcmClient.storeConsents(auth, [ 
                {
                    "op": "add",
                    "path": null,
                    "value": {
                        "purposeId": "marketing",
                        "attributeId": "1",
                        "accessTypeId": "default",
                        "state": 1
                    }
                }
            ]).then(result => {
                assert.strictEqual(result.status, "done", `Result status is not done: ${result.status}`)
            }).catch(err => {
                console.log("Error=" + err);
                assert.fail('getConsentMetadata failed')
            })
        });
    })
})