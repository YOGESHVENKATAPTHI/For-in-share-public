import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, X } from 'lucide-react';
import type { Tag } from '@/hooks/use-tags';

interface TagFilterProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onTagSelectionChange: (tagIds: string[]) => void;
  className?: string;
}

export function TagFilter({
  availableTags,
  selectedTagIds,
  onTagSelectionChange,
  className,
}: TagFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTags = availableTags.filter(tag =>
    selectedTagIds.includes(tag.id)
  );

  const handleTagToggle = (tagId: string) => {
    const newSelection = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    onTagSelectionChange(newSelection);
  };

  const handleClearAll = () => {
    onTagSelectionChange([]);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagSelectionChange(selectedTagIds.filter(id => id !== tagId));
  };

  return (
    <div className={className}>
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter trigger */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            
            Filter by tags
            {selectedTagIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedTagIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {filteredTags.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                {searchTerm ? 'No tags found' : 'No tags available'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <Checkbox
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{tag.name}</div>
                        {tag.description && (
                          <div className="text-xs text-muted-foreground">
                            {tag.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}