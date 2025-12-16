package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.PvpBracket;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.lucene.analysis.*;
import org.apache.lucene.analysis.miscellaneous.ASCIIFoldingFilter;
import org.apache.lucene.analysis.no.NorwegianAnalyzer;
import org.apache.lucene.analysis.pattern.SimplePatternTokenizer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.StoredField;
import org.apache.lucene.index.*;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.store.ByteBuffersDirectory;
import org.apache.lucene.store.Directory;
import org.slf4j.Logger;

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
      .map(this::createSearchResult)
      .toList();
    insertNickNames(list);
  }

  /**
   * Create a SearchResult from a WowAPICharacter with all enriched data.
   */
  private SearchResult createSearchResult(WowAPICharacter charz) {
    // Find best bracket (by rank first, then rating)
    Long bestRank = null;
    Long bestRating = null;
    String inBracket = null;
    if (charz.brackets() != null && !charz.brackets().isEmpty()) {
      PvpBracket bestByRank = null;
      PvpBracket bestByRating = null;
      for (PvpBracket bracket : charz.brackets()) {
        // Track best by rank
        if (bracket.rank() != null && bracket.rank() > 0) {
          if (bestByRank == null || bracket.rank() < bestByRank.rank()) {
            bestByRank = bracket;
          }
        }
        // Track best by rating
        if (bracket.rating() != null && bracket.rating() > 0) {
          if (bestByRating == null || bracket.rating() > bestByRating.rating()) {
            bestByRating = bracket;
          }
        }
      }
      // Prefer rank over rating for determining the "best" bracket
      if (bestByRank != null) {
        bestRank = bestByRank.rank();
        bestRating = bestByRank.rating();
        inBracket = normalizeBracketType(bestByRank.bracketType());
      } else if (bestByRating != null) {
        bestRank = bestByRating.rank();
        bestRating = bestByRating.rating();
        inBracket = normalizeBracketType(bestByRating.bracketType());
      }
    }
    // Extract achievement info
    AchievementTier.AchievementInfo achievementInfo = AchievementTier.extractHighestAchievement(charz);
    String highestAchievement = achievementInfo != null ? achievementInfo.name() : null;
    Integer highestAchievementTimes = achievementInfo != null ? achievementInfo.count() : null;
    Integer highestAchievementTier = achievementInfo != null ? achievementInfo.tier() : null;
    return new SearchResult(charz.fullName(), charz.region(), charz.clazz(), charz.race(), highestAchievement,
      highestAchievementTimes, highestAchievementTier, bestRank, bestRating, inBracket);
  }

  /**
   * Normalize bracket type for display (e.g., "SHUFFLE-Holy Priest" ->
   * "Shuffle").
   */
  private String normalizeBracketType(String bracketType) {
    if (bracketType == null)
      return null;
    if (bracketType.startsWith("SHUFFLE"))
      return "Shuffle";
    if (bracketType.startsWith("BLITZ"))
      return "Blitz";
    if (bracketType.equals("3v3") || bracketType.equals("ARENA_3v3"))
      return "3v3";
    if (bracketType.equals("2v2") || bracketType.equals("ARENA_2v2"))
      return "2v2";
    if (bracketType.equals("BATTLEGROUNDS"))
      return "RBG";
    return bracketType;
  }

  protected synchronized void insertNickNames(SearchResult... searchResults) {
    try {
      IndexWriterConfig config = new IndexWriterConfig(analyzer);
      IndexWriter w = new IndexWriter(index, config);
      for (SearchResult searchResult : searchResults) {
        Document doc = new Document();
        doc.add(new org.apache.lucene.document.TextField("nickName", searchResult.nick(),
          org.apache.lucene.document.Field.Store.YES));
        doc.add(new org.apache.lucene.document.TextField("region", searchResult.region(),
          org.apache.lucene.document.Field.Store.YES));
        doc.add(new org.apache.lucene.document.TextField("class", searchResult.clazz(),
          org.apache.lucene.document.Field.Store.YES));
        // Store additional fields
        if (searchResult.race() != null) {
          doc.add(new StoredField("race", searchResult.race()));
        }
        if (searchResult.highestAchievement() != null) {
          doc.add(new StoredField("highestAchievement", searchResult.highestAchievement()));
        }
        if (searchResult.highestAchievementTimes() != null) {
          doc.add(new StoredField("highestAchievementTimes", searchResult.highestAchievementTimes()));
        }
        if (searchResult.highestAchievementTier() != null) {
          doc.add(new StoredField("highestAchievementTier", searchResult.highestAchievementTier()));
        }
        if (searchResult.bestRank() != null) {
          doc.add(new StoredField("bestRank", searchResult.bestRank()));
        }
        if (searchResult.bestRating() != null) {
          doc.add(new StoredField("bestRating", searchResult.bestRating()));
        }
        if (searchResult.inBracket() != null) {
          doc.add(new StoredField("inBracket", searchResult.inBracket()));
        }
        w.addDocument(doc);
      }
      w.close();
    } catch (IOException e) {
      log.error("Error while inserting nicknames", e);
    }
  }

  public synchronized void deleteNickName(String nickName) {
    if (nickName == null || nickName.isBlank()) {
      return;
    }
    try {
      IndexWriterConfig config = new IndexWriterConfig(analyzer);
      IndexWriter w = new IndexWriter(index, config);
      w.deleteDocuments(new Term("nickName", nickName));
      w.commit();
      w.close();
    } catch (IOException e) {
      log.error("Error while deleting nickname {}", nickName, e);
    }
  }

  public List<SearchResult> searchNickNames(String query) {
    List<SearchResult> searchRes = new ArrayList<>();
    try {
      Query q = new PrefixQuery(new Term("nickName", query));
      IndexReader indexReader = DirectoryReader.open(index);
      IndexSearcher searcher = new IndexSearcher(indexReader);
      TopDocs res = searcher.search(q, 100); // Get more results for better sorting
      for (int i = 0; i < res.scoreDocs.length; i++) {
        Document doc = searcher.storedFields().document(res.scoreDocs[i].doc);
        SearchResult sr = new SearchResult(doc.get("nickName"), doc.get("region"), doc.get("class"), doc.get("race"),
          doc.get("highestAchievement"), getIntField(doc, "highestAchievementTimes"),
          getIntField(doc, "highestAchievementTier"), getLongField(doc, "bestRank"), getLongField(doc, "bestRating"),
          doc.get("inBracket"));
        searchRes.add(sr);
      }
      // Sort results by rank, then rating, then achievement tier
      searchRes.sort(SearchResult.RANK_RATING_ACHIEVEMENT_COMPARATOR);
      // Limit to top 20 after sorting
      if (searchRes.size() > 20) {
        searchRes = new ArrayList<>(searchRes.subList(0, 20));
      }
      return searchRes;
    } catch (IOException e) {
      log.error("Error while searching nicknames", e);
      return searchRes;
    }
  }

  private Integer getIntField(Document doc, String fieldName) {
    org.apache.lucene.index.IndexableField field = doc.getField(fieldName);
    if (field == null)
      return null;
    Number num = field.numericValue();
    return num != null ? num.intValue() : null;
  }

  private Long getLongField(Document doc, String fieldName) {
    org.apache.lucene.index.IndexableField field = doc.getField(fieldName);
    if (field == null)
      return null;
    Number num = field.numericValue();
    return num != null ? num.longValue() : null;
  }
}
