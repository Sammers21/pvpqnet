package io.github.sammers.pla.logic;

import io.reactivex.Completable;
import io.reactivex.CompletableEmitter;
import io.reactivex.Scheduler;
import org.slf4j.Logger;

import java.util.LinkedList;
import java.util.Optional;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.TimeUnit;

public class RateLimiter {
    private static final Logger log = org.slf4j.LoggerFactory.getLogger(RateLimiter.class);
    private static final int DEFAULT_MAX_REQUESTS_TOTAL = 1000;
    private final LinkedList<Long> secondRing = new LinkedList<>();
    private final ConcurrentLinkedQueue<CompletableEmitter> requestQes = new ConcurrentLinkedQueue<>();
    private final int maxRequestsTotal;

    public RateLimiter(int permits, TimeUnit per, int maxRequestsTotal, Optional<RateLimiter> parent, Scheduler scheduler) {

    }

    public Completable request() {
        if (requestQes.size() > maxRequestsTotal) {
            return Completable.error(new IllegalStateException("There are too many requests in the queue. Current size: " + requestQes.size()));
        } else {
            return Completable.create(requestQes::add);
        }
    }
}
