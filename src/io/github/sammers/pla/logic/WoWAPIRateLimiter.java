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
public class WoWAPIRateLimiter {

    private static final Logger log = org.slf4j.LoggerFactory.getLogger(WoWAPIRateLimiter.class);
    private static final int DEFAULT_MAX_REQUESTS_TOTAL = 1000;
    private final LinkedList<Long> secondRing = new LinkedList<>();
    private final LinkedList<Long> hourRing = new LinkedList<>();
    private final ConcurrentLinkedQueue<CompletableEmitter> requestQes = new ConcurrentLinkedQueue<>();
    private final int maxRequestsTotal;

    public WoWAPIRateLimiter(Scheduler scheduler) {
        this(100, 36000, DEFAULT_MAX_REQUESTS_TOTAL, scheduler);
    }

    public WoWAPIRateLimiter(int maxRequestsPerSecond, int maxRequestsPerHour, int maxRequestsTotal, Scheduler scheduler) {
        this.maxRequestsTotal = maxRequestsTotal;
        for (int i = 0; i < maxRequestsPerSecond; i++) {
            secondRing.add(System.currentTimeMillis());
        }
        scheduler.scheduleDirect(() -> {
            while (true) {
                CompletableEmitter src = requestQes.poll();
                while (src != null) {
                    if (secondRing.size() < maxRequestsPerSecond && hourRing.size() < maxRequestsPerHour) {
                        secondRing.add(System.currentTimeMillis());
                        hourRing.add(System.currentTimeMillis());
                        src.onComplete();
                    } else {
                        Long oldestSecondR = secondRing.poll();
                        Long oldestHour = hourRing.poll();
                        if (oldestSecondR != null) {
                            Long sleepSecondRing = 1000 - (System.currentTimeMillis() - oldestSecondR);
                            Long sleepHrRing = 60 * 60 * 1000L - (System.currentTimeMillis() - oldestHour);
                            Long totalSleep = Math.max(sleepSecondRing, sleepHrRing);
                            if (sleepSecondRing > 0) {
                                try {
                                    log.debug("Sleeping for {} ms", sleepSecondRing);
                                    Thread.sleep(totalSleep);
                                } catch (InterruptedException e) {
                                    log.error("Interrupted", e);
                                }
                            }
                        }
                        secondRing.add(System.currentTimeMillis());
                        hourRing.add(System.currentTimeMillis());
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
        } else {
            return Completable.create(requestQes::add);
        }
    }
}
