const ConfigurationError = require('./lib/errors/configurationError')
const DPCMService = require('./lib/services/dpcm/dpcmService')

class DPCM {
    /**
    * Create a new {@link DPCM} object.
    * @param {Object} config The configuration of the system.
    * @param {string} tenantUrl The Verify tenant hostname, including the protocol.
    * @param {Object} context The context to include in the request.
    * @param {string} context.subjectId The user/subject identifier that may be a
    * Verify user identifier.
    * @param {boolean} context.isExternalSubject Indicates if the subject is known
    * to Verify.
    * @param {string} context.ipAddress The IP address of the user agent. If this
    * library is used in a backend system, this IP should be obtained from the 
    * request headers that contain the actual user agent IP address.
    */
    constructor(config, context = {}) {
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

    /**
    * Store consents for the user.
    *
    * Consents may only be created typically, except if the consent end time needs to
    * be updated. Only 10 consent operations are allowed at a time.
    * 
    * A 400 HTTP status code is returned for requests that are malformed or generally 
    * invalid. A 200 HTTP status code indicates a <code>success</code> response. A
    * 207 HTTP status code indicates a <code>partial failure</code> response and requires
    * the client to process the response.
    * 
    * @param {Array} consents The consent records being added or updated
    * @param {string} consents.path The path of the consent resource. This is either
    * null, when a consent is being added, or <code>/{consentId}/endTime</code>, when
    * the end time of a consent is being updated.
    * @param {string} consents.op The operation can be 'add' or 'replace'. 'replace' only
    * applies to updating the end time of an existing consent record.
    * @param {Object} consents.value If the operation is 'replace', this is the epoch time
    * representing the end time, i.e. a long value. If the operation is 'add', this is an object.
    * @param {string} consents.value.purposeId The purpose associated with the consent.
    * @param {string} consents.value.attributeId The attribute associated with the consent.
    * @param {string} consents.value.attributeValue The attribute value associated with the consent.
    * @param {string} consents.value.accessTypeId The access type associated with the consent.
    * @param {long} consents.value.startTime The start time for the consent. Defaults to current time.
    * @param {long} consents.value.endTime The end time for the consent. Defaults to null.
    * @param {ConsentType} consents.value.state The type of consent.
    * @param {boolean} consents.value.isGlobal Indicates that the consent recorded is global for all 
    * applications.
    * 
    * @return {Promise<Object>} The HTTP response body for a
    * 200 or 207 HTTP status code.
    * @throws {Error} An error response is received.
    */
     async storeConsents(auth, consents) {
        const methodName = `${DPCM.name}:storeConsents(auth, consents)`
        const service = new DPCMService(auth, this._config.tenantUrl, this._context)
        try {
            const r = await service.storeConsents(consents);
            console.log(`[${methodName}]`, 'response:',
                r);

            return { status: 'done', response: r };
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
    * Fetches user consents.
    *
    * If the access token used is not a user token, the <code>context.subjectId</code>
    * must be provided.
    * 
    * A 400 HTTP status code is returned for requests that are malformed or generally 
    * invalid. A 200 HTTP status code indicates a <code>success</code> response.
    * 
    * @return {Promise<Object>} The HTTP response body for a
    * 200 HTTP status code.
    */
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