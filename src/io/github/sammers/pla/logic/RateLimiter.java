package io.github.sammers.pla.logic;

import io.reactivex.Completable;
import io.reactivex.CompletableEmitter;
import io.reactivex.Scheduler;
import org.slf4j.Logger;

import java.util.LinkedList;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * This class is used to limit the number of requests to the Blizzard API.
 */
public class RateLimiter {

    private static final Logger log = org.slf4j.LoggerFactory.getLogger(RateLimiter.class);
    private static final int DEFAULT_MAX_REQUESTS_TOTAL = 1000;
    private final LinkedList<Long> ring = new LinkedList<>();
    private final ConcurrentLinkedQueue<CompletableEmitter> requestQes = new ConcurrentLinkedQueue<>();
    private final int maxRequestsTotal;

    public RateLimiter(int maxRequestsPerSecond, Scheduler scheduler) {
        this(maxRequestsPerSecond, DEFAULT_MAX_REQUESTS_TOTAL, scheduler);
    }

    public RateLimiter(int maxRequestsPerSecond, int maxRequestsTotal, Scheduler scheduler) {
        this.maxRequestsTotal = maxRequestsTotal;
        for (int i = 0; i < maxRequestsPerSecond; i++) {
            ring.add(System.currentTimeMillis());
        }
        scheduler.scheduleDirect(() -> {
            while (true) {
                CompletableEmitter src = requestQes.poll();
                while (src != null) {
                    if (ring.size() < maxRequestsPerSecond) {
                        ring.add(System.currentTimeMillis());
                        src.onComplete();
                    } else {
                        Long oldest = ring.poll();
                        if (oldest != null) {
                            Long sleep = 1000 - (System.currentTimeMillis() - oldest);
                            if (sleep > 0) {
                                try {
                                    log.debug("Sleeping for {} ms", sleep);
                                    Thread.sleep(sleep);
                                } catch (InterruptedException e) {
                                    log.error("Interrupted", e);
                                }
                            }
                        }
                        ring.add(System.currentTimeMillis());
                        src.onComplete();
                    }
                    src = requestQes.poll();
                }
                try {
                    log.trace("Sleeping for {} ms after processing all requests", 100);
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    log.error("Interrupted", e);
                }
            }
        });
    }

    public Completable request() {
        if (requestQes.size() > maxRequestsTotal) {
            return Completable.error(new IllegalStateException("There are too many requests in the queue. Current size: " + requestQes.size()));
        }
        return Completable.create(requestQes::add);
    }
}
