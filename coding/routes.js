const { Router } = require('express');

const router = Router();

router.get('/', (_req, res) => {
  res.send({ response: 'The server is up and running' }).status(200);
});

module.exports = router;
