# ====== Build stage ======
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

# Copy POM first for better caching
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

# Copy sources and build
COPY src ./src
RUN mvn -q -DskipTests package

# Normalize jar name for the next stage
RUN cp target/*-SNAPSHOT.jar /workspace/app.jar || cp target/*.jar /workspace/app.jar

# ====== Runtime stage ======
FROM eclipse-temurin:17-jre
ENV JAVA_OPTS=""
ENV PORT=8080
WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar

# Render sets $PORT; make Spring bind to it
CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar /app/app.jar"]
