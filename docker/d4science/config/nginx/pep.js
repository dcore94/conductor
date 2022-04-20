export default { enforce };

import defaultExport from './config.js';

function log(c, s){
  c.request.error(s)
}

var _debug = true
function debug(c, s){
  if(_debug === true){
    log(c, s)
  }
}

function enforce(r) {
      
  var context = { 
    request: r ,
    config : defaultExport["config"],
    backend : (defaultExport.backend ? defaultExport.backend : "@backend")
  }
 
  log(context, "Inside NJS enforce for " + r.method + " @ " + r.headersIn.host + "/" + r.uri)
  
  context = computeProtection(context)
  
  wkf.run(wkf.build(context), context)
}

// ######## WORKFLOW FUNCTIONS ###############
var wkf = {
  
  build : (context)=>{
    var actions = [
      "export_pep_credentials",
      "parse_authentication",
      "check_authentication",
      "export_authn_token",
      "pip",
      "pdp",
      "export_backend_headers",
      "pass"
    ]
    return actions
  },

  run : (actions, context) => {
    context.request.error("Starting workflow with " + njs.dump(actions))
    var w = actions.reduce(
      (acc, f) => { return acc.then(typeof(f) === "function" ? f : wkf[f]) }, 
      Promise.resolve().then(()=>context)
    )
    w.catch(e => { context.request.error(njs.dump(e)); context.request.return(401)} )
  },
  
  export_pep_credentials : exportPepCredentials,
  export_authn_token : exportAuthToken,
  export_backend_headers : exportBackendHeaders,
  parse_authentication : parseAuthentication,
  check_authentication : checkAuthentication,
  verify_token : verifyToken,
  request_token : requestToken,
  pip : pipExecutor,
  pdp : pdpExecutor,
  pass : pass,

  //PIP utilities
  "get-path-component" : (c, i) => c.request.uri.split("/")[i],
  "get-token-field" : getTokenField,
  "get-contexts" : (c) => {
    var ra = c.authn.verified_token["resource_access"]
    if(ra){
      var out = [];
      for(var k in ra){
        if(ra[k].roles && ra[k].roles.length !== 0) out.push(k) 
      }
    }
    return out;
  }
}

function getTokenField(context, f){
  return context.authn.verified_token[f]
}

function exportVariable(context, name, value){
  context.request.variables[name] = value
  return context
}

function exportBackendHeaders(context){
  return context
}

function exportPepCredentials(context){
  if(!context.config["pep-credentials"]){
    throw new Error("Need PEP credentials")
  }
  return exportVariable(context, "pep_credentials", "Basic " + context.config["pep-credentials"])
}

function exportAuthToken(context){
  return exportVariable(context, "auth_token", context.authn.token)
}

function checkAuthentication(context){
  return context.authn.type === "bearer" ? wkf.verify_token(context) : wkf.request_token(context)
}

function parseAuthentication(context){
  context.request.log("Inside parseAuthentication")
  var incomingauth = context.request.headersIn["Authorization"]
  
  if(!incomingauth) throw new Error("Authentication required");
  
  var arr = incomingauth.trim().replace(/\s\s+/g, " ").split(" ")
  if(arr.length != 2) throw new Error("Unknown authentication scheme");
  
  var type = arr[0].toLowerCase()
  if(type === "basic" && context.authz.host && context.authz.host["allow-basic-auth"]){
    var unamepass = Buffer.from(arr[1], 'base64').toString().split(":")
    if(unamepass.length != 2) return null;
    context.authn = { type : type, raw : arr[1], user : unamepass[0], password : unamepass[1]}
    return context
  }else if(type === "bearer"){
    context.authn = { type : type, raw : arr[1], token : arr[1]}
    return context
  }
  throw new Error("Unknown authentication scheme");
}

function verifyToken(context){
  log(context, "Inside verifyToken")
  debug(context, "Token is " + context.authn.token)
  var options = {
    "body" : "token=" + context.authn.token + "&token_type_hint=access_token"
  }
  return context.request.subrequest("/jwt_verify_request", options)
    .then(reply=>{
      if (reply.status === 200) {
        var response = JSON.parse(reply.responseBody);
        if (response.active === true) {
          return response
        } else {
          throw new Error("Unauthorized: " + reply.responseBody)
        }
      } else {
        throw new Error("Unauthorized: " + reply.responseBody)
      }
    }).then(verified_token => {
      context.authn.verified_token = 
        JSON.parse(Buffer.from(context.authn.token.split('.')[1], 'base64url').toString())
      return context
    })
}

function requestToken(context){
  log(context, "Inside requestToken")
  var options = {
    "body" : "grant_type=client_credentials&client_id="+context.authn.user+"&client_secret="+context.authn.password
  }
  return context.request.subrequest("/jwt_request", options)
    .then(reply=>{
      if (reply.status === 200) {
        var response = JSON.parse(reply.responseBody);
        context.authn.token = response.access_token
        context.authn.verified_token =
          JSON.parse(Buffer.from(context.authn.token.split('.')[1], 'base64url').toString())
        return context
      } else if (reply.status === 400 || reply.status === 401){
        var options = {
          "body" : "grant_type=password&username="+context.authn.user+"&password="+context.authn.password
        }
        return context.request.subrequest("/jwt_request", options)
          .then( reply=>{
            if (reply.status === 200) {
                var response = JSON.parse(reply.responseBody);
                context.authn.token = response.access_token
                context.authn.verified_token =
                        JSON.parse(Buffer.from(context.authn.token.split('.')[1], 'base64url').toString())
                return context
            } else{
               throw new Error("Unauthorized " + reply.status)
            }
          })
      } else {
        throw new Error("Unauthorized " + reply.status)
      }
    })
}

function pipExecutor(context){ 
  log(context, "Inside extra claims PIP")
  context.authz.pip.forEach(extra =>{
    //call extra claim pip function
    try{
      var operator = extra.operator
      var result = wkf[operator](context, extra.args)
      //ensure array and add to extra_claims
      if(!(result instanceof Array)) result = [result]
      if(!context.extra_claims) context.extra_claims = {};
      context.extra_claims[extra.claim] = result
    } catch (error){
      log(context, "Skipping invalid extra claim " + njs.dump(error))
    }
  })
  log(context, "Extra claims are " + njs.dump(context.extra_claims))
  return context
}

function pdpExecutor(context){ 
  log(context, "Inside PDP")
  return context.authz.pdp(context)
}

function umaCall(context){
  log(context, "Inside UMA call")
  var options = { "body" : computePermissionRequestBody(context) };
  return context.request.subrequest("/permission_request", options)
    .then(reply =>{
      if(reply.status === 200){
        debug(context, "UMA call reply is " + reply.status)
        return context
      }else{
        throw new Error("Response for authorization request is not ok " + reply.status + " " + njs.dump(reply.responseBody))  
      }
    })
}

function pass(context){
  log(context, "Inside pass"); 
  if(typeof(context.backend) === "string") context.request.internalRedirect(context.backend);
  else if (typeof(context.backend) === "function") context.request.internalRedirect(context.backend(context)) 
  return context;
}

// ######## AUTHORIZATION PART ###############
function computePermissionRequestBody(context){
  
  if(!context.authz.host || !context.authz.path ){
    throw new Error("Enforcemnt mode is always enforcing. Host or path not found...")
  }
  
  var audience = computeAudience(context)
  var grant = "grant_type=urn:ietf:params:oauth:grant-type:uma-ticket"
  var mode = "response_mode=decision"
  var permissions = computePermissions(context)
  var extra = ""
  if(context.extra_claims){
    extra = 
      "claim_token_format=urn:ietf:params:oauth:token-type:jwt&claim_token=" + 
      JSON.stringify(context.extra_claims).toString("base64url")
  }
  var body = audience + "&" + grant + "&" + permissions + "&" + mode + "&" + extra
  context.request.error("Computed permission request body is " + body)
  return body
}

function computeAudience(context){
  var aud = context.request.headersIn.host
  if(context.authz.host){
    aud = context.authz.host.audience||context.authz.host.host
  }
  return "audience=" + aud
}

function computePermissions(context){
  var resource = context.request.uri
  if(context.authz.path){
    resource = context.authz.path.name||context.authz.path.path
  }
  var scopes = []
  if(context.authz.method && context.authz.method.scopes){
    scopes = context.authz.method.scopes
  }
  if(scopes.length > 0){
    return scopes.map(s=>"permission=" + resource + "#" + s).join("&")
  }
  return "permission=" + resource
}

function getPath(hostconfig, incomingpath, incomingmethod){
  var paths = hostconfig.paths || []
  var matchingpaths = paths
  	.filter(p => {return incomingpath.match(p.path) != null})
  	.reduce((acc, p) => { 
    	if (!p.methods || p.methods.length === 0) acc.weak.push({ path: p});
      else{
      	var matchingmethods = p.methods.filter(m=>m.method.toUpperCase() === incomingmethod) 
      	if(matchingmethods.length > 0) acc.strong.push({ method : matchingmethods[0], path: p});
      } 
    	return acc;
    }, { strong: [], weak: []})
 return matchingpaths.strong.concat(matchingpaths.weak)[0]
}

function getHost(config, host){
  var matching = config.hosts.filter(h=>{
    return h.host === host
  })
  return matching.length > 0 ? matching[0] : null
}

function computeProtection(context){
  debug(context, "Getting by host " + context.request.headersIn.host)
  context.authz = {}
  context.authz.host = getHost(context.config, context.request.headersIn.host)
  if(context.authz.host !== null){
    log(context, "Host found:" + context.authz.host)
    context.authz.pip = context.authz.host.pip ? context.authz.host.pip : [];
    context.authz.pdp = context.authz.host.pdp ? context.authz.host.pdp : umaCall;
    var pathandmethod = getPath(context.authz.host, context.request.uri, context.request.method);
    if(pathandmethod){
      context.authz.path = pathandmethod.path;
      context.authz.pip = context.authz.path.pip ? context.authz.pip.concat(context.authz.path.pip) : context.authz.pip;
      context.authz.pdp = context.authz.path.pdp ? context.authz.path.pdp : context.authz.pdp;
      context.authz.method = pathandmethod.method;
      if(context.authz.method){
        context.authz.pip = context.authz.method.pip ? context.authz.pip.concat(context.authz.method.pip) : context.authz.pip;
        context.authz.pdp = context.authz.method.pdp ? context.authz.method.pdp : context.authz.pdp;
      }
    }
  }
  debug(context, "Leaving protection computation: ")
  return context
}

