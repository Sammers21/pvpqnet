package io.github.sammers.pla.ratelim;

import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.CompletableEmitter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * An RxJava wrapper around the {@link RateLimiter} interface that processes
 * requests using virtual threads.
 *
 * <p>
 * This implementation queues incoming requests and processes them in a
 * background virtual thread, waiting until permits become available from the
 * underlying rate limiter.
 *
 * <p>
 * Key features:
 * <ul>
 * <li>Uses virtual threads for efficient blocking operations</li>
 * <li>Queue-based request processing</li>
 * <li>Backpressure via queue size limits</li>
 * <li>Returns RxJava {@link Completable} for reactive composition</li>
 * </ul>
 */
public class RxRateLimiterImpl {
  private static final Logger log = LoggerFactory.getLogger(RxRateLimiterImpl.class);
  private static final int DEFAULT_MAX_QUEUE_SIZE = 1000;
  private static final long DEFAULT_POLL_INTERVAL_MS = 1;
  private static final long DEFAULT_IDLE_SLEEP_MS = 10;
  private final RateLimiter rateLimiter;
  private final ConcurrentLinkedQueue<CompletableEmitter> requestQueue = new ConcurrentLinkedQueue<>();
  private final int maxQueueSize;
  private final long pollIntervalMs;
  private final long idleSleepMs;
  private final String name;
  private final ExecutorService executor;
  private volatile boolean running = true;

  /**
   * Creates a new RxRateLimiterImpl with the given rate limiter and default
   * settings.
   *
   * @param name
   *          the name of this rate limiter (for logging)
   * @param rateLimiter
   *          the underlying rate limiter to use
   */
  public RxRateLimiterImpl(String name, RateLimiter rateLimiter) {
    this(name, rateLimiter, DEFAULT_MAX_QUEUE_SIZE, DEFAULT_POLL_INTERVAL_MS, DEFAULT_IDLE_SLEEP_MS);
  }

  /**
   * Creates a new RxRateLimiterImpl with the given rate limiter and max queue
   * size.
   *
   * @param name
   *          the name of this rate limiter (for logging)
   * @param rateLimiter
   *          the underlying rate limiter to use
   * @param maxQueueSize
   *          the maximum number of pending requests in the queue
   */
  public RxRateLimiterImpl(String name, RateLimiter rateLimiter, int maxQueueSize) {
    this(name, rateLimiter, maxQueueSize, DEFAULT_POLL_INTERVAL_MS, DEFAULT_IDLE_SLEEP_MS);
  }

  /**
   * Creates a new RxRateLimiterImpl with full configuration.
   *
   * @param name
   *          the name of this rate limiter (for logging)
   * @param rateLimiter
   *          the underlying rate limiter to use
   * @param maxQueueSize
   *          the maximum number of pending requests in the queue
   * @param pollIntervalMs
   *          how often to retry acquiring a permit when rate limited (ms)
   * @param idleSleepMs
   *          how long to sleep when the queue is empty (ms)
   */
  public RxRateLimiterImpl(String name, RateLimiter rateLimiter, int maxQueueSize, long pollIntervalMs,
    long idleSleepMs) {
    this.name = name;
    this.rateLimiter = rateLimiter;
    this.maxQueueSize = maxQueueSize;
    this.pollIntervalMs = pollIntervalMs;
    this.idleSleepMs = idleSleepMs;
    this.executor = Executors.newVirtualThreadPerTaskExecutor();
    // Start the background processing thread
    executor.submit(this::processRequests);
    log.info("RxRateLimiterImpl '{}' initialized: maxQueueSize={}, pollIntervalMs={}, idleSleepMs={}", name,
      maxQueueSize, pollIntervalMs, idleSleepMs);
  }

  /**
   * Submits a request to acquire a permit from the rate limiter.
   *
   * <p>
   * The returned {@link Completable} will complete when a permit has been
   * successfully acquired. If the queue is full, an error is returned
   * immediately.
   *
   * @return a Completable that completes when a permit is acquired
   */
  public Completable request() {
    if (requestQueue.size() >= maxQueueSize) {
      return Completable.error(
        new IllegalStateException("RxRateLimiter '" + name + "': queue is full. Current size: " + requestQueue.size()));
    }
    return Completable.create(requestQueue::add);
  }

  /**
   * Background method that processes queued requests using virtual threads.
   */
  private void processRequests() {
    log.debug("RxRateLimiterImpl '{}': background processor started", name);
    while (running) {
      CompletableEmitter emitter = requestQueue.poll();
      if (emitter != null) {
        // Process this request - wait until we can acquire a permit
        processRequest(emitter);
      } else {
        // No requests in queue, sleep briefly
        try {
          Thread.sleep(idleSleepMs);
        } catch (InterruptedException e) {
          Thread.currentThread().interrupt();
          log.debug("RxRateLimiterImpl '{}': processor interrupted", name);
          break;
        }
      }
    }
    log.debug("RxRateLimiterImpl '{}': background processor stopped", name);
  }

  /**
   * Processes a single request by waiting until a permit can be acquired.
   *
   * @param emitter
   *          the completable emitter to complete when permit is acquired
   */
  private void processRequest(CompletableEmitter emitter) {
    try {
      // Spin/wait until we can acquire a permit
      while (!rateLimiter.tryAcquire()) {
        Thread.sleep(pollIntervalMs);
      }
      // Permit acquired, complete the request
      emitter.onComplete();
      log.trace("RxRateLimiterImpl '{}': request completed", name);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      emitter.onError(new InterruptedException("RxRateLimiter '" + name + "': request interrupted"));
    } catch (Exception e) {
      emitter.onError(e);
      log.error("RxRateLimiterImpl '{}': error processing request", name, e);
    }
  }

  /**
   * Returns the current queue size.
   *
   * @return the number of pending requests
   */
  public int getQueueSize() {
    return requestQueue.size();
  }

  /**
   * Returns the name of this rate limiter.
   *
   * @return the name
   */
  public String getName() {
    return name;
  }

  /**
   * Shuts down the background processor.
   */
  public void shutdown() {
    running = false;
    executor.shutdown();
    log.info("RxRateLimiterImpl '{}': shutdown initiated", name);
  }
}
