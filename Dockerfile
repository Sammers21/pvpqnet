FROM amazoncorretto:21 AS build_stage
WORKDIR /build
COPY . .
RUN yum -y install findutils
RUN ./gradlew --no-daemon clean test shadowJar --stacktrace

FROM amazoncorretto:21
WORKDIR /awg2
COPY --from=build_stage /build/build/libs/wow-pla.jar wow-pla.jar
EXPOSE 9000 9400
CMD java \
    -jar \
    --add-opens java.base/java.lang=ALL-UNNAMED \
    -Xmx6g \
    -Xms1g \
    -XX:+UseG1GC \
    wow-pla.jar
