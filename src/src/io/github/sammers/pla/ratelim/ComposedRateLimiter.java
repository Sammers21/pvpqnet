package io.github.sammers.pla.ratelim;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.List;

/**
 * A composite rate limiter that combines multiple rate limiters.
 *
 * <p>
 * This rate limiter will only allow an acquisition if ALL of the underlying
 * rate limiters allow it. This is useful for implementing tiered rate limiting,
 * such as:
 * <ul>
 * <li>100 requests per second AND</li>
 * <li>36,000 requests per hour</li>
 * </ul>
 *
 * <p>
 * The acquisition is atomic - if any limiter rejects, permits acquired from
 * earlier limiters are returned via {@link RateLimiter#returnNonUsed()}.
 */
public class ComposedRateLimiter implements RateLimiter {
  private static final Logger log = LoggerFactory.getLogger(ComposedRateLimiter.class);
  private final List<RateLimiter> limiters;
  private final String name;

  /**
   * Creates a new ComposedRateLimiter with the given limiters.
   *
   * @param limiters
   *          the list of rate limiters to compose
   */
  public ComposedRateLimiter(List<RateLimiter> limiters) {
    this("composed", limiters);
  }

  /**
   * Creates a new ComposedRateLimiter with the given name and limiters.
   *
   * @param name
   *          the name of this composed rate limiter
   * @param limiters
   *          the list of rate limiters to compose
   */
  public ComposedRateLimiter(String name, List<RateLimiter> limiters) {
    this.name = name;
    this.limiters = List.copyOf(limiters);
    log.info("ComposedRateLimiter '{}' initialized with {} limiters", name, limiters.size());
  }

  /**
   * Creates a new ComposedRateLimiter with the given limiters.
   *
   * @param limiters
   *          the rate limiters to compose
   */
  public ComposedRateLimiter(RateLimiter... limiters) {
    this("composed", Arrays.asList(limiters));
  }

  /**
   * Creates a new ComposedRateLimiter with the given name and limiters.
   *
   * @param name
   *          the name of this composed rate limiter
   * @param limiters
   *          the rate limiters to compose
   */
  public ComposedRateLimiter(String name, RateLimiter... limiters) {
    this(name, Arrays.asList(limiters));
  }

  /**
   * Attempts to acquire a permit from all underlying rate limiters.
   *
   * <p>
   * This method acquires permits sequentially. If any limiter fails, all
   * previously acquired permits are returned via
   * {@link RateLimiter#returnNonUsed()} to ensure atomicity.
   *
   * @return true if permits were acquired from all limiters, false otherwise
   */
  @Override
  public boolean tryAcquire() {
    for (int i = 0; i < limiters.size(); i++) {
      RateLimiter limiter = limiters.get(i);
      if (!limiter.tryAcquire()) {
        // Failed to acquire from this limiter, return all previously acquired permits
        for (int j = 0; j < i; j++) {
          limiters.get(j).returnNonUsed();
        }
        log.trace("ComposedRateLimiter '{}': rejected by limiter {}, returned {} permits", name, i, i);
        return false;
      }
    }
    log.trace("ComposedRateLimiter '{}': permit acquired from all {} limiters", name, limiters.size());
    return true;
  }

  /**
   * Returns a permit to all underlying rate limiters.
   */
  @Override
  public void returnNonUsed() {
    for (RateLimiter limiter : limiters) {
      limiter.returnNonUsed();
    }
    log.trace("ComposedRateLimiter '{}': returned permits to all {} limiters", name, limiters.size());
  }

  /**
   * Returns the list of underlying rate limiters.
   *
   * @return an unmodifiable list of rate limiters
   */
  public List<RateLimiter> getLimiters() {
    return limiters;
  }

  /**
   * Returns the name of this composed rate limiter.
   *
   * @return the name
   */
  public String getName() {
    return name;
  }
}
