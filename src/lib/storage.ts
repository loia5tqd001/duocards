import { supabase, isSupabaseConfigured, type Database } from "./supabase";
import type { Card } from "./utils";
import type { User } from "@supabase/supabase-js";

export interface SyncResult {
  success: boolean;
  conflictCount: number;
  updatedCount: number;
  error?: string;
}

export class StorageManager {
  private static instance: StorageManager;
  private syncInProgress = false;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Convert local card to Supabase format
  private cardToSupabase(card: Card, userId: string) {
    return {
      id: card.id,
      user_id: userId,
      english: card.english,
      vietnamese: card.vietnamese,
      example: card.example || null,
      phonetic: card.phonetic || null,
      created_at: new Date(card.createdAt).toISOString(),
      updated_at: new Date().toISOString(),
      status: card.status,
      interval: card.interval,
      step_index: card.stepIndex,
      next_review: new Date(card.nextReview).toISOString(),
      lapses: card.lapses,
      reps: card.reps,
      last_review: card.lastReview
        ? new Date(card.lastReview).toISOString()
        : null,
    };
  }

  // Convert Supabase data to local card format
  private supabaseToCard(
    row: Database["public"]["Tables"]["cards"]["Row"],
  ): Card {
    return {
      id: row.id,
      english: row.english,
      vietnamese: row.vietnamese,
      example: row.example || undefined,
      phonetic: row.phonetic || undefined,
      createdAt: new Date(row.created_at).getTime(),
      status: row.status,
      interval: row.interval,
      stepIndex: row.step_index,
      nextReview: new Date(row.next_review).getTime(),
      lapses: row.lapses,
      reps: row.reps,
      lastReview: row.last_review
        ? new Date(row.last_review).getTime()
        : undefined,
    };
  }

  // Upload local cards to Supabase (when user first logs in)
  async uploadLocalCards(cards: Card[], user: User): Promise<SyncResult> {
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured, skipping upload");
      return { success: true, conflictCount: 0, updatedCount: 0 };
    }

    try {
      if (this.syncInProgress) {
        return {
          success: false,
          conflictCount: 0,
          updatedCount: 0,
          error: "Sync already in progress",
        };
      }

      this.syncInProgress = true;

      if (cards.length === 0) {
        return { success: true, conflictCount: 0, updatedCount: 0 };
      }

      const supabaseCards = cards.map((card) =>
        this.cardToSupabase(card, user.id),
      );

      const { error } = await supabase.from("cards").upsert(supabaseCards, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

      if (error) throw error;

      return {
        success: true,
        conflictCount: 0,
        updatedCount: cards.length,
      };
    } catch (error) {
      console.error("Error uploading local cards:", error);
      return {
        success: false,
        conflictCount: 0,
        updatedCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Download cards from Supabase
  async downloadCards(
    user: User,
  ): Promise<{ cards: Card[]; success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured, returning empty cards");
      return { cards: [], success: true };
    }

    try {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const cards = (data || []).map((row) => this.supabaseToCard(row));

      return { cards, success: true };
    } catch (error) {
      console.error("Error downloading cards:", error);
      return {
        cards: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Sync local and remote cards (handles conflicts)
  async syncCards(localCards: Card[], user: User): Promise<SyncResult> {
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured, skipping sync");
      return { success: true, conflictCount: 0, updatedCount: 0 };
    }

    try {
      if (this.syncInProgress) {
        return {
          success: false,
          conflictCount: 0,
          updatedCount: 0,
          error: "Sync already in progress",
        };
      }

      this.syncInProgress = true;

      // Download remote cards
      const { cards: remoteCards, success } = await this.downloadCards(user);
      if (!success) {
        throw new Error("Failed to download remote cards");
      }

      // Create maps for efficient lookup
      const remoteMap = new Map(remoteCards.map((card) => [card.id, card]));

      const toUpdate: Database["public"]["Tables"]["cards"]["Insert"][] = [];
      const toInsert: Database["public"]["Tables"]["cards"]["Insert"][] = [];
      let conflictCount = 0;

      // Process local cards
      for (const localCard of localCards) {
        const remoteCard = remoteMap.get(localCard.id);

        if (!remoteCard) {
          // Local card doesn't exist remotely - insert
          toInsert.push(this.cardToSupabase(localCard, user.id));
        } else {
          // Card exists both locally and remotely - check for conflicts
          const localModified = localCard.lastReview || localCard.createdAt;
          const remoteModified = new Date(
            remoteCard.lastReview || remoteCard.createdAt,
          ).getTime();

          if (localModified > remoteModified) {
            // Local is newer - update remote
            toUpdate.push(this.cardToSupabase(localCard, user.id));
          } else if (localModified < remoteModified) {
            // Remote is newer - will be handled in merge step
            conflictCount++;
          }
          // If equal, no action needed
        }
      }

      // Insert new local cards
      if (toInsert.length > 0) {
        const { error } = await supabase.from("cards").insert(toInsert);
        if (error) throw error;
      }

      // Update existing cards where local is newer
      if (toUpdate.length > 0) {
        const { error } = await supabase
          .from("cards")
          .upsert(toUpdate, { onConflict: "id" });
        if (error) throw error;
      }

      return {
        success: true,
        conflictCount,
        updatedCount: toInsert.length + toUpdate.length,
      };
    } catch (error) {
      console.error("Error syncing cards:", error);
      return {
        success: false,
        conflictCount: 0,
        updatedCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Save single card to Supabase (optimistic updates)
  async saveCard(card: Card, user: User): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured, skipping save");
      return true;
    }

    try {
      const supabaseCard = this.cardToSupabase(card, user.id);

      const { error } = await supabase
        .from("cards")
        .upsert([supabaseCard], { onConflict: "id" });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error saving card to Supabase:", error);
      return false;
    }
  }

  // Delete card from Supabase
  async deleteCard(cardId: string, user: User): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured, skipping delete");
      return true;
    }

    try {
      const { error } = await supabase
        .from("cards")
        .delete()
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting card from Supabase:", error);
      return false;
    }
  }
}
