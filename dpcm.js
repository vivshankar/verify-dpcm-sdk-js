const ConfigurationError = require('./lib/errors/configurationError')
const DPCMService = require('./lib/services/dpcm/dpcmService')

class DPCM {
    constructor(config, context) {
        if (!config.tenantUrl) {
            throw new ConfigurationError(
                `Cannot find property 'tenantUrl' in configuration settings.`);
        }

        this._config = config;
        this._context = context;
    }

    /**
    * Evaluate the data items requested for approval.
    *
    * Request the consent management system to approve the use of data items
    * for the specified purpose, access type and an optional value. If the 
    * access type is not specified, it is set to a system default. The consent
    * management system will respond for each requested item with approved or 
    * not approved. In the case of the latter, an error message is provided
    * to indicate why the request for that data item was not approved.
    * 
    * In the event that any of the data requests is not approved, the system
    * will respond with a HTTP status code of 207. A 400 HTTP status code 
    * is returned for requests that are malformed or generally invalid.
    * A 200 HTTP status code indicates a <code>success</code> response.
    * 
    * @param {Array} duaRequest The data items that require approval for use
    * @param {string} duaRequest.purposeId The purpose ID representing the privacy
    * purpose configured on Verify.
    * @param {string} duaRequest.accessTypeId The access type ID representing the 
    * available access types on Verify. This must be one of the access types
    * selected for the purpose.
    * @param {string} duaRequest.attributeId The attribute ID on Verify. This must be
    * configured as one of the attributes for the purpose. This may be optional if
    * no attributes are configured for the purpose.
    * @param {string} duaRequest.attributeValue The attribute value for the attribute.
    * This is typically used when the user has more than one value for the attribute.
    * This is optional.
    * 
    * @return {Promise<Object>} The HTTP response body for a
    * 200 or 207 HTTP status code.
    * @throws {Error} An error response is received.
    */
    async requestApproval(auth, duaRequest) {
        const methodName = `${DPCM.name}:requestApproval(auth, duaRequest)`
        const service = new DPCMService(auth, this._config.tenantUrl, this._context)
        try {
            const assessment = await service.requestApproval(duaRequest);
            console.log(`[${methodName}]`, 'assessment:',
                assessment);

            return { status: 'done', response: assessment };
        } catch (error) {
            console.log(`[${methodName}]`, 'error:', error);
            const jsonResp = { status: 'deny' };
            if (error.response.data) {
                jsonResp.detail = error.response.data;
            }
            return jsonResp;
        }
    }

    /**
    * Get consent metadata that can be used to build the consent page presented
    * to the data subject/user.
    *
    * This includes exhaustive information of the purposes, attributes and access
    * types and any other pertinent information needed to present a complete
    * consent page. Details such as current consents are also listed here and 
    * may be compared with the current version of the purpose to determine if the
    * consent may perhaps be for an older purpose.
    * 
    * A 400 HTTP status code is returned for requests that are malformed or generally 
    * invalid. A 200 HTTP status code indicates a <code>success</code> response.
    * 
    * @param {Array} purposes The purposes for which the consent page is being built
    * @param {string} purposes.purposeId The purpose ID representing the privacy
    * purpose configured on Verify.
    * 
    * @return {Promise<Object>} The HTTP response body for a
    * 200 HTTP status code.
    * @throws {Error} An error response is received.
    */
    async getConsentMetadata(auth, purposes) {
        const methodName = `${DPCM.name}:getConsentMetadata(auth, purposes)`
        const service = new DPCMService(auth, this._config.tenantUrl, this._context)
        try {
            const metadata = await service.getConsentMetadata(purposes);
            console.log(`[${methodName}]`, 'metadata:',
                metadata);

            return { status: 'done', response: metadata };
        } catch (error) {
            console.log(`[${methodName}]`, 'error:', error);
            const jsonResp = { status: 'deny' };
            if (error.response.data) {
                jsonResp.detail = error.response.data;
            }
            return jsonResp;
        }
    }

    async getUserConsents(auth) {
        const methodName = `${DPCM.name}:getUserConsents(auth)`
        const service = new DPCMService(auth, this._config.tenantUrl, this._context)
        try {
            const consents = await service.getUserConsents();
            console.log(`[${methodName}]`, 'consents:',
                consents);

            return { status: 'done', response: consents };
        } catch (error) {
            console.log(`[${methodName}]`, 'error:', error);
            const jsonResp = { status: 'deny' };
            if (error.response.data) {
                jsonResp.detail = error.response.data;
            }
            return jsonResp;
        }
    }
}

module.exports = DPCM;