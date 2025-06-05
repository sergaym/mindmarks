/**
 * Content Service Layer
 * Provides a clean abstraction over content API calls
 * Following Next.js/Vercel best practices for enterprise applications
 */

import type { 
  ContentItem, 
  ContentPage, 
  User
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
   * Fetch all content for a user
   */
  static async getUserContent(user: User): Promise<ContentItem[]> {
    try {
      return await apiFetchUserContent(user);
    } catch (error) {
      console.error('[ContentService] Failed to fetch user content:', error);
      throw error;
    }
  }

  /**
   * Create new content
   */
  static async createContent(
    request: CreateContentRequest,
    user: User
  ) {
    try {
      return await apiCreateContent(request, user);
    } catch (error) {
      console.error('[ContentService] Failed to create content:', error);
      throw error;
    }
  }

  /**
   * Get content page by ID
   */
  static async getContentById(id: string, user: User): Promise<ContentPage | null> {
    try {
      return await apiFetchContentById(id, user);
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
    request: UpdateContentRequest,
    user: User
  ): Promise<ContentPage> {
    try {
      return await apiUpdateContent(id, request, user);
    } catch (error) {
      console.error('[ContentService] Failed to update content:', error);
      throw error;
    }
  }

  /**
   * Delete content
   */
  static async deleteContent(id: string, user: User): Promise<void> {
    try {
      return await apiDeleteContent(id, user);
    } catch (error) {
      console.error('[ContentService] Failed to delete content:', error);
      throw error;
    }
  }
}

// Export as default for clean imports
export default ContentService; 