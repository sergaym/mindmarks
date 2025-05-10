## Core Terminology

1. **Content Items** - The primary resources users interact with:
   - **Sources**: Books, articles, podcasts, videos - the original material
   - **Entries**: Individual items in your library (a specific book, article, etc.)

2. **Annotations** - User-generated content attached to sources:
   - **Notes**: Free-form thoughts and observations
   - **Highlights**: Important excerpts/timestamps from the source
   - **Insights**: Key takeaways and learnings extracted by the user

3. **Collection Organization**:
   - **Collections**: Groups of related entries (like "Product Design" or "Programming")
   - **Tags**: Flexible cross-cutting labels to categorize content
   - **Reading Status**: Tracking progress (To Read, In Progress, Completed)

4. **AI Components**:
   - **Summaries**: AI-generated condensed versions of content
   - **Extraction**: Automatically pulling key concepts/ideas
   - **Insights Engine**: Processing user's notes and content to generate connections
   - **Query System**: Interface for asking questions about consumed content

## Database Structure

```
- Users
  - Collections
    - Entries (Book/Article/Podcast/Video)
      - Metadata (title, author, source URL, publish date, etc.)
      - Content (if available/stored)
      - Annotations (notes, highlights)
      - AI-Generated (summaries, key points)
      - Tags
      - Reading Status
```

This structure allows users to:
1. Organize their learning resources
2. Track progress across different types of media
3. Capture their own thoughts alongside the original content
4. Leverage AI to extract more value from what they've consumed
5. Build connections between different pieces of content

The key is making the system flexible enough to handle different content types while maintaining a consistent user experience for annotating, organizing, and retrieving insights.
