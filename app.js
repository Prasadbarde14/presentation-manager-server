const express = require('express')
const app = express()
const port = 4000 // Choose any port number you prefer
const { retrieveData } = require('./castingFunc')
const cors = require('cors');
const { continuousDiscovery } = require('./getdevices');


// Middleware to parse JSON bodies
app.use(express.json())
app.use(cors())

// POST endpoint to receive data from Postman
app.post(
  '/receive-data',
  (req, res, next) => {
    try {
      // Check if the request body contains an array
      if (!Array.isArray(req.body)) {
        throw new Error('Invalid data format. Expected an array.')
      }

      console.log('Payload received:')
      console.log(req.body) // This will log the entire payload as an array of objects

      next()
    } catch (error) {
      console.error('Error:', error.message)
      res.status(400).send('Bad Request')
    }
  },
  retrieveData
)

// continuousDiscovery();

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})