package io.github.sammers.pla.http;

import io.prometheus.metrics.core.metrics.Counter;
import io.prometheus.metrics.core.metrics.Gauge;
import io.prometheus.metrics.core.metrics.Histogram;
import io.prometheus.metrics.core.metrics.Summary;
import io.vertx.core.Handler;
import io.vertx.core.buffer.Buffer;
import io.vertx.rxjava3.ext.web.RoutingContext;

public class HttpMetricsCollector implements Handler<RoutingContext> {
  // High-resolution latency histogram with fine-grained buckets
  private static final Histogram HTTP_LATENCY = Histogram.builder()
    .name("http_request_duration_seconds")
    .help("HTTP request latency in seconds")
    .labelNames("path", "method", "status")
    // 64 buckets, starting at 1ms, growing exponentially by factor 1.17
    // Covers range from 1ms to ~20s with high resolution
    .classicExponentialUpperBounds(0.001, 1.17, 64)
    .register();
  // Summary for precise percentiles (p50, p75, p90, p95, p99, p99.9)
  private static final Summary HTTP_LATENCY_SUMMARY = Summary.builder()
    .name("http_request_duration_summary_seconds")
    .help("HTTP request latency summary with quantiles")
    .labelNames("path", "method")
    .quantile(0.5, 0.01) // p50
    .quantile(0.75, 0.01) // p75
    .quantile(0.9, 0.005) // p90
    .quantile(0.95, 0.005) // p95
    .quantile(0.99, 0.001) // p99
    .quantile(0.999, 0.0001)// p99.9
    .maxAgeSeconds(60) // 1-minute sliding window
    .numberOfAgeBuckets(5) // 5 buckets for smooth decay
    .register();
  // Total HTTP requests counter
  private static final Counter HTTP_REQUESTS = Counter.builder()
    .name("http_requests_total")
    .help("Total HTTP requests")
    .labelNames("path", "method", "status")
    .register();
  // Request body size (incoming traffic)
  private static final Counter HTTP_REQUEST_BYTES = Counter.builder()
    .name("http_request_bytes_total")
    .help("Total bytes received in HTTP requests")
    .labelNames("path", "method")
    .register();
  // Response body size (outgoing traffic)
  private static final Counter HTTP_RESPONSE_BYTES = Counter.builder()
    .name("http_response_bytes_total")
    .help("Total bytes sent in HTTP responses")
    .labelNames("path", "method", "status")
    .register();
  // Histogram for request size distribution
  private static final Histogram HTTP_REQUEST_SIZE = Histogram.builder()
    .name("http_request_size_bytes")
    .help("HTTP request body size in bytes")
    .labelNames("path", "method")
    // Buckets: 100B, 1KB, 10KB, 100KB, 1MB, 10MB
    .classicUpperBounds(100, 1024, 10240, 102400, 1048576, 10485760)
    .register();
  // Histogram for response size distribution
  private static final Histogram HTTP_RESPONSE_SIZE = Histogram.builder()
    .name("http_response_size_bytes")
    .help("HTTP response body size in bytes")
    .labelNames("path", "method", "status")
    // Buckets: 100B, 1KB, 10KB, 100KB, 1MB, 10MB
    .classicUpperBounds(100, 1024, 10240, 102400, 1048576, 10485760)
    .register();
  // Counter for HTTP errors by status code class
  private static final Counter HTTP_ERRORS = Counter.builder()
    .name("http_errors_total")
    .help("Total HTTP errors (4xx and 5xx)")
    .labelNames("path", "method", "status_class")
    .register();
  // In-flight requests gauge
  private static final Gauge HTTP_IN_FLIGHT_REQUESTS = Gauge.builder()
    .name("http_requests_in_flight")
    .help("Current number of in-flight HTTP requests")
    .labelNames("path", "method")
    .register();

  @Override
  public void handle(RoutingContext ctx) {
    long startTime = System.nanoTime();
    String path = normalizePath(ctx.normalizedPath());
    String method = ctx.request().method().name();
    // Track in-flight requests
    HTTP_IN_FLIGHT_REQUESTS.labelValues(path, method).inc();
    try {
      // Track request size
      Buffer body = ctx.body().buffer();
      long requestSize = body != null ? body.length() : 0;
      // Also consider content-length header for cases where body isn't buffered
      String contentLength = ctx.request().getHeader("Content-Length");
      if (requestSize == 0 && contentLength != null) {
        try {
          requestSize = Long.parseLong(contentLength);
        } catch (NumberFormatException ignored) {
        }
      }
      final long finalRequestSize = requestSize;
      ctx.addBodyEndHandler(v -> {
        double durationSeconds = (System.nanoTime() - startTime) / 1_000_000_000.0;
        int statusCode = ctx.response().getStatusCode();
        String status = String.valueOf(statusCode);
        // Decrement in-flight requests
        HTTP_IN_FLIGHT_REQUESTS.labelValues(path, method).dec();
        // Latency metrics
        HTTP_LATENCY.labelValues(path, method, status).observe(durationSeconds);
        HTTP_LATENCY_SUMMARY.labelValues(path, method).observe(durationSeconds);
        // Request count
        HTTP_REQUESTS.labelValues(path, method, status).inc();
        // Traffic metrics - request
        HTTP_REQUEST_BYTES.labelValues(path, method).inc(finalRequestSize);
        HTTP_REQUEST_SIZE.labelValues(path, method).observe(finalRequestSize);
        // Traffic metrics - response
        long responseSize = 0;
        String responseContentLength = ctx.response().headers().get("Content-Length");
        if (responseContentLength != null) {
          try {
            responseSize = Long.parseLong(responseContentLength);
          } catch (NumberFormatException ignored) {
          }
        } else {
          // Estimate from bytesWritten if available
          responseSize = ctx.response().bytesWritten();
        }
        HTTP_RESPONSE_BYTES.labelValues(path, method, status).inc(responseSize);
        HTTP_RESPONSE_SIZE.labelValues(path, method, status).observe(responseSize);
        // Error tracking
        if (statusCode >= 400) {
          String statusClass = statusCode >= 500 ? "5xx" : "4xx";
          HTTP_ERRORS.labelValues(path, method, statusClass).inc();
        }
      });
    } finally {
      ctx.next();
    }
  }

  private String normalizePath(String path) {
    if (path == null || path.isEmpty()) {
      return "/";
    }
    return path.replaceAll("/eu/|/us/|/kr/|/tw/|/cn/", "/{region}/")
      .replaceAll("/[^/]+-[^/]+/", "/{realm}/")
      .replaceAll("/[a-zA-Z\\u00C0-\\u017F]+(?=/update|/equipment|/talents|$)", "/{name}")
      .replaceAll("/\\{name\\}$", "/{name}");
  }
}
