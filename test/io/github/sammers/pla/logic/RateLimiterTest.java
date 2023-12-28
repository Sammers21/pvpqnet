package io.github.sammers.pla.logic;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import io.reactivex.Completable;
import io.reactivex.Scheduler;
import io.vertx.core.cli.Option;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.Optional;
import java.util.ArrayList;

public class RateLimiterTest {
    
    public static final Scheduler VTHREAD_EXECUTOR = io.reactivex.schedulers.Schedulers.from(Executors.newVirtualThreadPerTaskExecutor());

    @Test
    public void basic() {
        Long start = System.currentTimeMillis();
        RateLimiter woWAPIRateLimiter = new RateLimiter(2, TimeUnit.SECONDS, 100, Optional.empty(),  VTHREAD_EXECUTOR);
        Completable.merge(
            List.of(
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request()
            )
        ).blockingAwait();
        assertTimePassed(start, 5000L);
    }

    @Test
    public void basicWithHr() {
        Long start = System.currentTimeMillis();
        RateLimiter woWAPIRateLimiter = new RateLimiter(36000, TimeUnit.HOURS, 100, Optional.empty(),  VTHREAD_EXECUTOR);
        Completable.merge(
            List.of(
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request(),
                woWAPIRateLimiter.request()
            )
        ).blockingAwait();
        assertTimePassed(start, 1000L);
    }

    @Test
    public void complexBlizzardLike() {
        Long start = System.currentTimeMillis();
        RateLimiter woWAPIRateLimiter = new RateLimiter(10, TimeUnit.SECONDS, 100, 
            Optional.of(new RateLimiter(10, TimeUnit.SECONDS, 100, Optional.empty(),  VTHREAD_EXECUTOR)),
        VTHREAD_EXECUTOR);
        List<Completable> x = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            x.add(woWAPIRateLimiter.request());
        }
        Completable.merge(x).blockingAwait();
        assertTimePassed(start, 1000L);
    }


    private void assertTimePassed(Long start, Long passed) {
        String exp = "Expected " + passed + " ms to pass, but only " + (System.currentTimeMillis() - start) + " ms passed";
        boolean b = (System.currentTimeMillis() - start) >= passed;
        Assertions.assertTrue(b, exp);
    }
}
