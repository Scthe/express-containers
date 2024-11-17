const express = require('express');

/*
This a  simple Express app, just like the one seen in
https://expressjs.com/en/starter/hello-world.html.

Feel free to edit this file. Or any other.

In case of problems, just refresh the page. Ever wondered
what happens if you 'accidentally' delete *content*
of 'node_modules/express/lib/application.js'?
*/

const app = express();
const port = 3000; // edit me!

// Add static files. Access index.html on:
// http://localhost:3000/
app.use(express.static('public'));

// http://localhost:3000/hello?param0=1&param2
app.get('/hello', (req, res) => {
  const queryParamsStr = JSON.stringify(req.query);
  res.status(200).send(`Hello World! Query params: ${queryParamsStr}`);
});

// http://localhost:3000/user/my-user-id
app.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  res.status(202).set('My-Header', 'hello').send(`User '${userId}'. `);
});

// http://localhost:3000/error-500
app.get('/error-500', (req, res) => {
  res.status(500).json({
    error: 'You have called an endpoint that hardcodes Internal Server Error',
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
