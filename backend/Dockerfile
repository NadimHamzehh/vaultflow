# ====== Build stage ======
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

# Copy whatever jar was built to a stable name
RUN cp target/*-SNAPSHOT.jar /workspace/app.jar || cp target/*.jar /workspace/app.jar

# ====== Runtime stage ======
FROM eclipse-temurin:17-jre
WORKDIR /app

# Helps on some hosts with IPv6 routes
ENV JAVA_OPTS="-Djava.net.preferIPv4Stack=true -Djava.net.preferIPv6Addresses=false"
ENV PORT=8080

COPY --from=build /workspace/app.jar /app/app.jar

# IMPORTANT: Bind Spring to the port Render assigns
CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar /app/app.jar"]
