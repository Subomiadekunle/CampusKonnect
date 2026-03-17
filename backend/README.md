# CampusKonnect Backend

I set up this Spring Boot backend to connect to PostgreSQL.

Right now the project includes:

- PostgreSQL connection config
- one starter entity: `User`
- three fields in the user table: `id`, `name`, and `email`

## PostgreSQL setup

For now each of us can have the database locally until we implement hosting online
Create a database named `campuskonnect` in PostgreSQL.

Then create a `.env` file in the project root with your database connection:

```bash
DB_URL=jdbc:postgresql://localhost:5433/campuskonnect
DB_USERNAME=campuskonnect
DB_PASSWORD=campuskonnect
```

If your PostgreSQL uses a different port, username, or password, just change those values.

## Run the backend

```bash
./mvnw spring-boot:run
```

Spring Boot will read the `.env` file and connect to PostgreSQL. Hibernate will create or update the `campus_users` table automatically.
