import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  availableTags: Tag[];
  onCreateTag?: (tag: { name: string; description?: string; color?: string }) => Promise<Tag>;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  selectedTags,
  onTagsChange,
  availableTags,
  onCreateTag,
  placeholder = "Select tags...",
  maxTags,
  className,
}: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6b7280');
  const [isCreating, setIsCreating] = useState(false);

  const filteredTags = availableTags.filter(tag =>
    !selectedTags.some(selected => selected.id === tag.id) &&
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelectTag = (tag: Tag) => {
    if (maxTags && selectedTags.length >= maxTags) return;
    onTagsChange([...selectedTags, tag]);
    setInputValue('');
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !onCreateTag) return;

    setIsCreating(true);
    try {
      const newTag = await onCreateTag({
        name: newTagName.trim(),
        description: newTagDescription.trim() || undefined,
        color: newTagColor,
      });

      onTagsChange([...selectedTags, newTag]);
      setNewTagName('');
      setNewTagDescription('');
      setNewTagColor('#6b7280');
      setCreateDialogOpen(false);
      setInputValue('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateTag = inputValue.trim() &&
    !availableTags.some(tag => tag.name.toLowerCase() === inputValue.toLowerCase()) &&
    !selectedTags.some(tag => tag.name.toLowerCase() === inputValue.toLowerCase()) &&
    onCreateTag;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
              style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={maxTags ? selectedTags.length >= maxTags : false}
          >
            {maxTags && selectedTags.length >= maxTags
              ? `Maximum ${maxTags} tags selected`
              : placeholder
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                {canCreateTag ? (
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{inputValue}"
                    </Button>
                  </div>
                ) : (
                  "No tags found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => handleSelectTag(tag)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.some(selected => selected.id === tag.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <div className="font-medium">{tag.name}</div>
                        {tag.description && (
                          <div className="text-sm text-muted-foreground">
                            {tag.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
                {canCreateTag && (
                  <CommandItem
                    value={`create-${inputValue}`}
                    onSelect={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create "{inputValue}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create tag dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag to categorize your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div>
              <Label htmlFor="tag-description">Description (optional)</Label>
              <Textarea
                id="tag-description"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="Enter tag description"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="tag-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tag-color"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  placeholder="#6b7280"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}