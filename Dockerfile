FROM gradle:9-jdk25 AS build_stage
WORKDIR /build
COPY build.gradle gradle.properties settings.gradle* gradlew* ./
COPY gradle ./gradle
RUN gradle --no-daemon dependencies --stacktrace || true
COPY . .
RUN gradle  --no-daemon clean test shadowJar --stacktrace

FROM amazoncorretto:25
WORKDIR /pvpq
COPY --from=build_stage /build/build/libs/wow-pla.jar wow-pla.jar
EXPOSE 9000 9400
CMD java \
    --add-opens java.base/java.lang=ALL-UNNAMED \
    --add-modules jdk.incubator.vector \
    -XX:-OmitStackTraceInFastThrow \
    -Xmx6g \
    -Xms1g \
    -XX:+UseG1GC \
    -jar wow-pla.jar \
    --config /pvpq/config.yaml
