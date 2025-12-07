import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

// Fetch all available tags
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      return response.json();
    },
  });
}

// Fetch tags for a specific entity
export function useEntityTags(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['tags', 'entity', entityType, entityId],
    queryFn: async (): Promise<Tag[]> => {
      const response = await fetch(`/api/tags/entity/${entityType}/${entityId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch entity tags');
      }
      return response.json();
    },
    enabled: !!entityId,
  });
}

// Fetch tags for multiple entities at once (for filtering)
export function useMultipleEntityTags(entities: Array<{ type: string; id: string }>) {
  return useQuery({
    queryKey: ['tags', 'entities', entities.map(e => `${e.type}-${e.id}`).sort()],
    queryFn: async (): Promise<Record<string, Tag[]>> => {
      const results: Record<string, Tag[]> = {};
      
      // Fetch tags for each entity
      await Promise.all(
        entities.map(async ({ type, id }) => {
          try {
            const response = await fetch(`/api/tags/entity/${type}/${id}`);
            if (response.ok) {
              const tags = await response.json();
              results[`${type}-${id}`] = tags;
            } else {
              results[`${type}-${id}`] = [];
            }
          } catch (error) {
            console.error(`Failed to fetch tags for ${type} ${id}:`, error);
            results[`${type}-${id}`] = [];
          }
        })
      );
      
      return results;
    },
    enabled: entities.length > 0,
  });
}

// Create a new tag
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: { name: string; description?: string; color?: string }): Promise<Tag> => {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create tag');
      }

      return response.json();
    },
    onSuccess: (newTag) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({ queryKey: ['tags'] });

      toast({
        title: 'Tag created',
        description: `Tag "${newTag.name}" has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create tag',
        variant: 'destructive',
      });
    },
  });
}

// Assign tags to an entity
export function useAssignTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      tagIds,
    }: {
      entityType: string;
      entityId: string;
      tagIds: string[];
    }): Promise<any[]> => {
      const response = await fetch('/api/tags/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entityType, entityId, tagIds }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to assign tags');
      }

      return response.json();
    },
    onSuccess: (_, { entityType, entityId }) => {
      // Invalidate entity tags
      queryClient.invalidateQueries({
        queryKey: ['tags', 'entity', entityType, entityId],
      });

      toast({
        title: 'Tags assigned',
        description: 'Tags have been assigned successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign tags',
        variant: 'destructive',
      });
    },
  });
}

// Remove a tag from an entity
export function useRemoveTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      tagId,
    }: {
      entityType: string;
      entityId: string;
      tagId: string;
    }): Promise<void> => {
      const response = await fetch(`/api/tags/assign/${entityType}/${entityId}/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to remove tag');
      }
    },
    onSuccess: (_, { entityType, entityId }) => {
      // Invalidate entity tags
      queryClient.invalidateQueries({
        queryKey: ['tags', 'entity', entityType, entityId],
      });

      toast({
        title: 'Tag removed',
        description: 'Tag has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove tag',
        variant: 'destructive',
      });
    },
  });
}

// Hook for managing tags on an entity (combines fetching and mutations)
export function useEntityTagManager(entityType: string, entityId: string) {
  const { data: entityTags = [], isLoading } = useEntityTags(entityType, entityId);
  const { data: allTags = [] } = useTags();

  const [selectedTags, setSelectedTags] = useState<Tag[]>(entityTags);

  const createTagMutation = useCreateTag();
  const assignTagsMutation = useAssignTags();
  const removeTagMutation = useRemoveTag();

  // Sync selectedTags with fetched entityTags only when they actually change
  useEffect(() => {
    const tagsEqual = entityTags.length === selectedTags.length &&
      entityTags.every((tag, index) => tag.id === selectedTags[index]?.id);
    
    if (!tagsEqual) {
      setSelectedTags(entityTags);
    }
  }, [entityTags]); // Remove selectedTags from deps to prevent infinite loop

  const handleTagsChange = async (newTags: Tag[]) => {
    const currentTagIds = selectedTags.map(tag => tag.id);
    const newTagIds = newTags.map(tag => tag.id);

    // Find tags to add
    const tagsToAdd = newTags.filter(tag => !currentTagIds.includes(tag.id));
    // Find tags to remove
    const tagsToRemove = selectedTags.filter(tag => !newTagIds.includes(tag.id));

    // Update local state immediately for responsive UI
    setSelectedTags(newTags);

    try {
      // Assign new tags
      if (tagsToAdd.length > 0) {
        await assignTagsMutation.mutateAsync({
          entityType,
          entityId,
          tagIds: tagsToAdd.map(tag => tag.id),
        });
      }

      // Remove old tags
      for (const tag of tagsToRemove) {
        await removeTagMutation.mutateAsync({
          entityType,
          entityId,
          tagId: tag.id,
        });
      }
    } catch (error) {
      // Revert local state on error
      setSelectedTags(selectedTags);
      throw error;
    }
  };

  const handleCreateTag = async (tagData: { name: string; description?: string; color?: string }) => {
    return await createTagMutation.mutateAsync(tagData);
  };

  return {
    selectedTags,
    availableTags: allTags,
    isLoading,
    handleTagsChange,
    handleCreateTag,
    isUpdating: assignTagsMutation.isPending || removeTagMutation.isPending || createTagMutation.isPending,
  };
}