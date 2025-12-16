package io.github.sammers.pla.ratelim;

import io.prometheus.metrics.core.metrics.Counter;
import io.prometheus.metrics.core.metrics.Gauge;
import io.reactivex.rxjava3.core.Scheduler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

/**
 * A high-performance rate limiter implementation using a ring buffer (circular
 * array).
 *
 * <p>
 * This implementation uses a fixed-size circular buffer to track request
 * timestamps within a sliding time window. The ring buffer size equals the
 * number of permits, and the time window determines how long each permit is
 * "held" before it becomes available again.
 *
 * <p>
 * Key features:
 * <ul>
 * <li>Fixed memory footprint (ring buffer size equals permits)</li>
 * <li>Sliding window rate limiting</li>
 * <li>Thread-safe for concurrent access</li>
 * <li>Inspired by LMAX Disruptor's ring buffer design</li>
 * </ul>
 */
public class RateLimiterV2 implements RateLimiter {
  private static final Logger log = LoggerFactory.getLogger(RateLimiterV2.class);
  // Ring buffer of timestamps (using power of 2 for fast modulo via bit masking)
  private final long[] timestamps;
  private final int mask;
  private final long windowNanos;
  private final int permits;
  private final String name;
  private final Gauge permitsMetric;
  private final Counter acquiredMetric;
  private final Scheduler scheduler;
  // Current position in the ring buffer
  private volatile long cursor = 0;
  // Lock for atomic check-and-acquire
  private final ReentrantLock lock = new ReentrantLock();
  // Metrics
  private final AtomicLong acquiredCount = new AtomicLong(0);
  private final AtomicLong rejectedCount = new AtomicLong(0);

  /**
   * Creates a new RateLimiterV2 with the specified configuration.
   *
   * @param name
   *          the name of this rate limiter (for logging/metrics)
   * @param permits
   *          the maximum number of permits per time window
   * @param window
   *          the time window duration
   * @param unit
   *          the time unit for the window
   * @param preloadAvailablePermits
   *          if true, all permits are immediately available on start; if false,
   *          all permits start as just-consumed and only become available after
   *          the first full window (not gradually).
   * @param permitsMetric
   *          optional Prometheus gauge to report available permits
   * @param acquiredMetric
   *          optional Prometheus counter to report total acquired permits
   * @param scheduler
   *          optional scheduler (e.g., virtual-thread) to refresh metrics
   */
  public RateLimiterV2(String name, int permits, long window, TimeUnit unit, boolean preloadAvailablePermits,
    Gauge permitsMetric, Counter acquiredMetric, Scheduler scheduler) {
    this.name = name;
    this.permits = permits;
    this.windowNanos = unit.toNanos(window);
    this.permitsMetric = permitsMetric;
    this.acquiredMetric = acquiredMetric;
    this.scheduler = scheduler;
    // Ring buffer size must be a power of 2 for efficient modulo
    int bufferSize = nextPowerOfTwo(permits);
    this.timestamps = new long[bufferSize];
    this.mask = bufferSize - 1;
    long now = System.nanoTime();
    if (preloadAvailablePermits) {
      // All permits immediately available
      long initTimestamp = now - windowNanos - 1;
      for (int i = 0; i < bufferSize; i++) {
        timestamps[i] = initTimestamp;
      }
    } else {
      // Spread timestamps evenly across the last window so permits become available
      // gradually
      double step = (double) windowNanos / permits;
      long base = now - windowNanos;
      for (int i = 0; i < bufferSize; i++) {
        long ts = base + Math.round(i * step);
        if (ts > now) {
          ts = now;
        }
        timestamps[i] = ts;
      }
    }
    log.info("RateLimiterV2 '{}' initialized: {} permits per {} {}, buffer size: {}, preloadAvailablePermits={}", name,
      permits, window, unit.toString().toLowerCase(), bufferSize, preloadAvailablePermits);
    // Cursor should point to the last initialized slot so that oldestIndex starts
    // from 0
    this.cursor = permits - 1;
    startMetricsReporting();
  }

  /**
   * Creates a new RateLimiterV2 with default naming.
   *
   * @param permits
   *          the maximum number of permits per time window
   * @param window
   *          the time window duration
   * @param unit
   *          the time unit for the window
   */
  public RateLimiterV2(String name, int permits, long window, TimeUnit unit) {
    this(name, permits, window, unit, true, null, null, null);
  }

  /**
   * Creates a new RateLimiterV2 with default naming and immediate availability of
   * permits.
   *
   * @param permits
   *          the maximum number of permits per time window
   * @param window
   *          the time window duration
   * @param unit
   *          the time unit for the window
   */
  public RateLimiterV2(int permits, long window, TimeUnit unit) {
    this("default", permits, window, unit, true, null, null, null);
  }

  /**
   * Creates a new RateLimiterV2 with default naming and the option to preload
   * permits.
   *
   * @param permits
   *          the maximum number of permits per time window
   * @param window
   *          the time window duration
   * @param unit
   *          the time unit for the window
   * @param preloadAvailablePermits
   *          if true, all permits are immediately available on start
   */
  public RateLimiterV2(int permits, long window, TimeUnit unit, boolean preloadAvailablePermits) {
    this("default", permits, window, unit, preloadAvailablePermits, null, null, null);
  }

  @Override
  public boolean tryAcquire() {
    long now = System.nanoTime();
    lock.lock();
    try {
      // Find the oldest timestamp in our permit window
      // We look at the slot that will be overwritten next (cursor - permits + 1)
      int oldestIndex = (int) ((cursor - permits + 1) & mask);
      long oldestTimestamp = timestamps[oldestIndex];
      // Check if the oldest permit has expired
      if (now - oldestTimestamp >= windowNanos) {
        // The oldest permit has expired, acquire new one
        cursor++;
        int newIndex = (int) (cursor & mask);
        timestamps[newIndex] = now;
        acquiredCount.incrementAndGet();
        if (acquiredMetric != null) {
          acquiredMetric.labelValues(name).inc();
        }
        updateGauge();
        log.trace("RateLimiter '{}': permit acquired at index {}", name, newIndex);
        return true;
      } else {
        // All permits are still within the time window
        rejectedCount.incrementAndGet();
        long waitTimeMs = (windowNanos - (now - oldestTimestamp)) / 1_000_000;
        log.trace("RateLimiter '{}': rejected, wait {}ms for next permit", name, waitTimeMs);
        return false;
      }
    } finally {
      lock.unlock();
    }
  }

  @Override
  public void returnNonUsed() {
    lock.lock();
    try {
      if (cursor > 0) {
        // Mark the most recent timestamp as expired (in the past)
        int currentIndex = (int) (cursor & mask);
        timestamps[currentIndex] = System.nanoTime() - windowNanos - 1;
        cursor--;
        acquiredCount.decrementAndGet();
        updateGauge();
        log.trace("RateLimiter '{}': permit returned at index {}", name, currentIndex);
      }
    } finally {
      lock.unlock();
    }
  }

  /**
   * Returns the number of currently available permits.
   *
   * @return the number of available permits
   */
  public int availablePermits() {
    long now = System.nanoTime();
    int available = 0;
    lock.lock();
    try {
      for (int i = 0; i < permits; i++) {
        int index = (int) ((cursor - i) & mask);
        if (now - timestamps[index] >= windowNanos) {
          available++;
        }
      }
    } finally {
      lock.unlock();
    }
    return available;
  }

  /**
   * Returns the total number of successful acquisitions.
   *
   * @return the acquired count
   */
  public long getAcquiredCount() {
    return acquiredCount.get();
  }

  /**
   * Returns the total number of rejected acquisition attempts.
   *
   * @return the rejected count
   */
  public long getRejectedCount() {
    return rejectedCount.get();
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
   * Returns the maximum permits per window.
   *
   * @return the permits
   */
  public int getPermits() {
    return permits;
  }

  /**
   * Returns the window duration in nanoseconds.
   *
   * @return the window in nanos
   */
  public long getWindowNanos() {
    return windowNanos;
  }

  /**
   * Calculates the next power of two greater than or equal to the given value.
   *
   * @param value
   *          the input value
   * @return the next power of two
   */
  private static int nextPowerOfTwo(int value) {
    int n = value - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return n + 1;
  }

  private void startMetricsReporting() {
    if (permitsMetric != null && scheduler != null) {
      // Periodically refresh available permits metric
      scheduler.schedulePeriodicallyDirect(() -> permitsMetric.labelValues(name).set(availablePermits()), 0, 100,
        TimeUnit.MILLISECONDS);
    }
  }

  private void updateGauge() {
    if (permitsMetric != null) {
      permitsMetric.labelValues(name).set(availablePermits());
    }
  }
}
