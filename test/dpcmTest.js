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
                assert.ok(true, "Consents were not returned")
            }).catch(err => {
                console.log("Error=" + err);
                assert.fail('getConsents failed')
            })
        });
    })
})