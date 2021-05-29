const ConfigurationError = require('./errors/configurationError')
const DPCMService = require('./services/dpcm/dpcmService')
const StringUtils = require('./utils/stringUtils')
const debug = require('debug')('verify:privacy')

class Privacy {

    /**
    * Create a new {@link Privacy} object.
    * @param {Object} config The configuration of the system.
    * @param {string} config.tenantUrl The Verify tenant hostname, including the protocol.
    * @param {Object} auth The object that encapsulates auth tokens
    * @param {string} auth.accessToken The OAuth 2.0 token used to authorize requests
    * @param {Object} context The context to include in the request.
    * @param {string} context.subjectId The user/subject identifier that may be a
    * Verify user identifier.
    * @param {boolean} context.isExternalSubject Indicates if the subject is known
    * to Verify.
    * @param {string} context.ipAddress The IP address of the user agent. If this
    * library is used in a backend system, this IP should be obtained from the 
    * request headers that contain the actual user agent IP address.
    */
    constructor(config, auth, context = {}) {
        if (!StringUtils.has(config, 'tenantUrl')) {
            throw new ConfigurationError(
                `Cannot find property 'tenantUrl' in configuration settings.`);
        }

        if (!StringUtils.has(auth, 'accessToken')) {
            throw new ConfigurationError(
                `Cannot find property 'accessToken' in auth`);
        }

        this._config = config;
        this._auth = auth;
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
    * If all items are approved, the response status is <code>approved</code>.
    * If the request is partially approved and some items require consent, the
    * response status is <code>consent</code>. If none of the items are approved
    * and, per, say, a Geo-locked policy, there is no value on requesting for consent, 
    * the response status is <code>denied</code>. If the request is invalid or 
    * results in an overall failure, the response status is <code>error</code>.
    * 
    * @param {Array} items The data items that require approval for use
    * @param {string} items.purposeId The purpose ID representing the privacy
    * purpose configured on Verify. If you are checking for the consent status
    * of EULA, use the EULA identifier here.
    * @param {string} items.accessTypeId The access type ID representing the 
    * available access types on Verify. This must be one of the access types
    * selected for the purpose.
    * @param {string} items.attributeId The attribute ID on Verify. This must be
    * configured as one of the attributes for the purpose. This may be optional if
    * no attributes are configured for the purpose.
    * @param {string} items.attributeValue The attribute value for the attribute.
    * This is typically used when the user has more than one value for the attribute.
    * This is optional.
    * 
    * @return {Promise<Object>} The HTTP response body for a
    * 200 or 207 HTTP status code.
    */
    async assess(items) {
        
        const methodName = `${Privacy.name}:assess(items)`
        const service = new DPCMService(this._auth, this._config.tenantUrl, this._context)
        try {
            const assessment = await service.requestApproval(items);
            debug(`[${methodName}]`, 'assessment:',
                JSON.stringify(assessment));

            // process the response
            if (!Array.isArray(assessment)) {
                return { 
                    status: "error", 
                    data: {  
                        "messageId": "INVALID_DATATYPE",
                        "messageDescription": `'assessment' is expected to be an array. Received ${typeof assessment}`
                    }
                };
            }

            let status = null;
            for (const ia of assessment) {
                
                if (ia.result && ia.result[0].approved) {
                    if (status == null) {
                        status = "approved";
                    }

                    continue;
                }

                if (ia.result && ia.result[0].reason.messageId === "CSIBT0033I") {
                    // at least one item requires consent
                    status = "consent";
                    continue;
                }
            }

            if (status == null) {
                status = "denied";
            }

            return { status: status, response: assessment };
        } catch (error) {
            debug(`[${methodName}]`, 'error:', error);
            const jsonResp = { status: 'error' };
            if (error.response.data) {
                jsonResp.data = error.response.data;
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
    * consent page. Details such as current consents are also listed along with 
    * the current status of the consent.
    * 
    * If the metadata is retrieved successfully, the response status is 
    * <code>approved</code>. If the request is invalid or results in an 
    * overall failure, the response status is <code>error</code>.
    * 
    * @param {Array} items The data items that require approval for use
    * @param {string} items.purposeId The purpose ID representing the privacy
    * purpose configured on Verify. If you are checking for the consent status
    * of EULA, use the EULA identifier here.
    * @param {string} items.accessTypeId The access type ID representing the 
    * available access types on Verify. This must be one of the access types
    * selected for the purpose. If this is not provided in the input, it is 
    * defaulted to 'default'. Wildcards are not allowed.
    * @param {string} items.attributeId The attribute ID on Verify. This must be
    * configured as one of the attributes for the purpose. This may be optional if
    * no attributes are configured for the purpose. Wildcards are not allowed.
    * 
    * @return {Promise<Object>} The HTTP response body for a
    * 200 HTTP status code.
    * @throws {Error} An error response is received.
    */
    async getConsentMetadata(items) {
        const methodName = `${Privacy.name}:getConsentMetadata(items)`
        const service = new DPCMService(this._auth, this._config.tenantUrl, this._context)
        try {

            // retrieve the list of purposes
            let purposes = new Set();
            let itemNameSet = new Set();
            for (const item of items) {
                purposes.add(item.purposeId);

                if (!item['accessTypeId'] || item['accessTypeId'] == null) {
                    item.accessTypeId = "default";
                }

                itemNameSet.add(`${item.purposeId}/${StringUtils.getOrDefault(item.attributeId, "")}.${StringUtils.getOrDefault(item.accessTypeId, "")}`);
            }

            // get metadata
            const response = await service.getConsentMetadata(Array.from(purposes));
            debug(`[${methodName}]`, 'response:', response);

            // filter and normalize
            let metadata = await service.processConsentMetadata(itemNameSet, response);
            debug(`[${methodName}]`, 'metadata:', metadata);

            return { status: 'done', response: metadata };
        } catch (error) {
            const jsonResp = { status: 'error' };
            if (error.response.data) {
                jsonResp.detail = error.response.data;
                debug(`[${methodName}]`, 'error data:', error.response.data);
            } else {
                debug(`[${methodName}]`, 'error:', error);
            }
            return jsonResp;
        }
    }
}

module.exports = Privacy;