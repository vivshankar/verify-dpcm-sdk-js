const assert = require('assert');
const DPCM = require('../dpcm')

describe('DPCM', () => {

    let config = {}
    let auth = {}
    let context = {}

    before((done) => {
        // check for environment variables and assign test config
        config = {
            tenantUrl: process.env.TENANT_URL,
        }

        auth = {
            accessToken: process.env.ACCESS_TOKEN,
        }

        context = {
            ipAddress: (process.env.IP_ADDRESS ? process.env.IP_ADDRESS : null),
            subjectId: (process.env.SUBJECT_ID ? process.env.SUBJECT_ID : null),
            isExternalSubject: (process.env.isExternalSubject && process.env.isExternalSubject == "true" ? true : false),
        }

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