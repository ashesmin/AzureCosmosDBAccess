// store our master key for documentdb
var mastKey = postman.getEnvironmentVariable("CosmosDBMasterKey");
console.log("mastKey = " + mastKey);

// store our date as RFC1123 format for the request
var today = new Date();
var UTCstring = today.toUTCString();
postman.setEnvironmentVariable("RFC1123time", UTCstring);

// Grab the request url
var url = request.url.trim(); 
console.log("request url = " + url);

// strip the url of the hostname up and leading slash
var strippedurl = url.replace(new RegExp('^https?://[^/]+/'),'/');
console.log ("stripped Url = " + strippedurl);

// push the parts down into an array so we can determine if the call is on a specific item
// or if it is on a resource (odd would mean a resource, even would mean an item)
var strippedparts = strippedurl.split("/");
var truestrippedcount = (strippedparts.length - 1);
console.log(truestrippedcount);

// define resourceId/Type now so we can assign based on the amount of levels
var resourceId = "";
var resType = "";

// its odd (resource request)
if (truestrippedcount % 2)
{
    console.log("odd");
    // assign resource type to the last part we found.
    resType = strippedparts[truestrippedcount];
    console.log(resType);
    
    if (truestrippedcount > 1)
    {
        // now pull out the resource id by searching for the last slash and substringing to it.
        var lastPart = strippedurl.lastIndexOf("/");
        resourceId = strippedurl.substring(1,lastPart);
        console.log(resourceId);
    }
}
else // its even (item request on resource)
{
    console.log("even");
    // assign resource type to the part before the last we found (last is resource id)
    resType = strippedparts[truestrippedcount - 1];
    console.log("resType");
    // finally remove the leading slash which we used to find the resource if it was
    // only one level deep.
    strippedurl = strippedurl.substring(1);
    console.log("strippedurl");
    // assign our resourceId
    resourceId = strippedurl;
    console.log("resourceId");
}

// assign our verb
var verb = request.method.toLowerCase();

// assign our RFC 1123 date
var date = UTCstring.toLowerCase();

// parse our master key out as base64 encoding
var key = CryptoJS.enc.Base64.parse(mastKey);
console.log("key = " + key);

// build up the request text for the signature so can sign it along with the key
var text = (verb || "").toLowerCase() + "\n" + 
               (resType || "").toLowerCase() + "\n" + 
               (resourceId || "") + "\n" + 
               (date || "").toLowerCase() + "\n" + 
               "" + "\n";
console.log("text = " + text);

// create the signature from build up request text
var signature = CryptoJS.HmacSHA256(text, key);
console.log("sig = " + signature);

// back to base 64 bits
var base64Bits = CryptoJS.enc.Base64.stringify(signature);
console.log("base64bits = " + base64Bits);

// format our authentication token and URI encode it.
var MasterToken = "master";
var TokenVersion = "1.0";
auth = encodeURIComponent("type=" + MasterToken + "&ver=" + TokenVersion + "&sig=" + base64Bits);
console.log("auth = " + auth);

// set our auth token enviornmental variable.
postman.setEnvironmentVariable("authToken", auth);