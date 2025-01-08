package io.github.sammers.pla.logic;

import io.prometheus.metrics.core.metrics.Counter;
import io.prometheus.metrics.core.metrics.Gauge;
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
    private final Optional<RateLimiter> parent;
    private final Gauge permitsMetric = Gauge.builder()
        .name("RateLimiterPermits")
        .help("How many permits are left in the rate limiter")
        .labelNames("name")
        .register();

    public RateLimiter(String name, int permits, TimeUnit per, int maxRequestsTotal, Optional<RateLimiter> parent, Scheduler scheduler) {
        this.maxRequestsTotal = maxRequestsTotal;
        this.parent = parent;
        long now = System.currentTimeMillis();
        long duration = per.toMillis(permits);
        long step = duration / permits;
        for (int i = 0; i < permits; i++) {
            secondRing.add(now - (i * step));
        }
        scheduler.scheduleDirect(() -> {
            while (true) {
                CompletableEmitter src = requestQes.poll();
                while (src != null) {
                    if (secondRing.size() < permits) {
                        secondRing.add(System.currentTimeMillis());
                        src.onComplete();
                    } else {
                        Long oldestSecondR = secondRing.poll();
                        if (oldestSecondR != null) {
                            Long sleepSecondRing = 1000 - (System.currentTimeMillis() - oldestSecondR);
                            if (sleepSecondRing > 0) {
                                try {
                                    log.debug("Sleeping for {} ms", sleepSecondRing);
                                    Thread.sleep(sleepSecondRing);
                                } catch (InterruptedException e) {
                                    log.error("Interrupted", e);
                                }
                            }
                        }
                        secondRing.add(System.currentTimeMillis());
                        src.onComplete();
                    }
                    src = requestQes.poll();
                }
                permitsMetric.labelValues(name).set(permits - secondRing.size());
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
        if (parent.isPresent()) {
            return parent.get().request().andThen(request0());
        } else {
            return request0();
        }
    }

    private Completable request0() {
        if (requestQes.size() > maxRequestsTotal) {
            return Completable.error(new IllegalStateException(
                    "There are too many requests in the queue. Current size: " + requestQes.size()));
        } else {
            return Completable.create(requestQes::add);
        }
    }
}
