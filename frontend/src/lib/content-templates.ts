import { ContentTemplate, ContentType } from '@/types/content';

// Plate editor initial content templates
const bookTemplate = [
  {
    type: 'h1',
    children: [{ text: 'Book Notes' }],
  },
  {
    type: 'h2',
    children: [{ text: '📖 Overview' }],
  },
  {
    type: 'p',
    children: [{ text: 'Author: ' }, { text: '', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: 'Publication Year: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Genre: ' }],
  },
  {
    type: 'h2',
    children: [{ text: '🎯 Key Takeaways' }],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Main insight #1' }] },
      { type: 'li', children: [{ text: 'Main insight #2' }] },
      { type: 'li', children: [{ text: 'Main insight #3' }] },
    ],
  },
  {
    type: 'h2',
    children: [{ text: '📝 Chapter Notes' }],
  },
  {
    type: 'p',
    children: [{ text: 'Add your chapter-by-chapter notes here...' }],
  },
  {
    type: 'h2',
    children: [{ text: '💭 Personal Reflection' }],
  },
  {
    type: 'p',
    children: [{ text: 'How does this apply to your life or work?' }],
  },
  {
    type: 'h2',
    children: [{ text: '⭐ Rating & Review' }],
  },
  {
    type: 'p',
    children: [{ text: 'Rating: ⭐⭐⭐⭐⭐' }],
  },
  {
    type: 'p',
    children: [{ text: 'Would you recommend this book? Why?' }],
  },
];

const articleTemplate = [
  {
    type: 'h1',
    children: [{ text: 'Article Summary' }],
  },
  {
    type: 'h2',
    children: [{ text: '📰 Article Info' }],
  },
  {
    type: 'p',
    children: [{ text: 'Author: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Publication: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Date: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Reading Time: ' }],
  },
  {
    type: 'h2',
    children: [{ text: '🎯 Main Points' }],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Key point #1' }] },
      { type: 'li', children: [{ text: 'Key point #2' }] },
      { type: 'li', children: [{ text: 'Key point #3' }] },
    ],
  },
  {
    type: 'h2',
    children: [{ text: '💡 Insights' }],
  },
  {
    type: 'p',
    children: [{ text: 'What new insights did you gain?' }],
  },
  {
    type: 'h2',
    children: [{ text: '🔗 Related Topics' }],
  },
  {
    type: 'p',
    children: [{ text: 'What other topics or articles does this connect to?' }],
  },
];

const videoTemplate = [
  {
    type: 'h1',
    children: [{ text: 'Video Notes' }],
  },
  {
    type: 'h2',
    children: [{ text: '🎬 Video Info' }],
  },
  {
    type: 'p',
    children: [{ text: 'Creator: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Platform: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Duration: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Topic: ' }],
  },
  {
    type: 'h2',
    children: [{ text: '⏱️ Timestamps' }],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: '00:00 - Introduction' }] },
      { type: 'li', children: [{ text: '05:30 - Main topic discussion' }] },
      { type: 'li', children: [{ text: '15:45 - Key insight' }] },
    ],
  },
  {
    type: 'h2',
    children: [{ text: '📝 Notes' }],
  },
  {
    type: 'p',
    children: [{ text: 'Add your detailed notes here...' }],
  },
  {
    type: 'h2',
    children: [{ text: '🎯 Action Items' }],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'What will you implement from this video?' }] },
    ],
  },
];

const podcastTemplate = [
  {
    type: 'h1',
    children: [{ text: 'Podcast Notes' }],
  },
  {
    type: 'h2',
    children: [{ text: '🎙️ Episode Info' }],
  },
  {
    type: 'p',
    children: [{ text: 'Show: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Host: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Guest: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Episode: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Duration: ' }],
  },
  {
    type: 'h2',
    children: [{ text: '🎯 Key Discussion Points' }],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Main topic #1' }] },
      { type: 'li', children: [{ text: 'Main topic #2' }] },
      { type: 'li', children: [{ text: 'Main topic #3' }] },
    ],
  },
  {
    type: 'h2',
    children: [{ text: '💬 Memorable Quotes' }],
  },
  {
    type: 'blockquote',
    children: [{ text: 'Add impactful quotes here...' }],
  },
  {
    type: 'h2',
    children: [{ text: '🧠 Learnings' }],
  },
  {
    type: 'p',
    children: [{ text: 'What did you learn that you didn\'t know before?' }],
  },
];

const courseTemplate = [
  {
    type: 'h1',
    children: [{ text: 'Course Notes' }],
  },
  {
    type: 'h2',
    children: [{ text: '🎓 Course Info' }],
  },
  {
    type: 'p',
    children: [{ text: 'Course Title: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Instructor: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Platform: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Duration: ' }],
  },
  {
    type: 'p',
    children: [{ text: 'Skill Level: ' }],
  },
  {
    type: 'h2',
    children: [{ text: '📚 Module Breakdown' }],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Module 1: ' }] },
      { type: 'li', children: [{ text: 'Module 2: ' }] },
      { type: 'li', children: [{ text: 'Module 3: ' }] },
    ],
  },
  {
    type: 'h2',
    children: [{ text: '🎯 Learning Objectives' }],
  },
  {
    type: 'p',
    children: [{ text: 'What skills will you gain from this course?' }],
  },
  {
    type: 'h2',
    children: [{ text: '📝 Progress Notes' }],
  },
  {
    type: 'p',
    children: [{ text: 'Track your progress and key learnings...' }],
  },
];

const researchTemplate = [
  {
    type: 'h1',
    children: [{ text: 'Research Notes' }],
  },
  {
    type: 'h2',
    children: [{ text: '🔬 Research Question' }],
  },
  {
    type: 'p',
    children: [{ text: 'What are you trying to understand or solve?' }],
  },
  {
    type: 'h2',
    children: [{ text: '📊 Sources' }],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Source 1: ' }] },
      { type: 'li', children: [{ text: 'Source 2: ' }] },
      { type: 'li', children: [{ text: 'Source 3: ' }] },
    ],
  },
  {
    type: 'h2',
    children: [{ text: '🔍 Findings' }],
  },
  {
    type: 'p',
    children: [{ text: 'Document your key findings here...' }],
  },
  {
    type: 'h2',
    children: [{ text: '📈 Data & Evidence' }],
  },
  {
    type: 'p',
    children: [{ text: 'Include charts, statistics, or other evidence...' }],
  },
  {
    type: 'h2',
    children: [{ text: '💡 Conclusions' }],
  },
  {
    type: 'p',
    children: [{ text: 'What conclusions can you draw from this research?' }],
  },
];

const noteTemplate = [
  {
    type: 'h1',
    children: [{ text: 'Quick Note' }],
  },
  {
    type: 'p',
    children: [{ text: 'Start writing your thoughts here...' }],
  },
];

// Content templates configuration
export const contentTemplates: ContentTemplate[] = [
  {
    type: 'book',
    title: 'Book Notes',
    description: 'Comprehensive template for taking book notes with sections for overview, takeaways, and reflection',
    icon: '📚',
    defaultContent: bookTemplate,
    suggestedTags: ['books', 'reading', 'literature', 'non-fiction'],
    estimatedTimeRange: [120, 720], // 2 hours to 12 hours
  },
  {
    type: 'article',
    title: 'Article Summary',
    description: 'Perfect for summarizing articles, blog posts, and written content',
    icon: '📰',
    defaultContent: articleTemplate,
    suggestedTags: ['articles', 'news', 'blogs', 'research'],
    estimatedTimeRange: [10, 60], // 10 minutes to 1 hour
  },
  {
    type: 'video',
    title: 'Video Notes',
    description: 'Template for videos, tutorials, and visual content with timestamps',
    icon: '🎬',
    defaultContent: videoTemplate,
    suggestedTags: ['videos', 'tutorials', 'youtube', 'learning'],
    estimatedTimeRange: [15, 180], // 15 minutes to 3 hours
  },
  {
    type: 'podcast',
    title: 'Podcast Notes',
    description: 'Capture key insights from podcasts and audio content',
    icon: '🎙️',
    defaultContent: podcastTemplate,
    suggestedTags: ['podcasts', 'audio', 'interviews', 'discussions'],
    estimatedTimeRange: [30, 240], // 30 minutes to 4 hours
  },
  {
    type: 'course',
    title: 'Course Notes',
    description: 'Structured template for online courses and educational content',
    icon: '🎓',
    defaultContent: courseTemplate,
    suggestedTags: ['courses', 'education', 'learning', 'skills'],
    estimatedTimeRange: [180, 2400], // 3 hours to 40 hours
  },
  {
    type: 'research',
    title: 'Research Notes',
    description: 'Organize research findings, sources, and conclusions',
    icon: '🔬',
    defaultContent: researchTemplate,
    suggestedTags: ['research', 'analysis', 'data', 'findings'],
    estimatedTimeRange: [60, 480], // 1 hour to 8 hours
  },
  {
    type: 'note',
    title: 'Quick Note',
    description: 'Simple template for quick thoughts and ideas',
    icon: '📝',
    defaultContent: noteTemplate,
    suggestedTags: ['notes', 'thoughts', 'ideas'],
    estimatedTimeRange: [5, 30], // 5 to 30 minutes
  },
  {
    type: 'other',
    title: 'Custom Content',
    description: 'Blank template for any other type of content',
    icon: '📄',
    defaultContent: noteTemplate,
    suggestedTags: ['custom'],
    estimatedTimeRange: [10, 120], // 10 minutes to 2 hours
  },
];

// Helper functions
export function getTemplateByType(type: ContentType): ContentTemplate | undefined {
  return contentTemplates.find(template => template.type === type);
}

export function getTemplateIcon(type: ContentType): string {
  const template = getTemplateByType(type);
  return template?.icon || '📄';
}

export function getTemplateSuggestedTags(type: ContentType): string[] {
  const template = getTemplateByType(type);
  return template?.suggestedTags || [];
} 