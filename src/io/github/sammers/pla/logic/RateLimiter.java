package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.reactivex.Completable;
import io.reactivex.CompletableEmitter;
import io.reactivex.Scheduler;

import java.util.LinkedList;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;

public class RateLimiter {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RateLimiter.class);
    private final LinkedList<Long> ring = new LinkedList<>();
    private final ConcurrentLinkedQueue<CompletableEmitter> requestQes = new ConcurrentLinkedQueue<>();
    private final int maxRequestsPerSecond;

    public RateLimiter(int maxRequestsPerSecond, Scheduler scheduler) {
        this.maxRequestsPerSecond = maxRequestsPerSecond;
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
                    log.debug("Sleeping for {} ms after processing all requests", 100);
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    log.error("Interrupted", e);
                }
            }
        });
    }

    public Completable request() {
        return Completable.create(requestQes::add);
    }
}
