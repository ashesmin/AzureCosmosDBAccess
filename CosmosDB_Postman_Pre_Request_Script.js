/**
 * This POSTMAN pre-request script help to create necessary values
 * to make a call to Cosmos DB REST API with Authorization request headers
 * and set those headers to each request.
 * See REST API into in: https://docs.microsoft.com/en-us/rest/api/cosmos-db/
 * See access control reference on:
 * https://docs.microsoft.com/en-us/rest/api/cosmos-db/access-control-on-cosmosdb-resources
 * Josué Martínez Buenrrostro @josuemb on twitter
 */

// Checking for mandatory collection variables need to be present in any call, those are:
// Authorization, x-ms-version, Authorization and x-ms-date.
// When Authorization and x-ms-date values are going to be filled in this script.
// See reference on: https://docs.microsoft.com/en-us/rest/api/cosmos-db/common-cosmosdb-rest-request-headers
pm.test("Check for collectionVariables", function () {
  let vars = [
    "authorization_type",
    "authorization_version",
    "authorization_signature",
    "x-ms-version",
  ];
  vars.forEach(function (item, index, array) {
    pm.expect(
      pm.collectionVariables.get(item),
      item + " variable not set"
    ).to.not.be.undefined;
    pm.expect(
      pm.collectionVariables.get(item),
      item + " variable not set"
    ).to.not.be.empty;
  });
});

// Get URL value from request.
let url = pm.request.url.toString();
//Regular expression to separate parameters in pair with resource name and resource id when resource id is optional.
let urlRegExp =
  /^https?:\/\/.*\.documents\.azure\.com(?::\d+)?(?:\/([^\/]+)(?:\/([^\/]+)?)?)+$/i;

// Checking for valid URL syntax.
// See: https://docs.microsoft.com/en-us/rest/api/cosmos-db/cosmosdb-resource-uri-syntax-for-rest
pm.test("Check for URL valid format", function () {
  pm.expect(url, "URL not set").to.not.be.undefined;
  pm.expect(url, "URL not set").to.not.be.empty;
  pm.expect(
    urlRegExp.test(url),
    "URL does not have a valid format. See: https://docs.microsoft.com/en-us/rest/api/cosmos-db/cosmosdb-resource-uri-syntax-for-rest"
  ).to.be.true;
});

// Getting necessary values from collection variables.
// See: https://learning.postman.com/docs/sending-requests/variables/
let autorizationType = pm.collectionVariables.get("authorization_type");
let autorizationVersion = pm.collectionVariables.get("authorization_version");
let authorizationSignature = pm.collectionVariables.get(
  "authorization_signature"
);
let cosmosDBApiVersion = pm.collectionVariables.get("x-ms-version");

// Decode authorization signature (it is originally base64 coded)
let key = CryptoJS.enc.Base64.parse(authorizationSignature);
// Set request date formatting as UTC
let dateUtc = new Date().toUTCString();
// Get request method (a.k.a. verb) to build text for authorization token
let verb = pm.request.method;

// Execute regular expression to extract some parts from URL.
let parsedUrl = urlRegExp.exec(url);
// Get resource type from URL
let resourceType = parsedUrl[1];
// Get resource ID from URL, if it is not present, we are getting undefined.
let resourceId = parsedUrl[2];
// Build regular expression to get all parameters from URL to build ResourceLink part.
// See "Example Encoding" in: https://docs.microsoft.com/en-us/rest/api/cosmos-db/access-control-on-cosmosdb-resources
let resourceLinkPattern =
  /^https?:\/\/.*\.documents\.azure\.com(?::\d+)?\/(.*)$/i;
let parsedResourceLink = resourceLinkPattern.exec(url);
// Get resource LInke from expression and in case last character is / we just drop it out.
let resourceLink =
  parsedResourceLink[1].charAt(parsedResourceLink[1].length - 1) === "/"
    ? parsedResourceLink[1].substring(
        parsedResourceLink[1],
        parsedResourceLink[1].length - 1
      )
    : parsedResourceLink[1];
// When Resource Id is present in parameters, then Resource Link is whole parameters part,
// elsewhere, then we need to drop last /resource type to
// build Resource Link.
// Example:
// for URL: https://myaccount.documents.azure.com/dbs/MyCollection/colls/
// Resource Link will be just: dbs/MyCollection
if (resourceId === undefined) {
  // Resource Id not provided
  // We need to cut last part to left just Resource Id
  resourceLink = resourceLink.substring(0, resourceLink.lastIndexOf("/"));
}

// Build string to be encrypted and used as signature.
// See: https://docs.microsoft.com/en-us/rest/api/cosmos-db/access-control-on-cosmosdb-resources
var text =
  (verb || "").toLowerCase() +
  "\n" +
  (resourceType || "").toLowerCase() +
  "\n" +
  (resourceLink || "") +
  "\n" +
  dateUtc.toLowerCase() +
  "\n\n";
// Build key to authorize request.
let signature = CryptoJS.HmacSHA256(text, key);
// Code key as base64 to be sent.
let signature_base64 = CryptoJS.enc.Base64.stringify(signature);
// Build autorization token and encode it as URI to be sent.
var authorizationToken = encodeURIComponent(
  "type=" +
    autorizationType +
    "&ver=" +
    autorizationVersion +
    "&sig=" +
    signature_base64
);

// Set request headers
pm.request.headers.upsert({ key: "Accept", value: "application/json" });
pm.request.headers.upsert({ key: "x-ms-version", value: cosmosDBApiVersion });
pm.request.headers.upsert({ key: "x-ms-date", value: dateUtc });
pm.request.headers.upsert({ key: "Authorization", value: authorizationToken });
