# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

# Runtime stage
FROM eclipse-temurin:17-jre
ENV PORT=8080
WORKDIR /app
COPY --from=build /app/target/secure-transfer-1.0.0.jar /app/app.jar
EXPOSE 8080
CMD ["java","-jar","/app/app.jar"]
