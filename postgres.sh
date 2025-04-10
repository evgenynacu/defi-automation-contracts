docker run --name my-postgres-17 -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -v ./data:/var/lib/postgresql/data -d postgres:17
