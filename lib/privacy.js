const ConfigurationError = require('./errors/configurationError')
const DPCMService = require('./services/dpcm/dpcmService')
const StringUtils = require('./utils/stringUtils')
const debug = require('debug')('verify:privacy')

/**
 * Privacy module is the main module in the Privacy SDK
 * @module Privacy
 */

/**
 * Class representing the Privacy SDK for IBM Security Verify. Used to 
 * perform privacy assessment for attributes being requested and metadata required to build consent
 * experiences.
 * 
 * @author Vivek Shankar
 */
class Privacy {

    /**
     * Create a new {@link Privacy} object.
     * 
     * @param {Object} config Global configuration for the SDK
     * @param {string} config.tenantUrl The Verify tenant hostname, including the protocol.
     * @param {Object} auth Auth object contains property values to authorize requests to Verify
     * @param {string} auth.accessToken The OAuth 2.0 token used to authorize requests. If the access token
     * is generated using a privileged API client (as opposed to one generated on a user authentication flow),
     * the <code>context.subjectId</code> is required.
     * @param {Object} context Context object contains Privacy SDK specific context
     * @param {string} context.subjectId The user/subject identifier that may be a
     * Verify user identifier.
     * @param {boolean} context.isExternalSubject Indicates if the subject is known
     * to Verify.
     * @param {string} context.ipAddress The IP address of the user agent. If this
     * library is used in a backend system, this IP should be obtained from the 
     * request headers that contain the actual user agent IP address.
     * 
     * @example
     * const Privacy = require('verify-dpcm-sdk-js');
     * const client = new Privacy({
     *   "tenantUrl": "https://abc.verify.ibm.com"
     * }, {
     *   "accessToken": "lasfjsdlfjsldjfglsdjfglsjl"
     * }, {
     *   "ipAddress": "1.2.3.4"
     * });
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
     * Evaluate the attributes requested for approval.
     *
     * Request the consent management system to approve the use of attributes
     * for the specified purpose, access type and an optional value. If the 
     * access type is not specified, it is set to a system default.
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
     * @return {Promise<WrappedAssessment>} The status of the assessment
     * and additional details
     * 
     * @example
     * let result = client.assess([
     *   {
     *     // allow mobile number for marketing
     *     "purposeId": "marketing",
     *     "attributeId": "11", // mobile_number
     *     "accessTypeId": "default"
     *   },
     *   {
     *     // default end user license agreement
     *     "purposeId": "defaultEULA",
     *   }
     * ])
     * 
     * if (result.status == "consent") {
     *   // redirect for consent or build the page here
     *   // and render. consider filtering out items
     *   // in the assessment that are not approved because
     *   // of a rule violation
     * } else if (result.status == "approved") {
     *   // the world is your oyster. go forth and conquer
     * } else {
     *   // examine the assessment and show an appropriate error
     * }
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

            return { status: status, assessment };
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

    /**
     * Get consent metadata that can be used to build the consent page presented
     * to the data subject/user, including the current state of consent.
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
     * @return {Promise<WrappedMetadata>} The status of the request
     * and any consent metadata
     * 
     * @example
     * let result = client.getConsentMetadata([
     *   {
     *     // allow mobile number for marketing
     *     "purposeId": "marketing",
     *     "attributeId": "11", // mobile_number
     *     "accessTypeId": "default"
     *   },
     *   {
     *     // default end user license agreement
     *     "purposeId": "defaultEULA",
     *   }
     * ])
     * 
     * if (result.status == "done") {
     *   // render the page based on the result.metadata
     * }
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

            return { status: 'done', metadata };
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

    /**
    * Fetches user consents.
    * 
    * @return {Promise<WrappedGetUserConsents>}
    * 
    * @example
     * let result = client.getUserConsents()
     * if (result.status == "done") {
     *   // render the page based on the result.consents
     * }
    */
    async getUserConsents() {
        const methodName = `${Privacy.name}:getUserConsents()`
        const service = new DPCMService(this._auth, this._config.tenantUrl, this._context)
        try {
            const resp = await service.getUserConsents();
            debug(`[${methodName}]`, 'response:',
                resp);

            return { status: 'done', consents: resp.consents };
        } catch (error) {
            const jsonResp = { status: 'error' };
            if (error.response && error.response.data) {
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