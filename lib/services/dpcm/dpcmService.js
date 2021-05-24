const Service = require('../service');

const ConsentType = {
    ALLOW: 1,
    DENY: 2,
    OPT_IN: 3,
    OPT_OUT: 4,
    TRANSPARENCY: 5
};

/**
 * A class for making data privacy & consent requests to Verify using
 * an authorization token. These include data usage approval requests,
 * getting data subject presentation metadata for a consent page
 * and consent management requests
 * @extends Service
 * @author Vivek Shankar
 */
class DPCMService extends Service {

    /**
    * Create a new {@link DPCMService} object.
    * @param {Object} auth The credentials to authenticate to OIDC.
    * @param {string} baseURL The base URL for the OIDC API.
    * @param {Object} context The context to include in the request.
    * @param {string} context.subjectId The user/subject identifier that may be a
    * Verify user identifier.
    * @param {boolean} context.isExternalSubject Indicates if the subject is known
    * to Verify.
    * @param {string} context.ipAddress The IP address of the user agent. If this
    * library is used in a backend system, this IP should be obtained from the 
    * request headers that contain the actual user agent IP address.
    */
    constructor(auth, baseURL, context) {
        super(auth, baseURL, context);
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
    async requestApproval(duaRequest) {
        let req = {
            items: duaRequest,
        }

        if (this._context.subjectId && this._context.subjectId != null) {
            req.subjectId = this._context.subjectId
        }

        if (this._context.isExternalSubject && this._context.isExternalSubject != null) {
            req.isExternalSubject = this._context.isExternalSubject
        }

        if (this._context.ipAddress && this._context.ipAddress != null) {
            req.geoIP = this._context.ipAddress
        }

        const response = await this.post('/v1.0/privacy/data-usage-approval', req);
        return response.data;
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
    async getConsentMetadata(purposes) {
        let req = {
            purposeId: purposes,
        }

        if (this._context.subjectId && this._context.subjectId != null) {
            req.subjectId = this._context.subjectId
        }

        if (this._context.isExternalSubject && this._context.isExternalSubject != null) {
            req.isExternalSubject = this._context.isExternalSubject
        }

        if (this._context.ipAddress && this._context.ipAddress != null) {
            req.geoIP = this._context.ipAddress
        }

        const response = await this.post('/v1.0/privacy/data-subject-presentation', req);
        return response.data;
    }

    /**
    * Store consents for the user.
    *
    * Consents may only be created typically, except if the consent end time needs to
    * be updated.
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
    async storeConsents(consents) {
        consents.forEach((consent, index) => {
            if (this._context.subjectId && this._context.subjectId != null) {
                consent.subjectId = this._context.subjectId
            }
    
            if (this._context.isExternalSubject && this._context.isExternalSubject != null) {
                consent.isExternalSubject = this._context.isExternalSubject
            }
    
            if (this._context.ipAddress && this._context.ipAddress != null) {
                consent.geoIP = this._context.ipAddress
            }
        })

        const response = await this.patch('/v1.0/privacy/consents', consents);
        return response.data;
    }

    async getUserConsents() {

        // TODO: Introspect the token to get the application ID if available to filter by application
        
        let url = '/config/v1.0/privacy/consents';
        if (this._context.subjectId && this._context.subjectId != '') {
            url += '?search=' + encodeURIComponent('subjectId="' + this._context.subjectId + '"');
        }
        
        const response = await this.get(url);
        return response.data;
    }
}

module.exports = DPCMService;