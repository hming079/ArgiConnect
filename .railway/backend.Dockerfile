FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

COPY backend/src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar
COPY --chown=spring:spring ai/data /ai/data

USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
