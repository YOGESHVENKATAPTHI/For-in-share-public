import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertForumSchema, type InsertForum } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Globe, Lock } from "lucide-react";

interface CreateForumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateForumDialog({ open, onOpenChange }: CreateForumDialogProps) {
  const { toast } = useToast();
  const form = useForm<InsertForum>({
    resolver: zodResolver(insertForumSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertForum) => {
      const res = await apiRequest("POST", "/api/forums", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forums"] });
      toast({
        title: "Forum created",
        description: "Your forum has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create forum",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertForum) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-none bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-zinc-100">Create Forum</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Create a new forum to start collaborating with others
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-300">Forum Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="My Awesome Forum"
                      className="h-11 rounded-none bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-600"
                      data-testid="input-forum-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-300">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What's this forum about?"
                      className="resize-none rounded-none bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-600"
                      rows={3}
                      data-testid="input-forum-description"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-zinc-500">
                    A brief description of your forum
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-none border border-zinc-800 bg-zinc-900 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium flex items-center gap-2 text-zinc-200">
                      {field.value ? (
                        <><Globe className="h-4 w-4" /> Public Forum</>
                      ) : (
                        <><Lock className="h-4 w-4" /> Private Forum</>
                      )}
                    </FormLabel>
                    <FormDescription className="text-sm text-zinc-400">
                      {field.value
                        ? "Anyone can view and join this forum"
                        : "Only invited members can access this forum"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-forum-public"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
                className="rounded-none border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-create"
                className="rounded-none bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
              >
                {createMutation.isPending ? "Creating..." : "Create Forum"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
