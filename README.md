# app-config-service

App url is hosted on heroku: https://app-config-service.herokuapp.com/. Used database: MongoDB Atlas.

For local development following prerequisites are required:

- MongoDB >=4.2 installed and running
- Node v10 or greater
- config.env file with required environment variables present in root directory

config.env file sample:

```
PORT='put port here - i.e. 3000'
DATABASE='put mongo database string here - i.e. mongodb://localhost:27017/app-config-service'
DATABASE_PASSWORD='put optional password to database here'
DATABASE_TESTS='put mongo test database string here - i.e. mongodb://localhost:27017/app-config-service-test'
```

To run app locally following commands have to be run:

`npm install`

`npm start`

To run tests:

`npm test`
