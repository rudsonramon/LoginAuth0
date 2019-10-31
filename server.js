const express = require('express');
require('dotenv').config();
const jwt = require('express-jwt'); //Validate JWT and set req.user
const jwksRsa = require('jwks-rsa');
const checkScope = require('express-jwt-authz'); // Validate JWT scopes

const checkJwt = jwt({
  // Dynamically provide a signing key based on the kid in the header
  // and the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true, //cache the signing key
    rateLimit: true,
    jwksRequestsPerMinute: 5, //prevent attackers from requesting more then 5 per minute
    jwksUri: `http://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`
  }),

  //Validate the audience and the issuer.
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,

  // This must match the algorithm selected in the Auth0 dashboard under your app's advanced settings under the OAuth tab
  algorithms: ['RS256']
});

const app = express();

app.get('/public', (req, res) => {
  res.json({
    message: 'Hello from public API!'
  });
});

app.get('/private', checkJwt, (req, res) => {
  res.json({
    message: 'Hello from private API!'
  });
});

function checkRole(role) {
  return function(req, res, next) {
    const assignedRoles = req.user['http://localhost:3000/roles'];
    if (Array.isArray(assignedRoles) && assignedRoles.includes(role)) {
      return next();
    } else {
      return res.status(401).send('Insuficient role');
    }
  };
}

app.get('/course', checkJwt, checkScope(['read:courses']), (req, res) => {
  res.json({
    courses: [
      { id: 1, title: 'Building Apps with React and Redux' },
      { id: 2, title: 'Creating Reusable React Components' }
    ]
  });
});

app.get('/admin', checkJwt, checkRole, (req, res) => {
  res.json({
    message: 'Hello from an admin API!'
  });
});

app.listen(3001);

console.log(`API server listenning on ${process.env.REACT_APP_API_URL}`);
