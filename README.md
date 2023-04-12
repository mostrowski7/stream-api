## Table of contents
* [General info](#general-info)
* [Technologies](#technologies)
* [Setup](#setup)
* [Features](#features)

## General info
Users authentication service built as part of microservices architecture.

After learning about available authentication strategies for this type of architecture,
I chose a service that is independent and forces each service to have token validation functionality.

The authentication system is based on JWT tokens, it generates both access and refresh tokens.
Also, for security reasons refresh token is stored in cookies with HttpOnly flag.

## Technologies
* NestJS
* Knex migrations
* PostgreSQL raw queries
* Jest
* Docker
* CircleCI
	
## Setup
### Run
```
# Build
$ docker-compose build

# Start
$ docker-compose up -d
```

### Migration
```
$ docker-compose run api npm run migration
```

### Test
```
$ docker-compose run api npm run test
```

## Features
* Registers a new user
* Authenticates user credentials
* Generates access and refesh tokens

### To Do:
* Confirmation email using queue
* Reset password
* Deploy to AWS
