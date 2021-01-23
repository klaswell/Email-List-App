var AWS = require('aws-sdk');  			                    // Load the AWS SDK for Node.js
AWS.config.update({region: 'us-east-2'}); 		            // Set the region 
var ddb = new AWS.DynamoDB.DocumentClient();


// Main Handler
exports.handler = async function (event) {
  var body = JSON.parse(event.body);

  let email = body.email;
  let name = body.name;
  
  
  if (!validateName(name)) {
    var response = createResponse(400, "Error: this name is invalid");
    return response;
  }
  else if (!validateEmail(email)) {
    var response = createResponse(400, "Error: this email is invalid");
    return response;
  }
  
  
  var origin = event.headers.origin;
  console.log("Origin is " + origin);
  
  if (!(origin == "https://kodylaswell.com" || origin == "https://www.kodylaswell.com")) {
    console.log("Origin " + origin + " is not valid");
    
    var response = createResponse(403, "Origin is not valid");
    
//    return response;
  } else console.log("Origin " + origin + " is valid");


  console.log("POST request with info: Email: " + email + " + Name: " + name + " received");

  var params = createParams(email, name);
  console.log(params);


  try {
    await ddb.put(params).promise();
    var response = createResponse(200, "Successfully added " + email + "!");
  }
  catch (err) {
    if (err.name == "ConditionalCheckFailedException") {
      console.log(err);
      var response = createResponse(422, "Error: This email already exists");
    }
    else {
      console.log(err);
      var response = createResponse(500, err);
    }
  }
  finally {
    return response;
  }
};



function validateName(name) {
	let letters = /^[A-Za-z]+$/;

	if (name == '' || name.match(letters) ) {
		return true;
	}
	else {
		return false;
	}
}


function validateEmail(email) {
	email = email.toUpperCase();
	let regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/;
	
	if (email.match(regex)) {
		return true;
	}
	else if (email == "") {
		return false;
	}
	else {
		return false;
	}
}


function createResponse (code, body) {
  var response = {
    statusCode: code,
//    statusText: "name",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,POST"
    },
    body: (JSON.stringify(body))
  };
  console.log(response);
  return response;
}


function createParams (email, name) {
  if (name == '') {
    var params = {
      TableName: 'Email',
      Item: {
        'EmailAddress' : email,
      },
	    ConditionExpression: 'attribute_not_exists(EmailAddress)'
    };
  } else {
	  var params = {
      TableName: 'Email',
      Item: {
        'EmailAddress' : email,
        'Name' : name
      },
          ConditionExpression: "attribute_not_exists(EmailAddress)"
    };
  }
  return params;
}
