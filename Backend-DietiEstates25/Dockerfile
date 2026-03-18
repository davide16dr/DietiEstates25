# Multi-stage build
FROM amazoncorretto:17-alpine AS builder

WORKDIR /app

COPY . .

RUN apk add --no-cache maven && \
    mvn clean package -DskipTests -q && \
    ls -lh target/*.jar

# Runtime
FROM amazoncorretto:17-alpine

WORKDIR /app

COPY --from=builder /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Porta corretta
EXPOSE 8080

# Variabili di default (Beanstalk può overridearle)
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC"
ENV SERVER_PORT=8080
ENV SPRING_PROFILES_ACTIVE=production

# Startup
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${SERVER_PORT} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -Dspring.datasource.url=${DB_URL} -Dspring.datasource.username=${DB_USERNAME} -Dspring.datasource.password=${DB_PASSWORD} -jar app.jar"]