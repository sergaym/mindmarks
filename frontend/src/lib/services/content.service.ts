/**
 * Content Service Layer
 * Provides a clean abstraction over content API calls
 * Following Next.js/Vercel best practices for enterprise applications
 */

import type { 
  ContentItem, 
  ContentPage
} from '@/types/content';
import type {
  CreateContentRequest,
  UpdateContentRequest
} from '@/lib/api/content';
import { 
  fetchUserContent as apiFetchUserContent,
  createContent as apiCreateContent,
  fetchContentById as apiFetchContentById,
  updateContent as apiUpdateContent,
  deleteContent as apiDeleteContent,
  ContentApiError
} from '@/lib/api/content';

export class ContentService {
  /**
   * Fetch all content for authenticated user
   */
  static async getUserContent(): Promise<ContentItem[]> {
    try {
      return await apiFetchUserContent();
    } catch (error) {
      console.error('[ContentService] Failed to fetch user content:', error);
      throw error;
    }
  }

  /**
   * Create new content
   */
  static async createContent(
    request: CreateContentRequest
  ) {
    try {
      return await apiCreateContent(request);
    } catch (error) {
      console.error('[ContentService] Failed to create content:', error);
      throw error;
    }
  }

  /**
   * Get content page by ID
   */
  static async getContentById(id: string): Promise<ContentPage | null> {
    try {
      return await apiFetchContentById(id);
    } catch (error) {
      if (error instanceof ContentApiError && error.status === 404) {
        return null;
      }
      console.error('[ContentService] Failed to fetch content:', error);
      throw error;
    }
  }

  /**
   * Update content
   */
  static async updateContent(
    id: string,
    request: UpdateContentRequest
  ): Promise<ContentPage> {
    try {
      return await apiUpdateContent(id, request);
    } catch (error) {
      console.error('[ContentService] Failed to update content:', error);
      throw error;
    }
  }

  /**
   * Delete content
   */
  static async deleteContent(id: string): Promise<void> {
    try {
      return await apiDeleteContent(id);
    } catch (error) {
      console.error('[ContentService] Failed to delete content:', error);
      throw error;
    }
  }
}

// Export as default for clean imports
export default ContentService; 