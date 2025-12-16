package io.github.sammers.pla.ratelim;

/**
 * Rate limiter.
 */
public interface RateLimiter {
  boolean tryAcquire();

  void returnNonUsed();
}
