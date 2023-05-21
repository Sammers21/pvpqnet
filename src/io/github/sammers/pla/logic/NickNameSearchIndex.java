package io.github.sammers.pla.logic;

import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.*;
import org.apache.lucene.queryparser.classic.ParseException;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.store.ByteBuffersDirectory;
import org.apache.lucene.store.Directory;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.slf4j.Logger;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class NickNameSearchIndex {

    private static final Logger log = org.slf4j.LoggerFactory.getLogger(NickNameSearchIndex.class);
    private final Directory index;
    private final StandardAnalyzer analyzer;

    public NickNameSearchIndex(){
        index = new ByteBuffersDirectory();
        analyzer = new StandardAnalyzer();
    }

    public void insertNickNames(String... nickNames) {
        try {
            IndexWriterConfig config = new IndexWriterConfig(analyzer);
            IndexWriter w = new IndexWriter(index, config);
            for (String nickName : nickNames) {
                Document doc = new Document();
                doc.add(new org.apache.lucene.document.TextField("nickName", nickName, org.apache.lucene.document.Field.Store.YES));
                w.addDocument(doc);
            }
            w.close();
        } catch (IOException e) {
            log.error("Error while inserting nicknames", e);
        }
    }

    public List<String> searchNickNames(String query) {
        List<String> searchRes = new ArrayList<>();
        try {
            Query q = new PrefixQuery(new Term("nickName", query));
            IndexReader indexReader = DirectoryReader.open(index);
            IndexSearcher searcher = new IndexSearcher(indexReader);
            TopDocs res = searcher.search(q, 10);
            for(int i = 0; i < res.scoreDocs.length; i++){
                Document doc = searcher.doc(res.scoreDocs[i].doc);
                searchRes.add(doc.get("nickName"));
            }
            return searchRes;
        } catch (IOException e) {
            log.error("Error while searching nicknames", e);
            return searchRes;
        }
    }
}
