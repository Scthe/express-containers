const express = require('express');

/*
This a  simple express app, like seen on
https://expressjs.com/en/starter/hello-world.html.

Feel free to edit this file. Or any other.

In case of problems, just refresh the page.
*/

const app = express();
app.use(express.static('public'));
const port = 3000;

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
