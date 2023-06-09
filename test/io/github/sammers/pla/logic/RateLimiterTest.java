package io.github.sammers.pla.logic;

import io.reactivex.Completable;
import io.reactivex.Scheduler;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.Executors;

public class RateLimiterTest {
    public static final Scheduler VTHREAD_EXECUTOR = io.reactivex.schedulers.Schedulers.from(Executors.newSingleThreadExecutor());
    @Test
    public void basic() {
        Long start = System.currentTimeMillis();
        RateLimiter rateLimiter = new RateLimiter(1, VTHREAD_EXECUTOR);
        Completable.merge(
            List.of(
                rateLimiter.request(),
                rateLimiter.request(),
                rateLimiter.request(),
                rateLimiter.request(),
                rateLimiter.request()
            )
        ).blockingAwait();
        assertTimePassed(start, 5000L);
    }

    private void assertTimePassed(Long start, Long passed) {
        String exp = "Expected " + passed + " ms to pass, but only " + (System.currentTimeMillis() - start) + " ms passed";
        boolean b = (System.currentTimeMillis() - start) >= passed;
        Assertions.assertTrue(b, exp);
    }
}
