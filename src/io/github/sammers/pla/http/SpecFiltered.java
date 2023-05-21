package io.github.sammers.pla.http;

import java.util.List;

public interface SpecFiltered {

    SpecFiltered filter(final List<String> specs);
}
