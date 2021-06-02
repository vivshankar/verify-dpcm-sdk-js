/**
 * The assessment decision object for a specific request item
 * @typedef {Object} AssessmentDecision
 * @property {boolean} approved Indicates if the request has been approved
 * @property {VerifyError} reason If "approved" is false, the details of the denial
 */

/**
 * The assessment object for a specific request item
 * @typedef {Object} Assessment
 * @property {string} purposeId The purpose or EULA ID representing the privacy
 * purpose or EULA configured on Verify.
 * @property {string} accessTypeId The access type ID representing the 
 * available access types on Verify. This is one of the access types configured
 * for the purpose and optionally the attribute.
 * @property {string} attributeId The attribute ID on Verify. This is one of the 
 * attributes for the purpose.
 * @property {AssessmentDecision} result The result object that contains the decision.
 */

/**
 * The assessment response object
 * @typedef {Object} WrappedAssessment
 * @property {string} status The overall assessment status is computed based on the contents
 * of the assessment.
 * <br><code>approved</code> - all items are approved
 * <br><code>consent</code> - some or all items require consent
 * <br><code>denied</code> - approval is denied for all items
 * <br><code>error</code> - invalid request or system error
 * @property {Assessment} assessment The assessment details
 * @property {VerifyError} detail The error details if the status is "error"
 */

/**
 * The consent metadata record
 * @typedef {Object} Consent
 * @property {string} purposeId The purpose or EULA ID representing the privacy
 * purpose or EULA configured on Verify.
 * @property {string} accessTypeId The access type ID representing the 
 * available access types on Verify. This is one of the access types configured
 * for the purpose and optionally the attribute.
 * @property {string} attributeId The attribute ID on Verify. This is one of the 
 * attributes for the purpose.
 * @property {string} attributeValue The attribute value for the attribute.
 * This is typically used when the user has more than one value for the attribute
 * and is consenting to a specific value.
 * @property {number} startTime The time since Epoch that indicates when the consent
 * becomes active.
 * @property {number} endTime The time since Epoch that indicates when the consent
 * elapses.
 * @property {boolean} isGlobal Indicates if the consent applies to all applications
 * @property {number} status This is the status of the consent and can be one of -
 * <br><code>1</code> - Active
 * <br><code>2</code> - Expired
 * <br><code>3</code> - Inactive
 * <br><code>8</code> - New consent required
 * @property {number} state This is the consent type provided by the user and can be one of -
 * <br><code>1</code> - Allow: Usual consent that is not governed by any regulation
 * <br><code>2</code> - Deny: Usual consent that is not governed by any regulation
 * <br><code>3</code> - Opt in: Consent type required based on the assessment
 * <br><code>4</code> - Opt out: Consent type required based on the assessment
 * <br><code>5</code> - Transparent: No explicit user consent
 * @property {string} geoIP This is the IP address where the user consents
 * @property {Array} customAttributes This is a list of optional attributes. Object type
 * within the array is <code>{ "key": "somekey", "value": "somevalue" }</code> 
 */

/**
 * The consent metadata record
 * @typedef {Object} MetadataRecord
 * @property {string} purposeId The purpose or EULA ID representing the privacy
 * purpose or EULA configured on Verify.
 * @property {string} purposeName The purpose or EULA name
 * @property {string} accessTypeId The access type ID representing the 
 * available access types on Verify. This is one of the access types configured
 * for the purpose and optionally the attribute.
 * @property {string} accessType The access type name
 * @property {string} attributeId The attribute ID on Verify. This is one of the 
 * attributes for the purpose.
 * @property {string} attributeName The attribute name
 * @property {number} defaultConsentDuration The default duration configured for the
 * user consent. This applies if no explicit start and end time is provided.
 * @property {boolean} assentUIDefault Indicates if the consent prompt should 
 * default the selection to "accepted"
 * @property {string} status The current status of consent. This can be one of -
 * <br><code>NONE</code> - No consent
 * <br><code>ACTIVE</code> - An active consent record exists. However, the consent may
 * not translate to "yes".
 * <br><code>EXPIRED</code> - A user consent record exists but it is no longer valid. This
 * may be due to a new privacy rule or a change in configuration or the consent has lapsed.
 * @property {Consent} consent The user consent record that may or may not be active.
 */

/**
 * The consent metadata object that contains records based on the request
 * @typedef {Object} Metadata
 * @property {Array.<MetadataRecord>} eula The metadata records related
 * to the EULA category
 * @property {Array.<MetadataRecord>} default The metadata records related
 * to the default purpose-aware attribute category
 */

/**
 * The consent metadata response object
 * @typedef {Object} WrappedMetadata
 * @property {string} status The overall metadata status is computed based on whether
 * the data was received or not.
 * <br><code>done</code> - the metadata is retrieved
 * <br><code>error</code> - invalid request or system error
 * @property {Metadata} metadata The metadata for rendering a consent page
 * @property {VerifyError} detail The error details if the status is "error"
 */

/**
 * The response object for <code>getUserConsents</code>
 * @typedef {Object} WrappedGetUserConsents
 * @property {string} status The overall status is computed based on whether
 * the data was received or not.
 * <br><code>done</code> - the consents are retrieved
 * <br><code>error</code> - invalid request or system error
 * @property {Consent[]} consents The list of consents
 * @property {VerifyError} detail The error details if the status is "error"
 */