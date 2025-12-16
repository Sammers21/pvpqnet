package io.github.sammers.pla.ratelim;

import io.reactivex.rxjava3.core.Completable;

public interface RxRateLimiter {
  /**
   * Requests permission to proceed.
   *
   * @return a Completable that completes when permission is granted
   */
  Completable request();
}
