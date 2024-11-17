const express = require('express');

/*
This a  simple express app, like seen on
https://expressjs.com/en/starter/hello-world.html.

Feel free to edit this file. Or any other.

In case of problems, just refresh the page.
*/

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
