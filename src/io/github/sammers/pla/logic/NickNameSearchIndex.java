package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.WowAPICharacter;
import org.apache.lucene.analysis.*;
import org.apache.lucene.analysis.miscellaneous.ASCIIFoldingFilter;
import org.apache.lucene.analysis.no.NorwegianAnalyzer;
import org.apache.lucene.analysis.pattern.SimplePatternTokenizer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.*;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.store.ByteBuffersDirectory;
import org.apache.lucene.store.Directory;
import org.slf4j.Logger;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class NickNameSearchIndex {

    private static final Logger log = org.slf4j.LoggerFactory.getLogger(NickNameSearchIndex.class);
    private final Directory index;
    private final Analyzer analyzer;

    public NickNameSearchIndex() {
        index = new ByteBuffersDirectory();
        analyzer = new Analyzer() {
            @Override
            protected TokenStreamComponents createComponents(String fieldName) {
                final Tokenizer src = new SimplePatternTokenizer("(.*)");
                TokenStream tok = new LowerCaseFilter(src);
                tok = new ASCIIFoldingFilter(tok, true);
                tok = new StopFilter(tok, NorwegianAnalyzer.getDefaultStopSet());
                return new TokenStreamComponents(r -> {
                    src.setReader(r);
                }, tok);
            }
        };
    }

    private void insertNickNames(List<SearchResult> searchResults) {
        insertNickNames(searchResults.toArray(new SearchResult[0]));
    }

    public void insertNickNamesWC(List<WowAPICharacter> characters) {
        List<SearchResult> list = characters.stream()
            .filter(charz -> !charz.hidden())
            .map(charz -> new SearchResult(charz.fullName(), charz.region(), charz.clazz())).toList();
        insertNickNames(list);
    }

    protected synchronized void insertNickNames(SearchResult... searchResults) {
        try {
            IndexWriterConfig config = new IndexWriterConfig(analyzer);
            IndexWriter w = new IndexWriter(index, config);
            for (SearchResult searchResult : searchResults) {
                Document doc = new Document();
                doc.add(new org.apache.lucene.document.TextField("nickName", searchResult.nick(), org.apache.lucene.document.Field.Store.YES));
                doc.add(new org.apache.lucene.document.TextField("region", searchResult.region(), org.apache.lucene.document.Field.Store.YES));
                doc.add(new org.apache.lucene.document.TextField("class", searchResult.clazz(), org.apache.lucene.document.Field.Store.YES));
                w.addDocument(doc);
            }
            w.close();
        } catch (IOException e) {
            log.error("Error while inserting nicknames", e);
        }
    }

    public List<SearchResult> searchNickNames(String query) {
        List<SearchResult> searchRes = new ArrayList<>();
        try {
            Query q = new PrefixQuery(new Term("nickName", query));
            IndexReader indexReader = DirectoryReader.open(index);
            IndexSearcher searcher = new IndexSearcher(indexReader);
            TopDocs res = searcher.search(q, 20);
            for (int i = 0; i < res.scoreDocs.length; i++) {
                Document doc = searcher.doc(res.scoreDocs[i].doc);
                searchRes.add(new SearchResult(doc.get("nickName"), doc.get("region"), doc.get("class")));
            }
            return searchRes;
        } catch (IOException e) {
            log.error("Error while searching nicknames", e);
            return searchRes;
        }
    }
}
